import { Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const suggestions = [
  "Black oversized hoodie",
  "Navy blue formal suit",
  "Vintage denim jacket",
  "White minimalist sneakers",
];

const PromptInput = ({ value, onChange }: PromptInputProps) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your desired outfit... (e.g., 'red silk shirt with black pants')"
          className="min-h-[100px] bg-secondary border-border resize-none text-foreground placeholder:text-muted-foreground pr-12"
        />
        <Wand2 className="absolute right-4 top-4 w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground py-1">Try:</span>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onChange(suggestion)}
            className="text-xs px-3 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptInput;
