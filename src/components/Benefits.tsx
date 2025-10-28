import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Gain de Temps",
    description: "Automatisez les tâches répétitives et concentrez-vous sur l'essentiel",
  },
  {
    title: "Transparence Totale",
    description: "Tous les membres peuvent suivre les finances en temps réel",
  },
  {
    title: "Décisions Éclairées",
    description: "L'IA vous guide vers les meilleures décisions financières",
  },
  {
    title: "Zéro Paperasse",
    description: "Tout est digital, accessible 24/7 depuis n'importe où",
  },
  {
    title: "Croissance Durable",
    description: "Optimisez vos ressources pour développer votre mutuelle",
  },
  {
    title: "Support Dédié",
    description: "Notre équipe vous accompagne à chaque étape",
  },
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Pourquoi choisir{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MutuellePro
                </span>
                ?
              </h2>
              <p className="text-xl text-muted-foreground">
                Rejoignez des centaines de mutuelles qui ont déjà transformé leur gestion
              </p>
            </div>
            
            <div className="grid gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex gap-4 items-start group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-1">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-muted-foreground">Caisse Générale</span>
                  <span className="text-2xl font-bold text-success">+12.5%</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cotisations</span>
                    <span className="font-semibold text-foreground">2,450,000 FCFA</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-glow w-4/5 rounded-full" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-muted-foreground">Dépenses</span>
                    <span className="font-semibold text-foreground">890,000 FCFA</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-destructive w-2/5 rounded-full" />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Solde Net</span>
                    <span className="text-2xl font-bold text-success">1,560,000 FCFA</span>
                  </div>
                </div>
                
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Conseil IA</p>
                    <p className="text-muted-foreground mt-1">
                      Vos finances sont en excellente santé. Continuez ainsi !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
