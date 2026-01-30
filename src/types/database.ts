/**
 * Database types for Supabase integration
 */

export type DocumentCategory = "scripture" | "catechism" | "patristic" | "commentary" | "custom";
export type SourceType = "catechism" | "scripture" | "patristic" | "treatise" | "generic";
export type NoteType = "document" | "section" | "paragraph";

export interface DatabaseDocument {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  category: DocumentCategory;
  source_type: SourceType;
  raw_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDocumentNode {
  id: string;
  document_id: string;
  node_type: "structural" | "citable";
  node_order: number;
  level: string | null;
  alignment: string | null;
  number: number | null;
  display_number: string | null;
  content: string;
  created_at: string;
}

export interface DatabaseNote {
  id: string;
  user_id: string;
  document_id: string;
  node_id: string | null;
  note_type: NoteType;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNoteCitation {
  id: string;
  note_id: string;
  target_document_id: string;
  target_node_id: string | null;
  citation_text: string;
  created_at: string;
}
