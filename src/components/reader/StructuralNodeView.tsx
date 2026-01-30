/**
 * StructuralNodeView - Renders structural nodes (titles, headings, sections)
 * 
 * Structural nodes:
 * - Render as standalone paragraph blocks
 * - Do NOT show paragraph numbers
 * - Do NOT affect citation numbering
 * - Alignment determined by node level, not heuristics
 */

import { StructuralNode } from "@/types/document";
import { cn } from "@/lib/utils";

interface StructuralNodeViewProps {
  node: StructuralNode;
}

export function StructuralNodeView({ node }: StructuralNodeViewProps) {
  const isCentered = node.alignment === "center";
  
  // Determine text size based on level
  const getSizeClass = () => {
    switch (node.level) {
      case "book":
        return "text-3xl mt-12 mb-8";
      case "part":
        return "text-2xl mt-10 mb-6";
      case "section":
        return "text-xl mt-8 mb-5";
      case "article":
        return "text-xl mt-8 mb-5";
      case "chapter":
        return "text-lg mt-6 mb-4";
      case "roman":
        return "text-base mt-6 mb-3 italic";
      case "subsection":
        return "text-base mt-4 mb-2";
      case "brief":
        return "text-sm mt-6 mb-3 uppercase tracking-wider";
      case "preface":
        return "text-base mt-6 mb-3 uppercase tracking-wide";
      case "heading":
      default:
        return "text-base mt-4 mb-2";
    }
  };

  return (
    <div
      className={cn(
        "font-display font-semibold text-foreground select-none",
        getSizeClass(),
        isCentered ? "text-center" : "text-left"
      )}
      role="heading"
      aria-level={getAriaLevel(node.level)}
    >
      {node.content}
    </div>
  );
}

function getAriaLevel(level: StructuralNode["level"]): number {
  switch (level) {
    case "book":
      return 1;
    case "part":
      return 2;
    case "section":
    case "article":
    case "chapter":
      return 3;
    case "roman":
    case "subsection":
      return 4;
    default:
      return 5;
  }
}
