import { create } from "zustand";
import type { UploadSourceResult } from "@/lib/upload-admin";

type AdminUploadState = {
  files: File[];
  progress: number;
  uploading: boolean;
  error: string | null;
  lastResults: UploadSourceResult[] | null;
  queueHint: string | null;
  setFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  setProgress: (n: number) => void;
  setUploading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setLastResults: (r: UploadSourceResult[] | null) => void;
  setQueueHint: (h: string | null) => void;
};

export const useAdminUploadStore = create<AdminUploadState>((set) => ({
  files: [],
  progress: 0,
  uploading: false,
  error: null,
  lastResults: null,
  queueHint: null,
  setFiles: (files) =>
    set((state) => ({
      files: typeof files === "function" ? files(state.files) : files,
    })),
  setProgress: (progress) => set({ progress }),
  setUploading: (uploading) => set({ uploading }),
  setError: (error) => set({ error }),
  setLastResults: (lastResults) => set({ lastResults }),
  setQueueHint: (queueHint) => set({ queueHint }),
}));
