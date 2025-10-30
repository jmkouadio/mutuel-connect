-- Function to link a profile to a member when emails match
CREATE OR REPLACE FUNCTION public.link_profile_to_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to find a member with the same email and link it
  UPDATE members 
  SET profile_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND profile_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger to link profile to member after profile creation
DROP TRIGGER IF EXISTS on_profile_created_link_member ON public.profiles;
CREATE TRIGGER on_profile_created_link_member
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_profile_to_member();

-- Function to create member role when a profile is linked to a member
CREATE OR REPLACE FUNCTION public.create_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If profile_id was just set (wasn't set before), create a member role
  IF NEW.profile_id IS NOT NULL AND (OLD.profile_id IS NULL OR OLD.profile_id IS DISTINCT FROM NEW.profile_id) THEN
    -- Create user_role for this member if it doesn't exist
    INSERT INTO user_roles (user_id, mutuelle_id, role)
    VALUES (NEW.profile_id, NEW.mutuelle_id, 'member'::app_role)
    ON CONFLICT (user_id, mutuelle_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create member role when member is linked to profile
DROP TRIGGER IF EXISTS on_member_profile_linked ON public.members;
CREATE TRIGGER on_member_profile_linked
  AFTER INSERT OR UPDATE OF profile_id ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.create_member_role();