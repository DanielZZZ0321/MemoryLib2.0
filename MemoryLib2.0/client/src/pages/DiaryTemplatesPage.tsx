import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, PlayCircle, Heart, MapPin, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import campusData from "../../../data/seed/frontend-backend-campus-life.json";

interface Media {
  id: string;
  type: "photo" | "video";
  title: string;
  url: string;
  caption?: string;
  durationSec?: number;
}

interface Event {
  id: string;
  title: string;
  summary: string;
  startTime: string;
  endTime: string;
  location: string;
  tags: string[];
  media: Media[];
}

export default function DiaryTemplatesPage() {
  const events = (campusData.events as Event[]) || [];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F9FAFB] dark:bg-[#09090B] text-foreground font-sans overflow-hidden transition-colors duration-300">
      <header className="flex-none relative z-20 border-b bg-background/80 px-6 py-4 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full hover:bg-slate-200 dark:hover:bg-slate-800")}
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">多模态日记空间</h1>
              <p className="text-xs text-muted-foreground font-medium">校园生活记忆库</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        <Tabs defaultValue="canvas" className="flex-1 flex flex-col w-full h-full">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-full p-1 shadow-md bg-background/90 backdrop-blur border">
              <TabsTrigger value="canvas" className="rounded-full text-sm font-medium transition-all gap-2">
                ⏳ Timeline
              </TabsTrigger>
              <TabsTrigger value="feed" className="rounded-full text-sm font-medium transition-all gap-2">
                🌸 Report
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="canvas" className="flex-1 h-full w-full m-0 p-0 border-none outline-none focus-visible:ring-0 data-[state=active]:flex animate-in fade-in zoom-in-95 duration-500">
            <VerticalCanvasTimeline events={events} />
          </TabsContent>

          <TabsContent value="feed" className="flex-1 h-full w-full m-0 p-0 border-none outline-none focus-visible:ring-0 overflow-y-auto data-[state=active]:block animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-24 pb-20">
              <HybridFeedTemplate events={events} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. Vertical Canvas Timeline (时光画卷 = 无限画布 + 垂直时间轴)
// ----------------------------------------------------------------------

function VerticalCanvasTimeline({ events }: { events: Event[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on middle mouse or if clicking background/line directly
    if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== 'path' && (e.target as HTMLElement).tagName !== 'svg' && e.target !== containerRef.current?.firstChild && e.button !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    setPosition(prev => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY
    }));
  };

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Layout metrics
  const cardWidth = 360;
  const verticalSpacing = 280;
  const canvasWidth = 4000;
  const centerX = canvasWidth / 2;

  // Center initial view to the first event (which is near centerX, y=100)
  useEffect(() => {
    setPosition({ x: window.innerWidth / 2 - centerX, y: 100 });
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-[#FAFAFA] dark:bg-[#111111]",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: `${position.x}px ${position.y}px`
      }}
    >
      <div 
        className="absolute top-0 left-0 transition-transform duration-75 ease-out w-[4000px] h-[10000px]"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {/* Vertical Central Time Line */}
        <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent" style={{ left: centerX - 2 }} />

        {sortedEvents.map((event, index) => {
          const isLeft = index % 2 === 0;
          const posX = isLeft ? centerX - cardWidth - 40 : centerX + 40;
          const posY = 100 + index * verticalSpacing;
          
          const timeString = new Date(event.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
          
          return (
            <div key={event.id}>
              {/* Timeline dot */}
              <div 
                className="absolute flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-primary shadow-sm z-10 text-white font-bold text-xs"
                style={{ left: centerX - 20, top: posY + 40 }}
              >
                {timeString}
              </div>

              {/* Event Card */}
              <div 
                className="absolute group z-0"
                style={{ left: posX, top: posY, width: cardWidth }}
              >
                {/* Horizontal connecting line to dot */}
                <div 
                  className="absolute h-px bg-slate-200 dark:bg-slate-800 pointer-events-none" 
                  style={{ 
                    top: 60, 
                    width: 40, 
                    [isLeft ? 'right' : 'left']: -40 
                  }} 
                />

                <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                  <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-950/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary/80">{event.location}</span>
                      <div className="flex gap-1">
                        {event.tags.filter(t => t.startsWith("Mood:")).map(t => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                            {t.replace("Mood: ", "")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-lg tracking-tight">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">{event.summary}</p>
                    
                    {/* Compact Media Gallery */}
                    {event.media && event.media.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden">
                        {event.media.slice(0, 4).map((m, i) => (
                          <div key={m.id} className={cn("relative bg-slate-100 dark:bg-slate-800 aspect-video group/media", 
                            event.media.length === 1 ? 'col-span-2' : 
                            event.media.length === 3 && i === 0 ? 'col-span-2' : '')}>
                            {m.type === "video" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/media:bg-black/20 transition-colors z-10">
                                <PlayCircle className="text-white opacity-90 size-6 drop-shadow-md" />
                              </div>
                            )}
                            <img 
                              src={m.url.startsWith("http") ? m.url : `https://picsum.photos/seed/${m.id}/400/300`} 
                              alt={m.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur rounded-full border shadow-sm text-xs text-muted-foreground pointer-events-none z-50">
        <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">中键</span>
        <span>或拖动空白处移动画卷</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. Hybrid Feed Template (主题回顾 = 小红书瀑布流 + 富文本 Modal)
// ----------------------------------------------------------------------

function HybridFeedTemplate({ events }: { events: Event[] }) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 md:gap-6 space-y-4 md:space-y-6">
      {events.map((event, i) => (
        <FeedCardWithModal key={event.id} event={event} index={i} />
      ))}
    </div>
  );
}

function FeedCardWithModal({ event, index }: { event: Event, index: number }) {
  const heights = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square'];
  const aspectClass = heights[index % heights.length];
  const tags = event.tags.filter(t => !t.startsWith("Mood:"));

  return (
    <Dialog>
      <DialogTrigger render={<div role="button" className="text-left w-full focus:outline-none" />}>
        <Card className="break-inside-avoid overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl bg-white dark:bg-[#18181B] group cursor-pointer text-left h-full">
          <div className="relative">
            {event.media && event.media.length > 0 && event.media[0] ? (
              <div className={cn("relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900", aspectClass)}>
                <img 
                  src={event.media[0].url.startsWith("http") ? event.media[0].url : `https://picsum.photos/seed/${event.media[0].id}/600/800`} 
                  alt={event.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                />
                {event.media[0].type === 'video' && (
                  <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md rounded-full p-1.5 shadow-sm">
                    <PlayCircle className="size-5 text-white/90" />
                  </div>
                )}
                {event.media.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    {event.media.slice(0, Math.min(event.media.length, 5)).map((_, i) => (
                      <div key={i} className={cn("rounded-full h-1.5 transition-all", i === 0 ? "bg-white w-3" : "bg-white/50 w-1.5")} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={cn("relative w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5", aspectClass)}>
                <span className="text-4xl">📝</span>
              </div>
            )}
          </div>

          <CardContent className="p-4 pt-4">
            <h3 className="font-semibold text-base mb-2 line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {event.summary}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs font-medium text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-sm">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center shadow-sm">
                  <span className="text-[10px] text-white font-bold">{event.title[0]}</span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">我</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  <Heart className="size-3.5" />
                  <span className="text-[10px] font-medium">{Math.floor(Math.random() * 100) + 10}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* The Rich Text Report Modal */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none bg-[#FAFAFA] dark:bg-[#09090B] sm:max-w-[70vw]">
        <DialogTitle className="sr-only">{event.title} - 详情周报</DialogTitle>
        <DialogDescription className="sr-only">详细的多模态富文本报告</DialogDescription>
        
        <div className="w-full bg-white dark:bg-[#111111] p-8 md:p-12 min-h-full">
          {/* Document Header */}
          <div className="border-b dark:border-slate-800 pb-8 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-slate-50">{event.title} - 深度回顾</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                <span>{new Date(event.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                <span>{event.location}</span>
              </div>
              <Badge variant="secondary" className="font-normal">富文本报告</Badge>
            </div>
          </div>

          {/* Editor Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="lead text-lg text-slate-600 dark:text-slate-400">
              {event.summary}
            </p>

            {/* Embedded Media Flow */}
            {event.media && event.media.length > 0 && (
              <div className="not-prose my-10 space-y-8">
                {event.media.map(m => (
                  <div key={m.id} className="relative rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border shadow-sm">
                    <img 
                      src={m.url.startsWith("http") ? m.url : `https://picsum.photos/seed/${m.id}/1200/600`} 
                      alt={m.title}
                      className="w-full h-auto object-cover max-h-[600px]"
                    />
                    {m.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="size-16 text-white/90 drop-shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                      </div>
                    )}
                    {(m.caption || m.title) && (
                      <div className="p-4 bg-white dark:bg-[#111111] border-t">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                          {m.caption || m.title}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* AI Insights Block */}
            <div className="not-prose mt-12 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-xl"></div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">✨</span>
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 tracking-wide">AI 归纳与洞察</h4>
              </div>
              <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                基于本次事件的多模态数据分析，您在 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{event.location}</span> 
                表现出了强烈的探索欲（关联标签：{event.tags[0]}）。建议在每周的回顾中，重点沉淀相关的领域知识，这可能成为您下一阶段重要突破的催化剂。
              </p>
            </div>
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
