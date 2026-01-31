/**
 * useCitationAnchors - Hook for managing bidirectional citation anchors
 * 
 * Links reader paragraphs to notes with order preservation.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CitationAnchor,
  getAnchorsForNote,
  getAnchorsForDocument,
  createCitationAnchor,
  removeCitationAnchor,
  anchorExists,
} from '@/lib/db/notesDb';

export function useCitationAnchors(documentId: string | null) {
  const [anchors, setAnchors] = useState<CitationAnchor[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchoredNodeIds, setAnchoredNodeIds] = useState<Set<string>>(new Set());

  // Fetch all anchors for the document
  const fetchAnchors = useCallback(async () => {
    if (!documentId) {
      setAnchors([]);
      setAnchoredNodeIds(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAnchorsForDocument(documentId);
      setAnchors(data);
      
      // Build set of anchored node IDs for quick lookup
      const nodeIds = new Set(data.map(a => a.nodeId));
      setAnchoredNodeIds(nodeIds);
    } catch (err) {
      console.error('Error fetching citation anchors:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchAnchors();
  }, [fetchAnchors]);

  // Create an anchor from paragraph to note
  const addAnchor = useCallback(async (
    nodeId: string,
    noteId: string,
    displayLabel: string
  ): Promise<string | null> => {
    if (!documentId) return null;

    // Check if already exists
    const exists = await anchorExists(documentId, nodeId, noteId);
    if (exists) {
      return null;
    }

    const id = await createCitationAnchor(documentId, nodeId, noteId, displayLabel);
    await fetchAnchors();
    return id;
  }, [documentId, fetchAnchors]);

  // Remove an anchor
  const removeAnchor = useCallback(async (anchorId: string): Promise<void> => {
    await removeCitationAnchor(anchorId);
    await fetchAnchors();
  }, [fetchAnchors]);

  // Check if a node has any anchors
  const hasAnchor = useCallback((nodeId: string): boolean => {
    return anchoredNodeIds.has(nodeId);
  }, [anchoredNodeIds]);

  // Get anchors for a specific node
  const getAnchorsForNode = useCallback((nodeId: string): CitationAnchor[] => {
    return anchors.filter(a => a.nodeId === nodeId);
  }, [anchors]);

  return {
    anchors,
    loading,
    anchoredNodeIds,
    addAnchor,
    removeAnchor,
    hasAnchor,
    getAnchorsForNode,
    refresh: fetchAnchors,
  };
}

/**
 * Hook for getting anchors attached to a specific note
 */
export function useNoteAnchors(noteId: string | null) {
  const [anchors, setAnchors] = useState<CitationAnchor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnchors = useCallback(async () => {
    if (!noteId) {
      setAnchors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAnchorsForNote(noteId);
      setAnchors(data);
    } catch (err) {
      console.error('Error fetching note anchors:', err);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchAnchors();
  }, [fetchAnchors]);

  return {
    anchors,
    loading,
    refresh: fetchAnchors,
  };
}
