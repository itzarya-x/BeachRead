-- Fix RLS policies to allow authenticated users to contribute to the global titles cache during sync
DROP POLICY IF EXISTS "titles_authenticated_upsert" ON public.titles;
CREATE POLICY "titles_authenticated_upsert" ON public.titles
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "title_provider_mappings_authenticated_upsert" ON public.title_provider_mappings;
CREATE POLICY "title_provider_mappings_authenticated_upsert" ON public.title_provider_mappings
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
