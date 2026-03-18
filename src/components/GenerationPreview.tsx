import { ArrowLeftRight, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerationPreviewProps {
  originalImage: string;
  generatedImage: string | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  onDownload: () => void;
}

const GenerationPreview = ({
  originalImage,
  generatedImage,
  isGenerating,
  onRegenerate,
  onDownload,
}: GenerationPreviewProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Original
            </span>
          </div>
          <div className="relative rounded-2xl overflow-hidden glass-card aspect-[3/4]">
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Arrow indicator for desktop */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center glow-effect">
            <ArrowLeftRight className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Generated Image */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Generated
            </span>
          </div>
          <div className="relative rounded-2xl overflow-hidden glass-card aspect-[3/4]">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Generating your look...
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  This may take a moment
                </p>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <p className="text-sm text-muted-foreground">
                  Click “Try again” to generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isGenerating && (
        <div className="flex justify-center gap-4 animate-fade-in">
          <Button
            variant="secondary"
            onClick={onRegenerate}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {generatedImage ? "Regenerate" : "Try again"}
          </Button>

          {generatedImage && (
            <Button
              onClick={onDownload}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerationPreview;
