/**
 * useLocalDocuments - Hook for managing documents from IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllDocuments,
  getDocumentNodes,
  saveDocument,
  deleteDocument as deleteDoc,
  LocalDocument,
  LocalDocumentNode,
  DocumentCategory,
  SourceType,
  generateId,
} from '@/lib/db';
import { ParsedDocument, DocumentNode, StructuralNode, CitableNode } from '@/types/document';

export function useLocalDocuments() {
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const docs = await getAllDocuments();

      // Fetch nodes for each document
      const parsedDocs: ParsedDocument[] = await Promise.all(
        docs.map(async (doc) => {
          const nodes = await getDocumentNodes(doc.id);
          const convertedNodes = nodes.map(convertLocalNode);
          const citableCount = convertedNodes.filter(n => n.nodeType === 'citable').length;

          return {
            metadata: {
              id: doc.id,
              title: doc.title,
              author: doc.author,
              sourceType: doc.sourceType as SourceType,
              importedAt: new Date(doc.createdAt),
              totalCitableNodes: citableCount,
            },
            nodes: convertedNodes,
          };
        })
      );

      setDocuments(parsedDocs);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Save a new document
  const addDocument = async (
    title: string,
    author: string | undefined,
    category: DocumentCategory,
    sourceType: SourceType,
    nodes: DocumentNode[],
    rawContent?: string
  ): Promise<string | null> => {
    try {
      const localNodes = nodes.map((node, index) => ({
        nodeType: node.nodeType,
        order: index,
        level: node.nodeType === 'structural' ? (node as StructuralNode).level : undefined,
        alignment: node.nodeType === 'structural' ? (node as StructuralNode).alignment : undefined,
        number: node.nodeType === 'citable' ? (node as CitableNode).number : undefined,
        displayNumber: node.nodeType === 'citable' ? (node as CitableNode).displayNumber : undefined,
        content: node.content,
      }));

      const docId = await saveDocument(
        {
          title,
          author,
          category,
          sourceType,
          rawContent,
        },
        localNodes
      );

      await fetchDocuments();
      return docId;
    } catch (err: any) {
      console.error('Error saving document:', err);
      throw err;
    }
  };

  // Delete a document
  const removeDocument = async (documentId: string): Promise<boolean> => {
    try {
      await deleteDoc(documentId);
      await fetchDocuments();
      return true;
    } catch (err: any) {
      console.error('Error deleting document:', err);
      return false;
    }
  };

  return {
    documents,
    loading,
    error,
    saveDocument: addDocument,
    deleteDocument: removeDocument,
    refreshDocuments: fetchDocuments,
  };
}

// Convert local node to DocumentNode
function convertLocalNode(node: LocalDocumentNode): DocumentNode {
  if (node.nodeType === 'structural') {
    return {
      nodeType: 'structural',
      id: node.id,
      level: (node.level || 'heading') as any,
      content: node.content,
      alignment: (node.alignment || 'left') as any,
    } as StructuralNode;
  }

  return {
    nodeType: 'citable',
    id: node.id,
    number: node.number || 0,
    displayNumber: node.displayNumber || '0',
    content: node.content,
  } as CitableNode;
}
