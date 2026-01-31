/**
 * SplitReaderLayout - Stable split-screen layout with independent scrolling
 * 
 * Layout invariants:
 * - Parent: flex, h-screen, overflow-hidden
 * - Each pane: flex-1, min-h-0, overflow-y-auto
 * - No global page scrolling
 */

import { cn } from "@/lib/utils";
import { ReaderPane } from "./ReaderPane";
import { SimpleNotesPane } from "./SimpleNotesPane";

interface SplitReaderLayoutProps {
  className?: string;
}

export function SplitReaderLayout({ className }: SplitReaderLayoutProps) {
  return (
    <div 
      className={cn(
        "flex h-screen w-full overflow-hidden bg-background",
        className
      )}
    >
      {/* Left Pane: Reader */}
      <ReaderPane className="flex-1 min-w-0" />
      
      {/* Divider */}
      <div className="w-px bg-border" />
      
      {/* Right Pane: Notes */}
      <SimpleNotesPane className="flex-1 min-w-0" />
    </div>
  );
}
