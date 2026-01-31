/**
 * SplitReaderLayout - Stable split-screen layout with independent scrolling
 * 
 * Layout invariants:
 * - Parent: flex, h-screen, overflow-hidden
 * - Each pane: flex-1, min-h-0, overflow-y-auto
 * - No global page scrolling
 * 
 * Notes pane uses the full Obsidian-style GlobalNotesPanel with:
 * - Nested folders (infinite depth)
 * - Drag & drop reordering
 * - Local-first persistence (IndexedDB)
 */

import { cn } from "@/lib/utils";
import { ReaderPane } from "./ReaderPane";
import { GlobalNotesPanel } from "@/components/notes/obsidian";

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
      
      {/* Right Pane: Obsidian-style Notes */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <GlobalNotesPanel className="flex-1 min-h-0" />
      </div>
    </div>
  );
}
