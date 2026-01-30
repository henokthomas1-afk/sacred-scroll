/**
 * DocumentReader - Main reading view for parsed documents
 * 
 * Renders a linear list of nodes with correct structure and citation support.
 * UI rendering depends ONLY on nodeType, never regexes or text guessing.
 */

import { useState, useCallback } from "react";
import { ParsedDocument, CitableNode, isStructuralNode, isCitableNode } from "@/types/document";
import { StructuralNodeView } from "./StructuralNodeView";
import { CitableNodeView } from "./CitableNodeView";
import { CitationPanel } from "./CitationPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DocumentReaderProps {
  document: ParsedDocument;
  className?: string;
}

export function DocumentReader({ document, className }: DocumentReaderProps) {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [showCitationPanel, setShowCitationPanel] = useState(false);

  const handleNodeSelect = useCallback((node: CitableNode) => {
    setSelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      
      // Show citation panel if any nodes are selected
      setShowCitationPanel(next.size > 0);
      
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedNodes(new Set());
    setShowCitationPanel(false);
  }, []);

  const getSelectedCitableNodes = (): CitableNode[] => {
    return document.nodes
      .filter(isCitableNode)
      .filter((node) => selectedNodes.has(node.id))
      .sort((a, b) => a.number - b.number);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Document Header */}
      <header className="flex-shrink-0 border-b border-border bg-card px-8 py-6 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {document.metadata.title}
        </h1>
        {document.metadata.author && (
          <p className="mt-2 font-body text-lg text-muted-foreground italic">
            {document.metadata.author}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {document.metadata.totalCitableNodes} citable paragraphs
        </p>
      </header>

      {/* Reading Area */}
      <ScrollArea className="flex-1 parchment-texture">
        <article className="max-w-3xl mx-auto px-8 py-8">
          {document.nodes.map((node) => {
            if (isStructuralNode(node)) {
              return <StructuralNodeView key={node.id} node={node} />;
            }
            
            if (isCitableNode(node)) {
              return (
                <CitableNodeView
                  key={node.id}
                  node={node}
                  isSelected={selectedNodes.has(node.id)}
                  onSelect={handleNodeSelect}
                />
              );
            }
            
            return null;
          })}
        </article>
      </ScrollArea>

      {/* Citation Panel */}
      {showCitationPanel && (
        <CitationPanel
          document={document}
          selectedNodes={getSelectedCitableNodes()}
          onClear={handleClearSelection}
        />
      )}
    </div>
  );
}
