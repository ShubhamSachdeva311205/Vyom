-- ============================================================================
-- Production book catalogue seed.
--
-- These 9 titles are the real, in-print catalogue (source of truth:
-- FULL_FEATURE_REFERENCE.md §G) — not throwaway dev fixtures, so they belong
-- in migration history and ship to every environment. Mirrors supabase/seed.sql
-- (which stays as the local `db reset` seed); both use `on conflict (slug) do
-- nothing` so re-runs and admin edits are never clobbered.
--
-- Prices in paise (1 INR = 100 paise) to avoid floating-point drift.
-- ============================================================================

insert into public.books (
  slug, title, subtitle, isbn, curriculum, subject, publisher,
  price_paise, discount_eligible, has_audio, has_answer_key, is_active,
  inventory_count
) values
  ('ibdp-hindi-b-hl-reading','Shubham IBDP Hindi B HL — Reading','पठन – उच्च स्तर','9789348898029','ibdp','Hindi','Gyaanmudra',195000,true,false,true,true,50),
  ('ibdp-hindi-b-sl-reading','Shubham IBDP Hindi B SL — Reading','पठन – मानक स्तर','9789348898470','ibdp','Hindi','Gyaanmudra',195000,true,false,true,true,50),
  ('ibdp-hindi-b-sl-io','Shubham IBDP Hindi B-SL-IO (old edition)','Moukhik pareeksha par aadharit — मानक स्तर','978-93-48898-15-9','ibdp','Hindi','Gyaanmudra',105000,true,false,false,true,0),
  ('ibdp-hindi-b-sl-io-new','Shubham IBDP Hindi B SL-IO (New Edition)','मौखिक कौशल — मानक स्तर (नवीन संस्करण)','978-93-5912-170-3','ibdp','Hindi','Self (Seema Sachdeva)',199900,true,true,false,true,50),
  ('ibdp-hindi-b-hl-io','Shubham IBDP Hindi B-HL-IO','Moukhik pareeksha par aadharit — उच्च स्तर','978-93-48898-32-6','ibdp','Hindi','Gyaanmudra',105000,true,false,false,true,50),
  ('ibdp-hindi-b-writing-skills','Shubham IBDP Hindi B SL & HL — Writing Skills (Paper 1)','लेखन कौशल — मानक तथा उच्च स्तर','978-93-5782-432-3','ibdp','Hindi','Self (Seema Sachdeva)',195000,true,false,false,true,50),
  ('ibdp-hindi-b-shravan-lekhan','Shubham IBDP Hindi B HL and SL — Shravan Lekhan (Listening)','मानक तथा उच्च स्तर','978-93-5810-024-2','ibdp','Hindi','Self (Seema Sachdeva)',195000,true,true,false,true,50),
  ('igcse-hindi-paper-1','Shubham IGCSE Hindi as a Second Language — Paper 1 (Reading & Writing)','New curriculum','978-93-5782-125-4','igcse','Hindi','Self (Seema Sachdeva)',195000,true,false,true,true,50),
  ('igcse-hindi-paper-2-listening','Shubham IGCSE Hindi as a Second Language — Paper 2 (Listening)','New curriculum','978-93-5813-838-2','igcse','Hindi','Self (Seema Sachdeva)',199900,true,true,false,true,50)
on conflict (slug) do nothing;
