import { useState, useCallback } from "react";
import { Plus, X, ImageIcon, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReferenceImage {
  id: string;
  url: string;
  type: "upload" | "url";
}

interface ReferenceImageUploadProps {
  images: ReferenceImage[];
  onImagesChange: (images: ReferenceImage[]) => void;
  maxImages?: number;
}

const ReferenceImageUpload = ({
  images,
  onImagesChange,
  maxImages = 4,
}: ReferenceImageUploadProps) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newImages: ReferenceImage[] = [];
      Array.from(files).forEach((file) => {
        if (images.length + newImages.length >= maxImages) return;
        if (file.type === "image/jpeg" || file.type === "image/png") {
          const preview = URL.createObjectURL(file);
          newImages.push({
            id: crypto.randomUUID(),
            url: preview,
            type: "upload",
          });
        }
      });

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    },
    [images, onImagesChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      const newImages: ReferenceImage[] = [];

      Array.from(files).forEach((file) => {
        if (images.length + newImages.length >= maxImages) return;
        if (file.type === "image/jpeg" || file.type === "image/png") {
          const preview = URL.createObjectURL(file);
          newImages.push({
            id: crypto.randomUUID(),
            url: preview,
            type: "upload",
          });
        }
      });

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    },
    [images, onImagesChange, maxImages]
  );

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) return;

    // Basic URL validation
    try {
      new URL(urlInput);
      onImagesChange([
        ...images,
        {
          id: crypto.randomUUID(),
          url: urlInput.trim(),
          type: "url",
        },
      ]);
      setUrlInput("");
      setShowUrlInput(false);
    } catch {
      // Invalid URL
    }
  };

  const handleRemove = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground">
            Style References
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add inspiration images for better results
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Uploaded/Added Images */}
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-xl overflow-hidden glass-card animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <img
              src={image.url}
              alt="Reference"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%231a1a2e' width='100' height='100'/%3E%3Ctext fill='%23666' x='50' y='50' text-anchor='middle' dy='.3em' font-size='12'%3EError%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            <Button
              onClick={() => handleRemove(image.id)}
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </Button>
            {image.type === "url" && (
              <div className="absolute bottom-2 left-2">
                <Link2 className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Add New Image */}
        {images.length < maxImages && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "relative aspect-square rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground">Add image</span>
            </div>
          </div>
        )}
      </div>

      {/* URL Input Toggle */}
      {images.length < maxImages && (
        <div className="space-y-2">
          {!showUrlInput ? (
            <button
              onClick={() => setShowUrlInput(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link2 className="w-3 h-3" />
              Add from URL
            </button>
          ) : (
            <div className="flex gap-2 animate-fade-in">
              <Input
                type="url"
                placeholder="Paste image URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
                className="flex-1 h-9 text-sm bg-secondary border-border"
              />
              <Button
                onClick={handleUrlAdd}
                size="sm"
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput("");
                }}
                size="sm"
                variant="ghost"
                className="h-9"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Suggestion Tags */}
      {images.length === 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {["Pinterest outfit", "Celebrity style", "Magazine look"].map(
            (suggestion) => (
              <span
                key={suggestion}
                className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground"
              >
                {suggestion}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ReferenceImageUpload;
