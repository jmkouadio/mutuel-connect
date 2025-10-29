import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Calendar, TrendingUp, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const stats = [
    {
      title: "Membres",
      value: "0",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Cotisations",
      value: "0 FCFA",
      icon: CreditCard,
      color: "text-success",
    },
    {
      title: "Réunions",
      value: "0",
      icon: Calendar,
      color: "text-accent",
    },
    {
      title: "Solde",
      value: "0 FCFA",
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl text-foreground">MutuellePro</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace de gestion
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Commencez dès maintenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Pour utiliser pleinement MutuellePro, vous devez avoir le rôle d'administrateur ou de super administrateur.
              Les fonctionnalités complètes incluent :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Créer et gérer des mutuelles</li>
              <li>Ajouter et gérer les membres</li>
              <li>Configurer les types de cotisations</li>
              <li>Planifier des réunions et suivre les présences</li>
              <li>Traiter les paiements via Paystack</li>
            </ul>
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-accent">
                💡 Prochaine étape : Contactez un super administrateur pour obtenir les droits nécessaires ou créez votre première mutuelle si vous avez déjà les permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
