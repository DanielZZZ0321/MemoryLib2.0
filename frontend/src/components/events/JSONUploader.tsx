import React from 'react';
import { useEventStore } from '@/stores/eventStore';
import { UploadCloud } from 'lucide-react';

export function JSONUploader() {
  const importTimeline = useEventStore((state) => state.importTimeline);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          await importTimeline(json, file.name);
        } else {
          alert('Invalid JSON format. Expected an array of events.');
        }
      } catch (err) {
        console.error('Failed to parse JSON', err);
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-pointer relative group">
      <input
        type="file"
        accept="application/json"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleFileUpload}
      />
      <UploadCloud className="w-12 h-12 text-zinc-400 group-hover:text-zinc-200 mb-4 transition-colors" />
      <h3 className="text-lg font-medium text-zinc-200">Import timeline_with_summary.json</h3>
      <p className="text-sm text-zinc-500 mt-2">Click or drag and drop your JSON file here</p>
    </div>
  );
}
