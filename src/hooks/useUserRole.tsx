import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<'super_admin' | 'admin' | 'member' | null>(null);
  const [mutuelleId, setMutuelleId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check for super_admin role first
        const { data: superAdminRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", "super_admin")
          .is("mutuelle_id", null)
          .maybeSingle();

        if (superAdminRole) {
          setRole("super_admin");
          setLoading(false);
          return;
        }

        // Check for admin or member role with mutuelle
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("*, mutuelles(id, name)")
          .eq("user_id", user.id)
          .not("mutuelle_id", "is", null)
          .maybeSingle();

        if (userRole) {
          setRole(userRole.role as 'admin' | 'member');
          setMutuelleId(userRole.mutuelle_id);

          // If member, get their member_id
          if (userRole.role === 'member') {
            const { data: member } = await supabase
              .from("members")
              .select("id")
              .eq("profile_id", user.id)
              .maybeSingle();

            if (member) {
              setMemberId(member.id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, mutuelleId, memberId, loading };
};
