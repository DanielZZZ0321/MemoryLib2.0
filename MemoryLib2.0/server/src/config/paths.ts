import path from "node:path";

export function memoriaDataDir(): string {
  return process.env.MEMORIA_DATA_DIR ?? path.join(process.cwd(), "data");
}
