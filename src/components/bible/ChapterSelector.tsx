/**
 * ChapterSelector - Chapter navigation for Bible reader
 * 
 * Displays a grid of chapter numbers for quick navigation.
 */

import { BibleBook } from '@/types/bible';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChapterSelectorProps {
  book: BibleBook;
  selectedChapter: number;
  onSelectChapter: (chapter: number) => void;
  className?: string;
}

export function ChapterSelector({
  book,
  selectedChapter,
  onSelectChapter,
  className,
}: ChapterSelectorProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="shrink-0 px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold">{book.name}</h3>
        <p className="text-xs text-muted-foreground">{book.chapters} chapters</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-5 gap-1 p-2">
          {chapters.map((chapter) => (
            <Button
              key={chapter}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 text-sm font-mono",
                selectedChapter === chapter && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => onSelectChapter(chapter)}
            >
              {chapter}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
