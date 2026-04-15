-- Allow anonymous users to contribute to the global titles cache.
-- This is necessary for the prototype to work in guest mode or during initial onboarding
-- when a full authenticated session might not be established yet but sync is triggered.

DROP POLICY IF EXISTS "titles_anon_upsert" ON public.titles;
CREATE POLICY "titles_anon_upsert" ON public.titles
FOR ALL TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "title_provider_mappings_anon_upsert" ON public.title_provider_mappings;
CREATE POLICY "title_provider_mappings_anon_upsert" ON public.title_provider_mappings
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Ensure public read is also explicitly allowed for everything
DROP POLICY IF EXISTS "titles_public_read" ON public.titles;
CREATE POLICY "titles_public_read" ON public.titles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "title_provider_mappings_public_read" ON public.title_provider_mappings;
CREATE POLICY "title_provider_mappings_public_read" ON public.title_provider_mappings FOR SELECT TO public USING (true);
