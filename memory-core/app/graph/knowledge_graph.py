from __future__ import annotations

import json
from pathlib import Path

import networkx as nx

from app.config import settings
from app.schemas.timeline import MemoryUnitOut


def _path() -> Path:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    return settings.data_dir / settings.graph_path


def load_graph() -> nx.DiGraph:
    p = _path()
    if p.is_file():
        g_any = nx.read_graphml(p)
        return nx.DiGraph(g_any)
    return nx.DiGraph()


def save_graph(g: nx.DiGraph) -> None:
    nx.write_graphml(g, _path())


def sync_units_to_graph(units: list[MemoryUnitOut], *, link_entities: bool = True) -> nx.DiGraph:
    """
    Link consecutive memory units on the same video (temporal next).
    Optional lightweight entity nodes from capitalized phrases / hashtags.
    """
    from app.pipeline.nlp_extract import extract_entity_candidates

    g = load_graph()
    by_video: dict[str, list[MemoryUnitOut]] = {}
    for u in units:
        by_video.setdefault(u.videoId, []).append(u)
    for vid, lst in by_video.items():
        lst.sort(key=lambda x: x.startSec)
        g.add_node(f"video:{vid}", type="video", label=vid)
        for u in lst:
            g.add_node(u.id, type="memory_unit", title=u.title, summary=u.summary[:200])
            g.add_edge(f"video:{vid}", u.id, relation="contains")
            if link_entities:
                blob = f"{u.title}\n{u.summary}"
                for ent in extract_entity_candidates(blob, max_n=12):
                    nid = f"entity:{ent}"
                    if not g.has_node(nid):
                        g.add_node(nid, type="entity", label=ent)
                    g.add_edge(u.id, nid, relation="mentions")
        for a, b in zip(lst, lst[1:]):
            g.add_edge(a.id, b.id, relation="next_in_time")
    save_graph(g)
    return g


def graph_stats() -> dict:
    g = load_graph()
    return {"nodes": g.number_of_nodes(), "edges": g.number_of_edges()}


def export_graph_json() -> str:
    g = load_graph()
    return json.dumps(nx.node_link_data(g), ensure_ascii=False)
