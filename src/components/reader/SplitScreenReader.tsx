/**
 * SplitScreenReader - Side-by-side document comparison
 * 
 * Supports viewing two documents or two sections of the same document
 * with synchronized highlighting, citation navigation, and citation anchors.
 */

import { useState, useCallback } from "react";
import { ParsedDocument, CitableNode, isStructuralNode, isCitableNode } from "@/types/document";
import { StructuralNodeView } from "./StructuralNodeView";
import { CitableNodeView } from "./CitableNodeView";
import { CitationPanel } from "./CitationPanel";
import { CitationAnchorMenu } from "./CitationAnchorMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { X, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCitationAnchors } from "@/hooks/useCitationAnchors";
import { toast } from "@/hooks/use-toast";

interface SplitScreenReaderProps {
  primaryDocument: ParsedDocument;
  secondaryDocument?: ParsedDocument | null;
  onCloseSecondary?: () => void;
  onOpenSecondary?: () => void;
  onNavigateToNode?: (documentId: string, nodeId: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  className?: string;
}

export function SplitScreenReader({
  primaryDocument,
  secondaryDocument,
  onCloseSecondary,
  onOpenSecondary,
  onNavigateToNode,
  onNavigateToNote,
  className,
}: SplitScreenReaderProps) {
  const [primarySelectedNodes, setPrimarySelectedNodes] = useState<Set<string>>(new Set());
  const [secondarySelectedNodes, setSecondarySelectedNodes] = useState<Set<string>>(new Set());
  const [showCitationPanel, setShowCitationPanel] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // Citation anchors for primary document
  const primaryAnchors = useCitationAnchors(primaryDocument.metadata.id);
  const secondaryAnchors = useCitationAnchors(secondaryDocument?.metadata.id || null);

  const handlePrimaryNodeSelect = useCallback((node: CitableNode) => {
    setPrimarySelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      setShowCitationPanel(next.size > 0 || secondarySelectedNodes.size > 0);
      return next;
    });
  }, [secondarySelectedNodes.size]);

  const handleSecondaryNodeSelect = useCallback((node: CitableNode) => {
    setSecondarySelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      setShowCitationPanel(next.size > 0 || primarySelectedNodes.size > 0);
      return next;
    });
  }, [primarySelectedNodes.size]);

  const handleClearSelection = useCallback(() => {
    setPrimarySelectedNodes(new Set());
    setSecondarySelectedNodes(new Set());
    setShowCitationPanel(false);
  }, []);

  const getSelectedCitableNodes = (
    document: ParsedDocument,
    selectedIds: Set<string>
  ): CitableNode[] => {
    return document.nodes
      .filter(isCitableNode)
      .filter((node) => selectedIds.has(node.id))
      .sort((a, b) => a.number - b.number);
  };

  // Handle adding citation anchor
  const handleAddToNote = useCallback(async (
    node: CitableNode,
    docId: string,
    docTitle: string,
    noteId: string,
    noteTitle: string,
    anchorsHook: ReturnType<typeof useCitationAnchors>
  ) => {
    const displayLabel = `${docTitle} §${node.displayNumber}`;
    const id = await anchorsHook.addAnchor(node.id, noteId, displayLabel);
    
    if (id) {
      toast({ title: `Cited in "${noteTitle}"` });
    } else {
      toast({ 
        title: 'Already cited', 
        description: 'This paragraph is already linked to that note.',
        variant: 'default',
      });
    }
  }, []);

  // Navigate to a citation in the split view
  const handleCitationNavigate = useCallback((documentId: string, nodeId: string) => {
    if (secondaryDocument && secondaryDocument.metadata.id === documentId) {
      setHighlightedNodeId(nodeId);
      const element = document.querySelector(`[data-paragraph-id="${nodeId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedNodeId(null), 2000);
    } else if (primaryDocument.metadata.id === documentId) {
      setHighlightedNodeId(nodeId);
      const element = document.querySelector(`[data-paragraph-id="${nodeId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedNodeId(null), 2000);
    } else {
      onNavigateToNode?.(documentId, nodeId);
    }
  }, [primaryDocument, secondaryDocument, onNavigateToNode]);

  const renderDocumentPane = (
    doc: ParsedDocument,
    selectedNodes: Set<string>,
    onSelect: (node: CitableNode) => void,
    anchorsHook: ReturnType<typeof useCitationAnchors>,
    isPrimary: boolean
  ) => (
    <div className="flex flex-col h-full">
      {/* Document Header */}
      <header className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-foreground truncate">
              {doc.metadata.title}
            </h2>
            {doc.metadata.author && (
              <p className="text-sm text-muted-foreground italic truncate">
                {doc.metadata.author}
              </p>
            )}
          </div>
          {!isPrimary && onCloseSecondary && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseSecondary}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Reading Area */}
      <ScrollArea className="flex-1 parchment-texture">
        <article className="max-w-2xl mx-auto px-6 py-6">
          {doc.nodes.map((node) => {
            if (isStructuralNode(node)) {
              return <StructuralNodeView key={node.id} node={node} />;
            }
            
            if (isCitableNode(node)) {
              return (
                <CitableNodeView
                  key={node.id}
                  node={node}
                  isSelected={selectedNodes.has(node.id)}
                  isHighlighted={highlightedNodeId === node.id}
                  hasAnchor={anchorsHook.hasAnchor(node.id)}
                  onSelect={onSelect}
                  renderCitationButton={() => (
                    <CitationAnchorMenu
                      node={node}
                      documentId={doc.metadata.id}
                      documentTitle={doc.metadata.title}
                      onAddToNote={(noteId, noteTitle) => 
                        handleAddToNote(node, doc.metadata.id, doc.metadata.title, noteId, noteTitle, anchorsHook)
                      }
                      onCreateNote={(noteId, noteTitle) => {
                        handleAddToNote(node, doc.metadata.id, doc.metadata.title, noteId, noteTitle, anchorsHook);
                        onNavigateToNote?.(noteId);
                      }}
                    />
                  )}
                />
              );
            }
            
            return null;
          })}
        </article>
      </ScrollArea>
    </div>
  );

  // Single document mode
  if (!secondaryDocument) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header with split option */}
        <header className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {primaryDocument.metadata.title}
              </h1>
              {primaryDocument.metadata.author && (
                <p className="mt-1 font-body text-lg text-muted-foreground italic">
                  {primaryDocument.metadata.author}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {primaryDocument.metadata.totalCitableNodes} citable paragraphs
              </p>
            </div>
            {onOpenSecondary && (
              <Button variant="outline" size="sm" onClick={onOpenSecondary}>
                <Columns2 className="h-4 w-4 mr-2" />
                Split View
              </Button>
            )}
          </div>
        </header>

        {/* Reading Area */}
        <ScrollArea className="flex-1 parchment-texture">
          <article className="max-w-3xl mx-auto px-8 py-8">
            {primaryDocument.nodes.map((node) => {
              if (isStructuralNode(node)) {
                return <StructuralNodeView key={node.id} node={node} />;
              }
              
              if (isCitableNode(node)) {
                return (
                  <CitableNodeView
                    key={node.id}
                    node={node}
                    isSelected={primarySelectedNodes.has(node.id)}
                    isHighlighted={highlightedNodeId === node.id}
                    hasAnchor={primaryAnchors.hasAnchor(node.id)}
                    onSelect={handlePrimaryNodeSelect}
                    renderCitationButton={() => (
                      <CitationAnchorMenu
                        node={node}
                        documentId={primaryDocument.metadata.id}
                        documentTitle={primaryDocument.metadata.title}
                        onAddToNote={(noteId, noteTitle) => 
                          handleAddToNote(node, primaryDocument.metadata.id, primaryDocument.metadata.title, noteId, noteTitle, primaryAnchors)
                        }
                        onCreateNote={(noteId, noteTitle) => {
                          handleAddToNote(node, primaryDocument.metadata.id, primaryDocument.metadata.title, noteId, noteTitle, primaryAnchors);
                          onNavigateToNote?.(noteId);
                        }}
                      />
                    )}
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
            document={primaryDocument}
            selectedNodes={getSelectedCitableNodes(primaryDocument, primarySelectedNodes)}
            onClear={handleClearSelection}
          />
        )}
      </div>
    );
  }

  // Split screen mode
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={30}>
          {renderDocumentPane(
            primaryDocument,
            primarySelectedNodes,
            handlePrimaryNodeSelect,
            primaryAnchors,
            true
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          {renderDocumentPane(
            secondaryDocument,
            secondarySelectedNodes,
            handleSecondaryNodeSelect,
            secondaryAnchors,
            false
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Combined Citation Panel */}
      {showCitationPanel && (
        <CitationPanel
          document={primaryDocument}
          selectedNodes={[
            ...getSelectedCitableNodes(primaryDocument, primarySelectedNodes),
            ...getSelectedCitableNodes(secondaryDocument, secondarySelectedNodes),
          ]}
          onClear={handleClearSelection}
        />
      )}
    </div>
  );
}
