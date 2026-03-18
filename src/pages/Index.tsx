import { useState } from "react";
import { ArrowRight, ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import ImageUploader from "@/components/ImageUploader";
import OptionSelector from "@/components/OptionSelector";
import StyleSelector from "@/components/StyleSelector";
import PromptInput from "@/components/PromptInput";
import GenerationPreview from "@/components/GenerationPreview";
import ReferenceImageUpload from "@/components/ReferenceImageUpload";

interface ReferenceImage {
  id: string;
  url: string;
  type: "upload" | "url";
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(["shirt"]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>("casual");
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageSelect = (file: File, preview: string) => {
    setUploadedFile(file);
    setUploadedImage(preview);
    toast.success("Image uploaded successfully!");
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
  };

  const handleOptionSelect = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id)
        ? prev.filter((o) => o !== id)
        : [...prev, id]
    );
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an image first");
      return;
    }

    setCurrentStep(4);
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Convert file to base64 for the AI
      const base64Image = await convertToBase64(uploadedFile);
      
      // Use shirt as default if nothing selected
      const options = selectedOptions.length > 0 ? selectedOptions : ["shirt"];

      // Convert reference images to base64 if they're blob URLs
      const processedReferenceImages = await Promise.all(
        referenceImages.map(async (img) => {
          if (img.url.startsWith('blob:')) {
            // For blob URLs, we need the original file - skip for now
            return null;
          }
          return { id: img.id, url: img.url, type: img.type };
        })
      );

      const validReferenceImages = processedReferenceImages.filter(Boolean);

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          originalImage: base64Image,
          selectedOptions: options,
          style: selectedStyle || "casual",
          prompt: prompt,
          referenceImages: validReferenceImages
        }
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(error.message || "Failed to generate image");
        setIsGenerating(false);
        return;
      }

      if (data?.error) {
        console.error("API error:", data.error);
        toast.error(data.error);
        setIsGenerating(false);
        return;
      }

      if (data?.generatedImage) {
        setGeneratedImage(data.generatedImage);
        toast.success("Your new look is ready!");
      } else {
        toast.error("No image was generated. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = "styleai-generated.png";
      link.click();
      toast.success("Image downloaded!");
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!uploadedImage;
      case 2:
        return selectedOptions.length > 0 || true; // Default to shirt if none selected
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
      if (currentStep === 3) {
        handleGenerate();
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section - Only show on step 1 without image */}
        {currentStep === 1 && !uploadedImage && (
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Transform Your{" "}
              <span className="gradient-text">Style</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload a photo and let AI reimagine your outfit. Change shirts,
              pants, shoes, or get a complete makeover in seconds.
            </p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8">
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-xl font-semibold mb-6 text-foreground">
                Upload Your Photo
              </h2>
              <ImageUploader
                onImageSelect={handleImageSelect}
                selectedImage={uploadedImage}
                onClear={handleClearImage}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="font-display text-xl font-semibold mb-2 text-foreground">
                  What do you want to change?
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Select one or more options. Default is shirt color change.
                </p>
                <OptionSelector
                  selected={selectedOptions}
                  onSelect={handleOptionSelect}
                />
              </div>

              <div>
                <h3 className="font-display text-lg font-medium mb-4 text-foreground">
                  Choose a Style
                </h3>
                <StyleSelector
                  selected={selectedStyle}
                  onSelect={setSelectedStyle}
                />
              </div>

              <div className="pt-2 border-t border-border">
                <ReferenceImageUpload
                  images={referenceImages}
                  onImagesChange={setReferenceImages}
                  maxImages={4}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-display text-xl font-semibold mb-2 text-foreground">
                  Describe Your Look
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Add details about colors, materials, or specific styles you want.
                </p>
                <PromptInput value={prompt} onChange={setPrompt} />
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Generation Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Modifying:</span>
                    <p className="text-foreground capitalize">
                      {selectedOptions.length > 0
                        ? selectedOptions.join(", ")
                        : "Shirt (default)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Style:</span>
                    <p className="text-foreground capitalize">
                      {selectedStyle || "Not selected"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">References:</span>
                    <p className="text-foreground">
                      {referenceImages.length > 0
                        ? `${referenceImages.length} image${referenceImages.length > 1 ? "s" : ""}`
                        : "None"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && uploadedImage && (
            <GenerationPreview
              originalImage={uploadedImage}
              generatedImage={generatedImage}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
              onDownload={handleDownload}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 4 && (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-effect"
            >
              {currentStep === 3 ? (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {currentStep === 4 && !isGenerating && (
            <Button
              onClick={() => {
                setCurrentStep(1);
                setUploadedImage(null);
                setGeneratedImage(null);
                setPrompt("");
              }}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start New
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Powered by AI • Your photos are processed securely
        </p>
      </footer>
    </div>
  );
};

export default Index;
