-- ============================================================================
-- Add 'audio' to the sample_kind enum so books can have short audio preview
-- clips (the Sample_Audios set), playable in the "View sample" dialog.
-- Previously only 'pdf' and 'image' samples were supported, so audio samples
-- had nowhere to live.
-- ============================================================================
alter type public.sample_kind add value if not exists 'audio';
