import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUploadStore } from "@/stores/admin-upload-store";

export function UploadDropzone() {
  const setFiles = useAdminUploadStore((s) => s.setFiles);
  const fileCount = useAdminUploadStore((s) => s.files.length);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      setFiles((prev) => [...prev, ...accepted]);
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5",
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">上传</p>
      {fileCount > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{fileCount}</p>
      ) : null}
    </div>
  );
}
