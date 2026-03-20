-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add company_id to profiles
ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view companies
CREATE POLICY "Authenticated users can view companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

-- Only masters can manage companies
CREATE POLICY "Masters can insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Masters can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Masters can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (public.is_master(auth.uid()));

-- Storage policies for company logos
CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Masters can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND public.is_master(auth.uid()));

CREATE POLICY "Masters can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos' AND public.is_master(auth.uid()));

CREATE POLICY "Masters can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos' AND public.is_master(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();