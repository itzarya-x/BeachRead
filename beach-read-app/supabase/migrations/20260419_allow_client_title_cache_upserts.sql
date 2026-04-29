-- Allow the browser client to maintain the shared title metadata cache.
-- The app writes titles before creating per-user library_entries, so RLS must
-- permit authenticated users to upsert this global cache.

DROP POLICY IF EXISTS titles_authenticated_upsert ON public.titles;
DROP POLICY IF EXISTS titles_authenticated_insert ON public.titles;
CREATE POLICY titles_authenticated_insert
ON public.titles
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS titles_authenticated_update ON public.titles;
CREATE POLICY titles_authenticated_update
ON public.titles
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS title_provider_mappings_authenticated_upsert ON public.title_provider_mappings;
DROP POLICY IF EXISTS title_provider_mappings_authenticated_insert ON public.title_provider_mappings;
CREATE POLICY title_provider_mappings_authenticated_insert
ON public.title_provider_mappings
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS title_provider_mappings_authenticated_update ON public.title_provider_mappings;
CREATE POLICY title_provider_mappings_authenticated_update
ON public.title_provider_mappings
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Guest-mode prototype writes can create cache rows, but cannot update/delete
-- existing rows. Public SELECT policies are defined in the base schema.
DROP POLICY IF EXISTS titles_anon_upsert ON public.titles;
CREATE POLICY titles_anon_upsert
ON public.titles
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS title_provider_mappings_anon_insert ON public.title_provider_mappings;
CREATE POLICY title_provider_mappings_anon_insert
ON public.title_provider_mappings
FOR INSERT TO anon
WITH CHECK (true);
