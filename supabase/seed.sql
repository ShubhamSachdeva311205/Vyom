-- ============================================================================
-- Local dev seed data — applied after every `supabase db reset`.
-- Source of truth: FULL_FEATURE_REFERENCE.md §G.
--
-- All 7 books currently in print. Books 5 + 7 are listening editions and
-- explicitly NOT eligible for student10/teacher10 (FFR Important catalogue
-- rules). Books 1, 2, 6 ship with answer keys; books 5, 7 ship with audio.
--
-- Prices stored in paise (1 INR = 100 paise) to dodge floating-point.
-- ============================================================================

insert into public.books (
  slug, title, subtitle, isbn, curriculum, subject, publisher,
  price_paise, discount_eligible, has_audio, has_answer_key, is_active
) values
  -- ---- IBDP ----
  (
    'ibdp-hindi-b-hl-reading',
    'Shubham IBDP Hindi B HL — Reading',
    'पठन – उच्च स्तर',
    '9789348898029',
    'ibdp', 'Hindi', 'Gyaanmudra',
    195000, true, false, true, true
  ),
  (
    'ibdp-hindi-b-sl-reading',
    'Shubham IBDP Hindi B SL — Reading',
    'पठन – मानक स्तर',
    '9789348898470',
    'ibdp', 'Hindi', 'Gyaanmudra',
    195000, true, false, true, true
  ),
  (
    'ibdp-hindi-b-sl-io',
    'Shubham IBDP Hindi B-SL-IO',
    'Moukhik pareeksha par aadharit — मानक स्तर',
    '978-93-48898-15-9',
    'ibdp', 'Hindi', 'Gyaanmudra',
    105000, true, false, false, true
  ),
  (
    'ibdp-hindi-b-hl-io',
    'Shubham IBDP Hindi B-HL-IO',
    'Moukhik pareeksha par aadharit — उच्च स्तर',
    '978-93-48898-32-6',
    'ibdp', 'Hindi', 'Gyaanmudra',
    105000, true, false, false, true
  ),
  (
    'ibdp-hindi-b-shravan-lekhan',
    'Shubham IBDP Hindi B HL and SL — Shravan Lekhan (Listening)',
    'मानक तथा उच्च स्तर',
    '978-93-5810-024-2',
    'ibdp', 'Hindi', 'Self (Seema Sachdeva)',
    195000, true, true, false, true
  ),
  -- ---- IGCSE ----
  (
    'igcse-hindi-paper-1',
    'Shubham IGCSE Hindi as a Second Language — Paper 1 (Reading & Writing)',
    'New curriculum',
    '978-93-5782-125-4',
    'igcse', 'Hindi', 'Self (Seema Sachdeva)',
    195000, true, false, true, true
  ),
  (
    'igcse-hindi-paper-2-listening',
    'Shubham IGCSE Hindi as a Second Language — Paper 2 (Listening)',
    'New curriculum',
    '978-93-5813-838-2',
    'igcse', 'Hindi', 'Self (Seema Sachdeva)',
    199900, true, true, false, true
  );
