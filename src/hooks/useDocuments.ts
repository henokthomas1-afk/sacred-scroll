/**
 * useDocuments - Hook for managing documents from database
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { ParsedDocument, DocumentNode, StructuralNode, CitableNode } from "@/types/document";
import { DatabaseDocument, DatabaseDocumentNode, DocumentCategory, SourceType } from "@/types/database";

export function useDocuments() {
  const { user, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all documents for the user
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch documents
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      // Fetch nodes for all documents
      const documentIds = docs?.map((d) => d.id) || [];
      
      if (documentIds.length === 0) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const { data: nodes, error: nodesError } = await supabase
        .from("document_nodes")
        .select("*")
        .in("document_id", documentIds)
        .order("node_order", { ascending: true });

      if (nodesError) throw nodesError;

      // Group nodes by document
      const nodesByDocument = (nodes || []).reduce((acc, node) => {
        const typedNode = node as DatabaseDocumentNode;
        if (!acc[typedNode.document_id]) {
          acc[typedNode.document_id] = [];
        }
        acc[typedNode.document_id].push(typedNode);
        return acc;
      }, {} as Record<string, DatabaseDocumentNode[]>);

      // Convert to ParsedDocument format
      const parsedDocs: ParsedDocument[] = (docs || []).map((doc) => {
        const docNodes = nodesByDocument[doc.id] || [];
        const convertedNodes = docNodes.map(convertDatabaseNode);
        const citableCount = convertedNodes.filter(n => n.nodeType === "citable").length;

        return {
          metadata: {
            id: doc.id,
            title: doc.title,
            author: doc.author || undefined,
            sourceType: doc.source_type as SourceType,
            importedAt: new Date(doc.created_at),
            totalCitableNodes: citableCount,
          },
          nodes: convertedNodes,
        };
      });

      setDocuments(parsedDocs);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Save a new document
  const saveDocument = async (
    title: string,
    author: string | undefined,
    category: DocumentCategory,
    sourceType: SourceType,
    nodes: DocumentNode[],
    rawContent?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Insert document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title,
          author: author || null,
          category,
          source_type: sourceType,
          raw_content: rawContent || null,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Insert nodes
      const nodeRecords = nodes.map((node, index) => ({
        document_id: doc.id,
        node_type: node.nodeType,
        node_order: index,
        level: node.nodeType === "structural" ? (node as StructuralNode).level : null,
        alignment: node.nodeType === "structural" ? (node as StructuralNode).alignment : null,
        number: node.nodeType === "citable" ? (node as CitableNode).number : null,
        display_number: node.nodeType === "citable" ? (node as CitableNode).displayNumber : null,
        content: node.content,
      }));

      const { error: nodesError } = await supabase
        .from("document_nodes")
        .insert(nodeRecords);

      if (nodesError) throw nodesError;

      // Refresh documents list
      await fetchDocuments();

      return doc.id;
    } catch (err: any) {
      console.error("Error saving document:", err);
      throw err;
    }
  };

  // Delete a document
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      await fetchDocuments();
      return true;
    } catch (err: any) {
      console.error("Error deleting document:", err);
      return false;
    }
  };

  return {
    documents,
    loading,
    error,
    saveDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}

// Convert database node to DocumentNode
function convertDatabaseNode(dbNode: DatabaseDocumentNode): DocumentNode {
  if (dbNode.node_type === "structural") {
    return {
      nodeType: "structural",
      id: dbNode.id,
      level: (dbNode.level || "heading") as any,
      content: dbNode.content,
      alignment: (dbNode.alignment || "left") as any,
    } as StructuralNode;
  }

  return {
    nodeType: "citable",
    id: dbNode.id,
    number: dbNode.number || 0,
    displayNumber: dbNode.display_number || "0",
    content: dbNode.content,
  } as CitableNode;
}
