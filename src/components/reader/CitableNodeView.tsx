/**
 * CitableNodeView - Renders citable paragraphs
 * 
 * Citable nodes:
 * - Render paragraph number + text
 * - Are selectable and highlightable
 * - Support paragraph-based citations
 * - Show citation anchor button on hover
 * - Display visual indicator if anchored to notes
 */

import { CitableNode } from "@/types/document";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";

interface CitableNodeViewProps {
  node: CitableNode;
  isSelected?: boolean;
  isHighlighted?: boolean;
  hasAnchor?: boolean;
  onSelect?: (node: CitableNode) => void;
  renderCitationButton?: () => React.ReactNode;
}

export function CitableNodeView({ 
  node, 
  isSelected,
  isHighlighted,
  hasAnchor,
  onSelect,
  renderCitationButton,
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
        {/* Paragraph number with anchor indicator */}
        <div className="flex-shrink-0 w-10 flex items-start justify-end gap-1">
          {/* Anchor indicator */}
          {hasAnchor && (
            <Bookmark 
              className="h-3 w-3 text-primary fill-primary/30 mt-1.5" 
              aria-label="Has citations"
            />
          )}
          <span 
            className={cn(
              "font-display font-semibold text-right",
              "text-muted-foreground group-hover:text-primary transition-colors",
              isSelected && "text-primary"
            )}
          >
            {node.displayNumber}
          </span>
        </div>
        
        {/* Paragraph content */}
        <p className="flex-1 font-body text-lg leading-relaxed text-foreground">
          {node.content}
        </p>

        {/* Citation anchor button (rendered via prop) */}
        {renderCitationButton && (
          <div className="flex-shrink-0 flex items-start pt-1">
            {renderCitationButton()}
          </div>
        )}
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
