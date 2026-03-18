import { Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-effect">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              StyleAI
            </h1>
            <p className="text-xs text-muted-foreground">
              AI Outfit Generator
            </p>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Gallery
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
