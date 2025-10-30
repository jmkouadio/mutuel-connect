import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMutuelle, setEditingMutuelle] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isSuperAdmin = userRoles?.some(role => role.role === "super_admin" && !role.mutuelle_id);

  // Fetch mutuelles
  const { data: mutuelles, isLoading } = useQuery({
    queryKey: ["mutuelles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mutuelles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create mutuelle mutation
  const createMutuelle = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const { data: mutuelle, error } = await supabase
        .from("mutuelles")
        .insert([{
          name: data.name,
          description: data.description,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return mutuelle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mutuelles"] });
      toast.success("Mutuelle créée avec succès");
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la création: " + error.message);
    },
  });

  // Update mutuelle mutation
  const updateMutuelle = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string }) => {
      const { error } = await supabase
        .from("mutuelles")
        .update({
          name: data.name,
          description: data.description,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mutuelles"] });
      toast.success("Mutuelle mise à jour avec succès");
      setEditingMutuelle(null);
      setFormData({ name: "", description: "" });
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMutuelle) {
      updateMutuelle.mutate({
        id: editingMutuelle.id,
        ...formData,
      });
    } else {
      createMutuelle.mutate(formData);
    }
  };

  const startEdit = (mutuelle: any) => {
    setEditingMutuelle(mutuelle);
    setFormData({
      name: mutuelle.name,
      description: mutuelle.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingMutuelle(null);
    setFormData({ name: "", description: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Mutuelles</h1>
            <p className="text-muted-foreground mt-2">
              Créez et gérez vos mutuelles
            </p>
          </div>
          
          {isSuperAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une mutuelle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle mutuelle</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle mutuelle pour votre organisation
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de la mutuelle</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Mutuelle des Enseignants"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de la mutuelle"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createMutuelle.isPending}>
                      {createMutuelle.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Créer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : mutuelles && mutuelles.length > 0 ? (
          <div className="grid gap-4">
            {mutuelles.map((mutuelle) => {
              const isEditing = editingMutuelle?.id === mutuelle.id;
              const canEdit = userRoles?.some(
                role => (role.role === "admin" && role.mutuelle_id === mutuelle.id) || 
                       (role.role === "super_admin" && !role.mutuelle_id)
              );

              return (
                <Card key={mutuelle.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-6 h-6 text-primary mt-1" />
                        <div>
                          {isEditing ? (
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="mb-2"
                            />
                          ) : (
                            <CardTitle>{mutuelle.name}</CardTitle>
                          )}
                          {isEditing ? (
                            <Textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={2}
                            />
                          ) : (
                            <CardDescription>{mutuelle.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={updateMutuelle.isPending}
                              >
                                {updateMutuelle.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Sauvegarder
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(mutuelle)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Solde total</p>
                        <p className="text-2xl font-bold text-primary">
                          {Number(mutuelle.total_balance).toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Créée le</p>
                        <p className="font-medium">
                          {new Date(mutuelle.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune mutuelle pour le moment</p>
                {isSuperAdmin && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Créez votre première mutuelle pour commencer
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
