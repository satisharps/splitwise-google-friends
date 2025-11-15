-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (user_id, email, display_name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;