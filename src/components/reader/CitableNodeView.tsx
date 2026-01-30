/**
 * CitableNodeView - Renders citable paragraphs
 * 
 * Citable nodes:
 * - Render paragraph number + text
 * - Are selectable and highlightable
 * - Support paragraph-based citations
 * - Are the ONLY nodes eligible for citation
 */

import { CitableNode } from "@/types/document";
import { cn } from "@/lib/utils";

interface CitableNodeViewProps {
  node: CitableNode;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSelect?: (node: CitableNode) => void;
}

export function CitableNodeView({ 
  node, 
  isSelected,
  isHighlighted,
  onSelect 
}: CitableNodeViewProps) {
  const handleClick = () => {
    onSelect?.(node);
  };

  return (
    <div
      className={cn(
        "group relative py-2 transition-colors duration-200",
        "hover:bg-accent/20 cursor-pointer rounded-sm",
        isSelected && "bg-primary/10 hover:bg-primary/15",
        isHighlighted && "bg-gold/20"
      )}
      onClick={handleClick}
      role="article"
      aria-label={`Paragraph ${node.displayNumber}`}
      data-paragraph-id={node.id}
      data-paragraph-number={node.number}
    >
      <div className="flex gap-4">
        {/* Paragraph number */}
        <span 
          className={cn(
            "flex-shrink-0 w-10 text-right font-display font-semibold",
            "text-muted-foreground group-hover:text-primary transition-colors",
            isSelected && "text-primary"
          )}
        >
          {node.displayNumber}
        </span>
        
        {/* Paragraph content */}
        <p className="flex-1 font-body text-lg leading-relaxed text-foreground">
          {node.content}
        </p>
      </div>
      
      {/* Footnotes if present */}
      {node.footnotes && node.footnotes.length > 0 && (
        <div className="mt-2 ml-14 border-l-2 border-border pl-4">
          {node.footnotes.map((footnote) => (
            <p 
              key={footnote.id}
              className="text-sm text-muted-foreground font-body"
            >
              <sup className="mr-1">{footnote.marker}</sup>
              {footnote.content}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
