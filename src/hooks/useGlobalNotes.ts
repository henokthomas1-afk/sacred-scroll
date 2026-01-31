/**
 * useGlobalNotes - Hook for managing Obsidian-style global notes with folders
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GlobalNote,
  NoteFolder,
  NoteCitation,
  getAllFolders,
  getAllGlobalNotes,
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  createGlobalNote,
  updateGlobalNote,
  updateGlobalNoteFontSize,
  moveNote,
  deleteGlobalNote,
  getCitationsForGlobalNote,
  addGlobalNoteCitation,
  removeGlobalNoteCitation,
  calculateOrderBetween,
} from '@/lib/db/notesDb';

export interface TreeNode {
  id: string;
  type: 'folder' | 'note';
  name: string;
  parentId: string | null;
  order: number;
  children?: TreeNode[];
  data: NoteFolder | GlobalNote;
}

export function useGlobalNotes() {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [foldersData, notesData] = await Promise.all([
        getAllFolders(),
        getAllGlobalNotes(),
      ]);
      
      setFolders(foldersData);
      setNotes(notesData);
    } catch (err: any) {
      console.error('Error fetching notes data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build tree structure
  const tree = useMemo(() => {
    const buildTree = (parentId: string | null): TreeNode[] => {
      const folderNodes: TreeNode[] = folders
        .filter(f => f.parentId === parentId)
        .map(f => ({
          id: f.id,
          type: 'folder' as const,
          name: f.name,
          parentId: f.parentId,
          order: f.order,
          children: buildTree(f.id),
          data: f,
        }));

      const noteNodes: TreeNode[] = notes
        .filter(n => n.parentId === parentId)
        .map(n => ({
          id: n.id,
          type: 'note' as const,
          name: n.title,
          parentId: n.parentId,
          order: n.order,
          data: n,
        }));

      // Sort by order (not alphabetically!)
      return [...folderNodes, ...noteNodes].sort((a, b) => a.order - b.order);
    };

    return buildTree(null);
  }, [folders, notes]);

  // Get flat list of items for a parent
  const getChildrenForParent = useCallback((parentId: string | null): (NoteFolder | GlobalNote)[] => {
    const childFolders = folders.filter(f => f.parentId === parentId);
    const childNotes = notes.filter(n => n.parentId === parentId);
    return [...childFolders, ...childNotes].sort((a, b) => a.order - b.order);
  }, [folders, notes]);

  // ============= Folder Operations =============

  const handleCreateFolder = async (name: string, parentId: string | null = null): Promise<string> => {
    const id = await createFolder(name, parentId);
    await fetchData();
    return id;
  };

  const handleRenameFolder = async (id: string, name: string): Promise<void> => {
    await renameFolder(id, name);
    await fetchData();
  };

  const handleDeleteFolder = async (id: string): Promise<void> => {
    await deleteFolder(id);
    await fetchData();
  };

  // ============= Note Operations =============

  const handleCreateNote = async (
    title: string,
    content: string = '',
    parentId: string | null = null
  ): Promise<string> => {
    const id = await createGlobalNote(title, content, parentId);
    await fetchData();
    return id;
  };

  const handleUpdateNote = async (
    id: string,
    updates: Partial<Pick<GlobalNote, 'title' | 'content'>>
  ): Promise<void> => {
    await updateGlobalNote(id, updates);
    await fetchData();
  };

  const handleUpdateNoteFontSize = async (id: string, fontSize: number): Promise<void> => {
    await updateGlobalNoteFontSize(id, fontSize);
    // Don't refetch - font size updates are frequent and local
    setNotes(prev => prev.map(n => n.id === id ? { ...n, fontSize } : n));
  };

  const handleDeleteNote = async (id: string): Promise<void> => {
    await deleteGlobalNote(id);
    await fetchData();
  };

  // ============= Move Operations (Drag & Drop) =============

  const handleMoveItem = async (
    itemId: string,
    itemType: 'folder' | 'note',
    newParentId: string | null,
    beforeId: string | null,
    afterId: string | null
  ): Promise<void> => {
    // Calculate new order
    const siblings = getChildrenForParent(newParentId);
    
    let beforeOrder: number | null = null;
    let afterOrder: number | null = null;

    if (beforeId) {
      const beforeItem = siblings.find(s => s.id === beforeId);
      beforeOrder = beforeItem?.order ?? null;
    }

    if (afterId) {
      const afterItem = siblings.find(s => s.id === afterId);
      afterOrder = afterItem?.order ?? null;
    }

    const newOrder = calculateOrderBetween(beforeOrder, afterOrder);

    if (itemType === 'folder') {
      await moveFolder(itemId, newParentId, newOrder);
    } else {
      await moveNote(itemId, newParentId, newOrder);
    }

    await fetchData();
  };

  // ============= Citation Operations =============

  const handleAddCitation = async (
    noteId: string,
    targetDocumentId: string,
    citationText: string,
    targetNodeId?: string
  ): Promise<string> => {
    return addGlobalNoteCitation(noteId, targetDocumentId, citationText, targetNodeId);
  };

  const handleRemoveCitation = async (citationId: string): Promise<void> => {
    await removeGlobalNoteCitation(citationId);
  };

  const getCitations = async (noteId: string): Promise<NoteCitation[]> => {
    return getCitationsForGlobalNote(noteId);
  };

  return {
    folders,
    notes,
    tree,
    loading,
    error,
    // Folder operations
    createFolder: handleCreateFolder,
    renameFolder: handleRenameFolder,
    deleteFolder: handleDeleteFolder,
    // Note operations
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    updateNoteFontSize: handleUpdateNoteFontSize,
    deleteNote: handleDeleteNote,
    // Move operations
    moveItem: handleMoveItem,
    // Citation operations
    addCitation: handleAddCitation,
    removeCitation: handleRemoveCitation,
    getCitations,
    // Refresh
    refresh: fetchData,
  };
}
