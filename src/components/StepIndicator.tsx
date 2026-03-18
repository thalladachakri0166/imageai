import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

const steps: Step[] = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Customize" },
  { id: 3, label: "Generate" },
  { id: 4, label: "Preview" },
];

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "step-indicator",
                currentStep === step.id && "active",
                currentStep > step.id && "completed",
                currentStep < step.id && "inactive"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-4 h-4" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block",
                currentStep >= step.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-8 sm:w-16 h-0.5 rounded-full transition-colors mb-6 hidden sm:block",
                currentStep > step.id ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
