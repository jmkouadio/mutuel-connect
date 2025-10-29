import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Contributions = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [configFormData, setConfigFormData] = useState({
    name: "",
    type: "monthly",
    amount: "",
    frequency: "",
    description: "",
  });

  const [paymentFormData, setPaymentFormData] = useState({
    member_id: "",
    config_id: "",
    amount: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configsRes, contribsRes, membersRes] = await Promise.all([
        supabase.from("contribution_configs").select("*").eq("is_active", true),
        supabase.from("contributions").select("*, members(full_name), contribution_configs(name)").order("created_at", { ascending: false }),
        supabase.from("members").select("*").eq("status", "active"),
      ]);

      setConfigs(configsRes.data || []);
      setContributions(contribsRes.data || []);
      setMembers(membersRes.data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: mutuelles } = await supabase
        .from("mutuelles")
        .select("id")
        .limit(1)
        .single();

      if (!mutuelles) {
        toast.error("Aucune mutuelle trouvée");
        return;
      }

      const { error } = await supabase
        .from("contribution_configs")
        .insert([{
          name: configFormData.name,
          type: configFormData.type as "monthly" | "special" | "surprise",
          amount: parseFloat(configFormData.amount),
          frequency: configFormData.frequency,
          description: configFormData.description,
          mutuelle_id: mutuelles.id,
        }]);

      if (error) throw error;
      
      toast.success("Type de cotisation créé avec succès");
      setConfigDialogOpen(false);
      setConfigFormData({ name: "", type: "monthly", amount: "", frequency: "", description: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
      console.error(error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: mutuelles } = await supabase
        .from("mutuelles")
        .select("id")
        .limit(1)
        .single();

      if (!mutuelles) {
        toast.error("Aucune mutuelle trouvée");
        return;
      }

      // Create contribution record
      const { data: contribution, error: contributionError } = await supabase
        .from("contributions")
        .insert([{
          ...paymentFormData,
          amount: parseFloat(paymentFormData.amount),
          mutuelle_id: mutuelles.id,
          status: "pending",
        }])
        .select()
        .single();

      if (contributionError) throw contributionError;

      // Get member email
      const member = members.find(m => m.id === paymentFormData.member_id);
      if (!member || !member.email) {
        toast.error("Email du membre introuvable");
        return;
      }

      // Initialize Paystack payment
      const { data: paystackData, error: paystackError } = await supabase.functions.invoke(
        'paystack-initialize',
        {
          body: {
            amount: parseFloat(paymentFormData.amount),
            email: member.email,
            metadata: {
              contribution_id: contribution.id,
              member_id: member.id,
            },
          },
        }
      );

      if (paystackError) throw paystackError;

      // Redirect to Paystack payment page
      if (paystackData.data?.authorization_url) {
        window.location.href = paystackData.data.authorization_url;
      }

      setPaymentDialogOpen(false);
      setPaymentFormData({ member_id: "", config_id: "", amount: "" });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'initialisation du paiement");
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cotisations</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les types de cotisations et les paiements
            </p>
          </div>
        </div>

        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="configs">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle cotisation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une cotisation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member">Membre *</Label>
                      <Select
                        value={paymentFormData.member_id}
                        onValueChange={(value) => setPaymentFormData({ ...paymentFormData, member_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un membre" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="config">Type de cotisation *</Label>
                      <Select
                        value={paymentFormData.config_id}
                        onValueChange={(value) => {
                          const config = configs.find(c => c.id === value);
                          setPaymentFormData({
                            ...paymentFormData,
                            config_id: value,
                            amount: config?.amount.toString() || "",
                          });
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {configs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.name} - {config.amount} FCFA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (FCFA) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={paymentFormData.amount}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Procéder au paiement
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Historique des cotisations</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Chargement...</p>
                ) : contributions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune cotisation enregistrée
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                          <TableCell className="font-medium">
                            {contribution.members?.full_name}
                          </TableCell>
                          <TableCell>{contribution.contribution_configs?.name}</TableCell>
                          <TableCell>{contribution.amount} FCFA</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              contribution.status === 'paid' 
                                ? 'bg-success/10 text-success'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {contribution.status === 'paid' ? 'Payé' : 'En attente'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(contribution.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configs" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Settings className="w-4 h-4 mr-2" />
                    Nouveau type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un type de cotisation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleConfigSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom *</Label>
                      <Input
                        id="name"
                        value={configFormData.name}
                        onChange={(e) => setConfigFormData({ ...configFormData, name: e.target.value })}
                        placeholder="Ex: Cotisation mensuelle"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={configFormData.type}
                        onValueChange={(value) => setConfigFormData({ ...configFormData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                          <SelectItem value="surprise">Surprise</SelectItem>
                          <SelectItem value="special">Spéciale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="config-amount">Montant (FCFA) *</Label>
                      <Input
                        id="config-amount"
                        type="number"
                        value={configFormData.amount}
                        onChange={(e) => setConfigFormData({ ...configFormData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Fréquence</Label>
                      <Input
                        id="frequency"
                        value={configFormData.frequency}
                        onChange={(e) => setConfigFormData({ ...configFormData, frequency: e.target.value })}
                        placeholder="Ex: Chaque mois"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={configFormData.description}
                        onChange={(e) => setConfigFormData({ ...configFormData, description: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Créer
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Types de cotisations actifs ({configs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Chargement...</p>
                ) : configs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun type configuré. Créez votre premier type de cotisation !
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {configs.map((config) => (
                      <div key={config.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{config.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description || "Aucune description"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-foreground">
                              {config.amount} <span className="text-sm">FCFA</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {config.type === 'monthly' ? 'Mensuelle' : 
                               config.type === 'surprise' ? 'Surprise' : 'Spéciale'}
                            </span>
                          </div>
                        </div>
                        {config.frequency && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Fréquence: {config.frequency}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Contributions;
