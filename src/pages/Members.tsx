import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const Members = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [mutuelles, setMutuelles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    mutuelle_id: "",
  });

  useEffect(() => {
    fetchMutuelles();
    fetchMembers();
  }, []);

  const fetchMutuelles = async () => {
    try {
      const { data, error } = await supabase
        .from("mutuelles")
        .select("*")
        .order("name");

      if (error) throw error;
      setMutuelles(data || []);
      
      // Auto-select first mutuelle if available
      if (data && data.length > 0 && !formData.mutuelle_id) {
        setFormData(prev => ({ ...prev, mutuelle_id: data[0].id }));
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des mutuelles:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*, mutuelles(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des membres");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.mutuelle_id) {
        toast.error("Veuillez sélectionner une mutuelle");
        return;
      }

      if (editingMember) {
        const { error } = await supabase
          .from("members")
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
          })
          .eq("id", editingMember.id);

        if (error) throw error;
        toast.success("Membre modifié avec succès");
      } else {
        const { error } = await supabase
          .from("members")
          .insert([{
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            mutuelle_id: formData.mutuelle_id,
          }]);

        if (error) throw error;
        toast.success("Membre ajouté avec succès");
      }

      setDialogOpen(false);
      setEditingMember(null);
      setFormData({ 
        full_name: "", 
        email: "", 
        phone: "", 
        mutuelle_id: mutuelles.length > 0 ? mutuelles[0].id : "" 
      });
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'opération");
      console.error(error);
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      email: member.email || "",
      phone: member.phone || "",
      mutuelle_id: member.mutuelle_id,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Membre supprimé avec succès");
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {mutuelles.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune mutuelle trouvée. Vous devez d'abord créer une mutuelle dans les paramètres.
              <Button 
                variant="link" 
                className="px-2" 
                onClick={() => navigate("/dashboard/settings")}
              >
                Créer une mutuelle
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des membres</h1>
            <p className="text-muted-foreground mt-2">
              Ajoutez et gérez les membres de votre mutuelle
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingMember(null);
                  setFormData({ 
                    full_name: "", 
                    email: "", 
                    phone: "",
                    mutuelle_id: mutuelles.length > 0 ? mutuelles[0].id : ""
                  });
                }}
                disabled={mutuelles.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Modifier le membre" : "Ajouter un membre"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingMember && (
                  <div className="space-y-2">
                    <Label htmlFor="mutuelle">Mutuelle *</Label>
                    <Select
                      value={formData.mutuelle_id}
                      onValueChange={(value) => setFormData({ ...formData, mutuelle_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une mutuelle" />
                      </SelectTrigger>
                      <SelectContent>
                        {mutuelles.map((mutuelle) => (
                          <SelectItem key={mutuelle.id} value={mutuelle.id}>
                            {mutuelle.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingMember ? "Modifier" : "Ajouter"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des membres ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun membre enregistré. Ajoutez votre premier membre !
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Mutuelle</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.mutuelles?.name || "-"}</TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                          {member.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Members;
