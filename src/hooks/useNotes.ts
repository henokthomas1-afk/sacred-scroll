/**
 * useNotes - Hook for managing notes with citations
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { DatabaseNote, DatabaseNoteCitation, NoteType } from "@/types/database";

export interface NoteWithCitations extends DatabaseNote {
  citations: DatabaseNoteCitation[];
}

export function useNotes(documentId: string | null) {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<NoteWithCitations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notes for a document
  const fetchNotes = useCallback(async () => {
    if (!isAuthenticated || !user || !documentId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;

      if (!notesData || notesData.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }

      // Fetch citations for all notes
      const noteIds = notesData.map((n) => n.id);
      const { data: citationsData, error: citationsError } = await supabase
        .from("note_citations")
        .select("*")
        .in("note_id", noteIds);

      if (citationsError) throw citationsError;

      // Group citations by note
      const citationsByNote = (citationsData || []).reduce((acc, citation) => {
        if (!acc[citation.note_id]) {
          acc[citation.note_id] = [];
        }
        acc[citation.note_id].push(citation as DatabaseNoteCitation);
        return acc;
      }, {} as Record<string, DatabaseNoteCitation[]>);

      // Combine notes with citations
      const notesWithCitations: NoteWithCitations[] = notesData.map((note) => ({
        ...(note as DatabaseNote),
        citations: citationsByNote[note.id] || [],
      }));

      setNotes(notesWithCitations);
    } catch (err: any) {
      console.error("Error fetching notes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, documentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create a new note
  const createNote = async (
    noteType: NoteType,
    content: string,
    nodeId?: string
  ): Promise<string | null> => {
    if (!user || !documentId) return null;

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          document_id: documentId,
          node_id: nodeId || null,
          note_type: noteType,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchNotes();
      return data.id;
    } catch (err: any) {
      console.error("Error creating note:", err);
      throw err;
    }
  };

  // Update a note
  const updateNote = async (noteId: string, content: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ content })
        .eq("id", noteId);

      if (error) throw error;

      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error("Error updating note:", err);
      return false;
    }
  };

  // Delete a note
  const deleteNote = async (noteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error("Error deleting note:", err);
      return false;
    }
  };

  // Add citation to a note
  const addCitation = async (
    noteId: string,
    targetDocumentId: string,
    citationText: string,
    targetNodeId?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("note_citations")
        .insert({
          note_id: noteId,
          target_document_id: targetDocumentId,
          target_node_id: targetNodeId || null,
          citation_text: citationText,
        });

      if (error) throw error;

      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error("Error adding citation:", err);
      return false;
    }
  };

  // Remove citation from a note
  const removeCitation = async (citationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("note_citations")
        .delete()
        .eq("id", citationId);

      if (error) throw error;

      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error("Error removing citation:", err);
      return false;
    }
  };

  // Get notes for a specific node
  const getNotesForNode = (nodeId: string): NoteWithCitations[] => {
    return notes.filter((n) => n.node_id === nodeId);
  };

  // Get document-level notes
  const getDocumentNotes = (): NoteWithCitations[] => {
    return notes.filter((n) => n.note_type === "document");
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    addCitation,
    removeCitation,
    getNotesForNode,
    getDocumentNotes,
    refreshNotes: fetchNotes,
  };
}
