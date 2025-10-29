import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";

const Meetings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Réunions</h1>
          <p className="text-muted-foreground mt-2">
            Planifiez et gérez les réunions de votre mutuelle
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prochaines réunions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucune réunion planifiée pour le moment
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Cette fonctionnalité sera bientôt disponible
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Meetings;
