import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, CreditCard, Calendar, Settings, LogOut } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Accueil", icon: Home },
  { path: "/dashboard/members", label: "Membres", icon: Users },
  { path: "/dashboard/contributions", label: "Cotisations", icon: CreditCard },
  { path: "/dashboard/meetings", label: "Réunions", icon: Calendar },
  { path: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl text-foreground">MutuellePro</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
