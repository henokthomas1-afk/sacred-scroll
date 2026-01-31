/**
 * useDocumentFolders - Hook for managing document library folders
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentFolder,
  DocumentFolderAssignment,
  getAllDocumentFolders,
  getAllDocumentAssignments,
  createDocumentFolder,
  renameDocumentFolder,
  moveDocumentFolder,
  deleteDocumentFolder,
  moveDocumentInFolder,
  calculateOrderBetween,
} from '@/lib/db/documentsDb';
import { ParsedDocument } from '@/types/document';

export interface DocTreeNode {
  id: string;
  type: 'folder' | 'document';
  name: string;
  parentId: string | null;
  order: number;
  children?: DocTreeNode[];
  data: DocumentFolder | ParsedDocument;
}

export function useDocumentFolders(documents: ParsedDocument[]) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [assignments, setAssignments] = useState<DocumentFolderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [foldersData, assignmentsData] = await Promise.all([
        getAllDocumentFolders(),
        getAllDocumentAssignments(),
      ]);
      
      setFolders(foldersData);
      setAssignments(assignmentsData);
    } catch (err: any) {
      console.error('Error fetching document folders:', err);
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
    const assignmentMap = new Map(assignments.map(a => [a.documentId, a]));

    const buildTree = (parentId: string | null): DocTreeNode[] => {
      const folderNodes: DocTreeNode[] = folders
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

      const docNodes: DocTreeNode[] = documents
        .filter(doc => {
          const assignment = assignmentMap.get(doc.metadata.id);
          const docFolderId = assignment?.folderId ?? null;
          return docFolderId === parentId;
        })
        .map(doc => {
          const assignment = assignmentMap.get(doc.metadata.id);
          return {
            id: doc.metadata.id,
            type: 'document' as const,
            name: doc.metadata.title,
            parentId: parentId,
            order: assignment?.order ?? 0,
            data: doc,
          };
        });

      // Sort by order
      return [...folderNodes, ...docNodes].sort((a, b) => a.order - b.order);
    };

    return buildTree(null);
  }, [folders, assignments, documents]);

  // Get flat list of items for a parent
  const getChildrenForParent = useCallback((parentId: string | null): (DocumentFolder | { id: string; order: number })[] => {
    const childFolders = folders.filter(f => f.parentId === parentId);
    const childDocs = documents
      .filter(doc => {
        const assignment = assignments.find(a => a.documentId === doc.metadata.id);
        const docFolderId = assignment?.folderId ?? null;
        return docFolderId === parentId;
      })
      .map(doc => {
        const assignment = assignments.find(a => a.documentId === doc.metadata.id);
        return { id: doc.metadata.id, order: assignment?.order ?? 0 };
      });
    return [...childFolders, ...childDocs].sort((a, b) => a.order - b.order);
  }, [folders, assignments, documents]);

  // ============= Folder Operations =============

  const handleCreateFolder = async (name: string, parentId: string | null = null): Promise<string> => {
    const id = await createDocumentFolder(name, parentId);
    await fetchData();
    return id;
  };

  const handleRenameFolder = async (id: string, name: string): Promise<void> => {
    await renameDocumentFolder(id, name);
    await fetchData();
  };

  const handleDeleteFolder = async (id: string): Promise<void> => {
    await deleteDocumentFolder(id);
    await fetchData();
  };

  // ============= Move Operations (Drag & Drop) =============

  const handleMoveItem = async (
    itemId: string,
    itemType: 'folder' | 'document',
    newParentId: string | null,
    beforeId: string | null,
    afterId: string | null
  ): Promise<void> => {
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
      await moveDocumentFolder(itemId, newParentId, newOrder);
    } else {
      await moveDocumentInFolder(itemId, newParentId, newOrder);
    }

    await fetchData();
  };

  return {
    folders,
    assignments,
    tree,
    loading,
    error,
    // Folder operations
    createFolder: handleCreateFolder,
    renameFolder: handleRenameFolder,
    deleteFolder: handleDeleteFolder,
    // Move operations
    moveItem: handleMoveItem,
    // Refresh
    refresh: fetchData,
  };
}
