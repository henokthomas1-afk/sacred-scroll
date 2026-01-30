-- 1. Fix ordering (CRITICAL)
ALTER TABLE public.document_nodes
  ALTER COLUMN node_order TYPE NUMERIC;

-- 2. Add canonical citation ID
ALTER TABLE public.document_nodes
  ADD COLUMN canonical_id TEXT;

CREATE UNIQUE INDEX idx_document_nodes_canonical_id
  ON public.document_nodes(canonical_id)
  WHERE canonical_id IS NOT NULL;

-- 3. Constrain structural metadata
ALTER TABLE public.document_nodes
  ADD CONSTRAINT document_nodes_level_check
  CHECK (level IS NULL OR level IN (
    'title',
    'part',
    'chapter',
    'section',
    'article',
    'subsection'
  ));

ALTER TABLE public.document_nodes
  ADD CONSTRAINT document_nodes_alignment_check
  CHECK (alignment IS NULL OR alignment IN ('center', 'left'));

-- 4. Prevent citations to structural nodes
ALTER TABLE public.notes
  ADD CONSTRAINT notes_node_citable_only
  CHECK (
    node_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.document_nodes dn
      WHERE dn.id = node_id
        AND dn.node_type = 'citable'
    )
  );
