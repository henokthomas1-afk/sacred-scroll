-- Create categories enum
CREATE TYPE document_category AS ENUM ('scripture', 'catechism', 'patristic', 'commentary', 'custom');

-- Create source type enum (for parsing rules)
CREATE TYPE source_type AS ENUM ('catechism', 'scripture', 'patristic', 'treatise', 'generic');

-- Documents table - stores imported documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  category document_category NOT NULL DEFAULT 'custom',
  source_type source_type NOT NULL DEFAULT 'generic',
  raw_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document nodes - the parsed structural and citable nodes
CREATE TABLE public.document_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('structural', 'citable')),
  node_order INTEGER NOT NULL,
  -- Structural node fields
  level TEXT,
  alignment TEXT,
  -- Citable node fields
  number INTEGER,
  display_number TEXT,
  -- Common
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes table - supports document, section, and paragraph notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.document_nodes(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('document', 'section', 'paragraph')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note citations - links from notes to other nodes
CREATE TABLE public.note_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES public.document_nodes(id) ON DELETE SET NULL,
  citation_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_document_nodes_document_id ON public.document_nodes(document_id);
CREATE INDEX idx_document_nodes_order ON public.document_nodes(document_id, node_order);
CREATE INDEX idx_notes_document_id ON public.notes(document_id);
CREATE INDEX idx_notes_node_id ON public.notes(node_id);
CREATE INDEX idx_note_citations_note_id ON public.note_citations(note_id);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_citations ENABLE ROW LEVEL SECURITY;

-- Documents policies - users can only access their own documents
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Document nodes policies - access through document ownership
CREATE POLICY "Users can view nodes of their documents"
  ON public.document_nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_nodes.document_id 
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can create nodes for their documents"
  ON public.document_nodes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_nodes.document_id 
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete nodes of their documents"
  ON public.document_nodes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_nodes.document_id 
    AND documents.user_id = auth.uid()
  ));

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Note citations policies - access through note ownership
CREATE POLICY "Users can view citations of their notes"
  ON public.note_citations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_citations.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can create citations for their notes"
  ON public.note_citations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_citations.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete citations of their notes"
  ON public.note_citations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = note_citations.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();