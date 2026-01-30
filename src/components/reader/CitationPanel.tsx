/**
 * CitationPanel - Displays and allows copying of citations
 */

import { useCallback } from "react";
import { ParsedDocument, CitableNode } from "@/types/document";
import { formatCitationRange } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { Copy, X, Quote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CitationPanelProps {
  document: ParsedDocument;
  selectedNodes: CitableNode[];
  onClear: () => void;
}

export function CitationPanel({ document, selectedNodes, onClear }: CitationPanelProps) {
  const { toast } = useToast();
  
  if (selectedNodes.length === 0) return null;

  const numbers = selectedNodes.map((n) => n.number).sort((a, b) => a - b);
  const minNumber = numbers[0];
  const maxNumber = numbers[numbers.length - 1];
  
  const citationRef = formatCitationRange(document, minNumber, maxNumber);
  
  const fullContent = selectedNodes
    .map((node) => node.content)
    .join("\n\n");

  const handleCopyCitation = useCallback(() => {
    const citation = `${fullContent}\n\n— ${citationRef}`;
    navigator.clipboard.writeText(citation);
    toast({
      title: "Citation copied",
      description: citationRef,
    });
  }, [fullContent, citationRef, toast]);

  const handleCopyReference = useCallback(() => {
    navigator.clipboard.writeText(citationRef);
    toast({
      title: "Reference copied",
      description: citationRef,
    });
  }, [citationRef, toast]);

  return (
    <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">
              {citationRef}
            </span>
            <span className="text-sm text-muted-foreground">
              ({selectedNodes.length} paragraph{selectedNodes.length > 1 ? 's' : ''} selected)
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="bg-secondary/50 rounded-md p-4 max-h-32 overflow-y-auto mb-3">
          <p className="font-body text-sm text-foreground line-clamp-4">
            {fullContent}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleCopyCitation}
            className="flex-1"
            variant="default"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy with Citation
          </Button>
          <Button
            onClick={handleCopyReference}
            variant="outline"
          >
            Copy Reference Only
          </Button>
        </div>
      </div>
    </div>
  );
}
