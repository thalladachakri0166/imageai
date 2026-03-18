import { cn } from "@/lib/utils";

interface Style {
  id: string;
  label: string;
  emoji: string;
}

const styles: Style[] = [
  { id: "casual", label: "Casual", emoji: "👕" },
  { id: "formal", label: "Formal", emoji: "👔" },
  { id: "streetwear", label: "Streetwear", emoji: "🧢" },
  { id: "traditional", label: "Traditional", emoji: "🎎" },
  { id: "party", label: "Party", emoji: "✨" },
  { id: "sporty", label: "Sporty", emoji: "🏃" },
  { id: "vintage", label: "Vintage", emoji: "📼" },
  { id: "minimalist", label: "Minimalist", emoji: "◾" },
];

interface StyleSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const StyleSelector = ({ selected, onSelect }: StyleSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style, index) => (
        <button
          key={style.id}
          onClick={() => onSelect(style.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 animate-fade-in",
            selected === style.id
              ? "bg-primary text-primary-foreground glow-effect"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          style={{ animationDelay: `${index * 0.03}s` }}
        >
          <span className="mr-1.5">{style.emoji}</span>
          {style.label}
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;
