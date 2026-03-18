import { Shirt, PanelBottom, Footprints, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const options: Option[] = [
  {
    id: "shirt",
    label: "Shirt",
    icon: <Shirt className="w-5 h-5" />,
    description: "Change color or style",
  },
  {
    id: "pants",
    label: "Pants",
    icon: <PanelBottom className="w-5 h-5" />,
    description: "Modify bottom wear",
  },
  {
    id: "shoes",
    label: "Shoes",
    icon: <Footprints className="w-5 h-5" />,
    description: "Update footwear",
  },
  {
    id: "hairstyle",
    label: "Hairstyle",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Transform hair",
  },
  {
    id: "full-outfit",
    label: "Full Outfit",
    icon: <Layers className="w-5 h-5" />,
    description: "Complete makeover",
  },
];

interface OptionSelectorProps {
  selected: string[];
  onSelect: (id: string) => void;
}

const OptionSelector = ({ selected, onSelect }: OptionSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {options.map((option, index) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "option-card text-left animate-fade-in",
            selected.includes(option.id) && "selected"
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
              selected.includes(option.id)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {option.icon}
          </div>
          <p className="font-medium text-sm text-foreground">{option.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {option.description}
          </p>
          {option.id === "shirt" && selected.length === 0 && (
            <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              Default
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default OptionSelector;
