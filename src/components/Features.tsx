import { Users, CreditCard, Brain, Calendar, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import featureMembers from "@/assets/feature-members.png";
import featurePayments from "@/assets/feature-payments.png";
import featureAI from "@/assets/feature-ai.png";

const features = [
  {
    icon: Users,
    title: "Gestion des Membres",
    description: "Ajoutez, modifiez et gérez facilement tous vos membres avec attribution de rôles personnalisés.",
    color: "text-primary",
    image: featureMembers,
  },
  {
    icon: CreditCard,
    title: "Cotisations en Ligne",
    description: "Paiements sécurisés via Paystack. Gérez cotisations mensuelles et surprises en quelques clics.",
    color: "text-success",
    image: featurePayments,
  },
  {
    icon: Brain,
    title: "IA d'Analyse Financière",
    description: "Conseils intelligents basés sur vos flux financiers pour optimiser la gestion de votre mutuelle.",
    color: "text-accent",
    image: featureAI,
  },
  {
    icon: Calendar,
    title: "Réunions & Présences",
    description: "Planifiez vos réunions, suivez les présences et générez des rapports détaillés automatiquement.",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Tableaux de Bord",
    description: "Visualisez en temps réel vos gains, dépenses et cotisations avec des graphiques interactifs.",
    color: "text-success",
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Vos données sont protégées avec un cryptage de niveau bancaire et des sauvegardes automatiques.",
    color: "text-accent",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Tout ce dont votre Mutuelle a besoin
          </h2>
          <p className="text-xl text-muted-foreground">
            Une solution complète qui simplifie la gestion quotidienne et optimise vos finances
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                {feature.image ? (
                  <div className="relative">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                    feature.color.includes("primary") ? "from-primary/10 to-primary/5" :
                    feature.color.includes("success") ? "from-success/10 to-success/5" :
                    "from-accent/10 to-accent/5"
                  } flex items-center justify-center`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
