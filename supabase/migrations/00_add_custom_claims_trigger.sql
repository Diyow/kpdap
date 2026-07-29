-- Add Custom Claims Trigger for admin_roles
-- This ensures that when a user is added to admin_roles, their JWT gets the role.

-- Create a function to update the user's app_metadata
CREATE OR REPLACE FUNCTION public.handle_admin_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      raw_app_meta_data - 'role'
    WHERE id = OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on insert or delete to admin_roles
DROP TRIGGER IF EXISTS on_admin_role_change ON public.admin_roles;
CREATE TRIGGER on_admin_role_change
AFTER INSERT OR DELETE ON public.admin_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_role_update();

-- IMPORTANT: You will also need to manually update existing admin users
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
-- WHERE id IN (SELECT id FROM public.admin_roles);
