import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  selectedImage: string | null;
  onClear: () => void;
}

const ImageUploader = ({ onImageSelect, selectedImage, onClear }: ImageUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
        const preview = URL.createObjectURL(file);
        onImageSelect(file, preview);
      }
    },
    [onImageSelect]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      onImageSelect(file, preview);
    }
  };

  if (selectedImage) {
    return (
      <div className="relative animate-scale-in">
        <div className="relative rounded-2xl overflow-hidden glass-card">
          <img
            src={selectedImage}
            alt="Uploaded"
            className="w-full h-auto max-h-[500px] object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <Button
            onClick={onClear}
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Image uploaded successfully
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`upload-zone min-h-[300px] ${isDragOver ? "dragover" : ""}`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            Drop your image here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="w-3 h-3" />
          <span>JPG, PNG up to 10MB</span>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
