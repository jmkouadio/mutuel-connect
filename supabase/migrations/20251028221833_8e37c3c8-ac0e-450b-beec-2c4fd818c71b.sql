-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'treasurer', 'member');
CREATE TYPE public.contribution_type AS ENUM ('monthly', 'surprise', 'special');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mutuelles table
CREATE TABLE public.mutuelles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  total_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  mutuelle_id UUID REFERENCES public.mutuelles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mutuelle_id)
);

-- Members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mutuelle_id UUID NOT NULL REFERENCES public.mutuelles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contribution types table
CREATE TABLE public.contribution_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mutuelle_id UUID NOT NULL REFERENCES public.mutuelles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.contribution_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mutuelle_id UUID NOT NULL REFERENCES public.mutuelles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.contribution_configs(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'paystack',
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mutuelle_id UUID NOT NULL REFERENCES public.mutuelles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  status public.meeting_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meeting attendance table
CREATE TABLE public.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent',
  notes TEXT,
  marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, member_id)
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mutuelle_id UUID NOT NULL REFERENCES public.mutuelles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT NOT NULL,
  paid_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutuelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_mutuelle_role(_user_id UUID, _mutuelle_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (mutuelle_id = _mutuelle_id OR mutuelle_id IS NULL)
      AND role = _role
  )
$$;

-- Security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
      AND mutuelle_id IS NULL
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- RLS Policies for mutuelles
CREATE POLICY "Super admins can view all mutuelles"
  ON public.mutuelles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view mutuelles they belong to"
  ON public.mutuelles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.mutuelle_id = mutuelles.id
    )
  );

CREATE POLICY "Super admins can create mutuelles"
  ON public.mutuelles FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can update their mutuelle"
  ON public.mutuelles FOR UPDATE
  USING (
    public.has_mutuelle_role(auth.uid(), id, 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- RLS Policies for members
CREATE POLICY "Users can view members of their mutuelle"
  ON public.members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.mutuelle_id = members.mutuelle_id
    )
  );

CREATE POLICY "Admins can manage members"
  ON public.members FOR ALL
  USING (
    public.has_mutuelle_role(auth.uid(), mutuelle_id, 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- RLS Policies for contribution_configs
CREATE POLICY "Users can view contribution configs of their mutuelle"
  ON public.contribution_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.mutuelle_id = contribution_configs.mutuelle_id
    )
  );

CREATE POLICY "Admins can manage contribution configs"
  ON public.contribution_configs FOR ALL
  USING (
    public.has_mutuelle_role(auth.uid(), mutuelle_id, 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- RLS Policies for contributions
CREATE POLICY "Users can view contributions of their mutuelle"
  ON public.contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.mutuelle_id = contributions.mutuelle_id
    )
  );

CREATE POLICY "Members can create their own contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      JOIN public.user_roles ur ON ur.mutuelle_id = m.mutuelle_id
      WHERE ur.user_id = auth.uid()
        AND m.id = member_id
        AND m.mutuelle_id = contributions.mutuelle_id
    )
  );

CREATE POLICY "Admins can manage contributions"
  ON public.contributions FOR ALL
  USING (
    public.has_mutuelle_role(auth.uid(), mutuelle_id, 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings of their mutuelle"
  ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.mutuelle_id = meetings.mutuelle_id
    )
  );

CREATE POLICY "Admins can manage meetings"
  ON public.meetings FOR ALL
  USING (
    public.has_mutuelle_role(auth.uid(), mutuelle_id, 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- RLS Policies for meeting_attendance
CREATE POLICY "Users can view attendance of their mutuelle meetings"
  ON public.meeting_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.user_roles ur ON ur.mutuelle_id = m.mutuelle_id
      WHERE ur.user_id = auth.uid()
        AND m.id = meeting_attendance.meeting_id
    )
  );

CREATE POLICY "Admins can manage meeting attendance"
  ON public.meeting_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_attendance.meeting_id
        AND (
          public.has_mutuelle_role(auth.uid(), m.mutuelle_id, 'admin')
          OR public.is_super_admin(auth.uid())
        )
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses of their mutuelle"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.mutuelle_id = expenses.mutuelle_id
    )
  );

CREATE POLICY "Admins can manage expenses"
  ON public.expenses FOR ALL
  USING (
    public.has_mutuelle_role(auth.uid(), mutuelle_id, 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mutuelles_updated_at
  BEFORE UPDATE ON public.mutuelles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contribution_configs_updated_at
  BEFORE UPDATE ON public.contribution_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();