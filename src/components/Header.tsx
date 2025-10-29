import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl text-foreground">MutuellePro</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-foreground hover:text-primary transition-colors">
            Fonctionnalités
          </a>
          <a href="#benefits" className="text-foreground hover:text-primary transition-colors">
            Avantages
          </a>
          <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
            Tarifs
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden md:inline-flex" onClick={() => window.location.href = '/auth'}>
            Connexion
          </Button>
          <Button variant="hero" onClick={() => window.location.href = '/auth'}>
            Commencer
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
