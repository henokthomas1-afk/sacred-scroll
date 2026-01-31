/**
 * ReaderPane - Left pane with independently scrollable content
 * 
 * Scroll handling:
 * - Container uses flex-1 min-h-0 to allow shrinking
 * - Inner scroll area uses overflow-y-auto
 * - No nested ScrollArea components
 */

import { cn } from "@/lib/utils";

interface ReaderPaneProps {
  className?: string;
}

export function ReaderPane({ className }: ReaderPaneProps) {
  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-card",
        className
      )}
    >
      {/* Fixed Header */}
      <header className="shrink-0 border-b border-border px-6 py-4">
        <h2 className="font-semibold text-lg text-foreground">Reader</h2>
        <p className="text-sm text-muted-foreground">Scroll independently from notes</p>
      </header>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <article className="max-w-3xl mx-auto px-6 py-8">
          <PlaceholderContent />
        </article>
      </div>
    </div>
  );
}

/**
 * Long placeholder text to test scrolling
 */
function PlaceholderContent() {
  const paragraphs = Array.from({ length: 50 }, (_, i) => i + 1);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Sample Document for Scroll Testing
      </h1>
      
      {paragraphs.map((num) => (
        <div key={num} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              ¶{num}
            </span>
          </div>
          <p className="text-foreground leading-relaxed">
            This is paragraph {num} of the sample document. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et 
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
            ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure 
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat 
            nulla pariatur. Excepteur sint occaecat cupidatat non proident.
          </p>
        </div>
      ))}
      
      <div className="py-8 text-center text-muted-foreground border-t border-border mt-8">
        — End of Document —
      </div>
    </div>
  );
}
