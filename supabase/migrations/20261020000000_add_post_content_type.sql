ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS content_type text;

UPDATE public.posts
SET content_type = 'guide'
WHERE content_type IS NULL
   OR content_type NOT IN ('announcement', 'guide');

ALTER TABLE public.posts
ALTER COLUMN content_type SET DEFAULT 'guide',
ALTER COLUMN content_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_content_type_check'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_content_type_check
    CHECK (content_type IN ('announcement', 'guide'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS posts_content_type_status_created_at_idx
ON public.posts (content_type, status, created_at DESC);
