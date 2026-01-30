/**
 * useLocalNotes - Hook for managing notes with citations from IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getNotesForDocument,
  getCitationsForNotes,
  createNote as dbCreateNote,
  updateNote as dbUpdateNote,
  deleteNote as dbDeleteNote,
  addNoteCitation,
  removeNoteCitation,
  LocalNote,
  LocalNoteCitation,
  NoteType,
} from '@/lib/db';

export interface NoteWithCitations extends LocalNote {
  citations: LocalNoteCitation[];
}

export function useLocalNotes(documentId: string | null) {
  const [notes, setNotes] = useState<NoteWithCitations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notes for a document
  const fetchNotes = useCallback(async () => {
    if (!documentId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const notesData = await getNotesForDocument(documentId);

      if (notesData.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }

      // Fetch citations for all notes
      const noteIds = notesData.map(n => n.id);
      const citationsData = await getCitationsForNotes(noteIds);

      // Group citations by note
      const citationsByNote = citationsData.reduce((acc, citation) => {
        if (!acc[citation.noteId]) {
          acc[citation.noteId] = [];
        }
        acc[citation.noteId].push(citation);
        return acc;
      }, {} as Record<string, LocalNoteCitation[]>);

      // Combine notes with citations
      const notesWithCitations: NoteWithCitations[] = notesData.map(note => ({
        ...note,
        citations: citationsByNote[note.id] || [],
      }));

      setNotes(notesWithCitations);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create a new note
  const createNote = async (
    noteType: NoteType,
    content: string,
    nodeId?: string
  ): Promise<string | null> => {
    if (!documentId) return null;

    try {
      const id = await dbCreateNote(documentId, noteType, content, nodeId);
      await fetchNotes();
      return id;
    } catch (err: any) {
      console.error('Error creating note:', err);
      throw err;
    }
  };

  // Update a note
  const updateNote = async (noteId: string, content: string): Promise<boolean> => {
    try {
      await dbUpdateNote(noteId, content);
      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error('Error updating note:', err);
      return false;
    }
  };

  // Delete a note
  const deleteNote = async (noteId: string): Promise<boolean> => {
    try {
      await dbDeleteNote(noteId);
      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error('Error deleting note:', err);
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
      await addNoteCitation(noteId, targetDocumentId, citationText, targetNodeId);
      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error('Error adding citation:', err);
      return false;
    }
  };

  // Remove citation from a note
  const removeCitation = async (citationId: string): Promise<boolean> => {
    try {
      await removeNoteCitation(citationId);
      await fetchNotes();
      return true;
    } catch (err: any) {
      console.error('Error removing citation:', err);
      return false;
    }
  };

  // Get notes for a specific node
  const getNotesForNode = (nodeId: string): NoteWithCitations[] => {
    return notes.filter(n => n.nodeId === nodeId);
  };

  // Get document-level notes
  const getDocumentNotes = (): NoteWithCitations[] => {
    return notes.filter(n => n.type === 'document');
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
