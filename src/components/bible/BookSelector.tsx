/**
 * BookSelector - Bible book navigation component
 * 
 * Displays books grouped by testament (OT/NT/Deuterocanonical).
 * Deuterocanonical books only shown when translation supports them.
 */

import { useState } from 'react';
import { BibleBook, Testament } from '@/types/bible';
import { getBooksForTranslation, BOOKS_BY_TESTAMENT } from '@/lib/bible/bibleData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BookSelectorProps {
  selectedBookId: string | null;
  onSelectBook: (book: BibleBook) => void;
  includesDeuterocanon: boolean;
  className?: string;
}

interface TestamentSectionProps {
  testament: Testament;
  title: string;
  books: BibleBook[];
  selectedBookId: string | null;
  onSelectBook: (book: BibleBook) => void;
  defaultOpen?: boolean;
}

function TestamentSection({
  testament,
  title,
  books,
  selectedBookId,
  onSelectBook,
  defaultOpen = true,
}: TestamentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {title}
          <span className="ml-auto text-xs opacity-60">{books.length}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-0.5 px-1 pb-2">
          {books.map((book) => (
            <Button
              key={book.id}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start h-7 px-2 text-xs font-normal",
                selectedBookId === book.id && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onSelectBook(book)}
            >
              {book.shortName}
            </Button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function BookSelector({
  selectedBookId,
  onSelectBook,
  includesDeuterocanon,
  className,
}: BookSelectorProps) {
  const books = getBooksForTranslation(includesDeuterocanon);
  
  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-2 space-y-1">
        <TestamentSection
          testament="OT"
          title="Old Testament"
          books={BOOKS_BY_TESTAMENT.OT}
          selectedBookId={selectedBookId}
          onSelectBook={onSelectBook}
          defaultOpen={true}
        />
        
        <TestamentSection
          testament="NT"
          title="New Testament"
          books={BOOKS_BY_TESTAMENT.NT}
          selectedBookId={selectedBookId}
          onSelectBook={onSelectBook}
          defaultOpen={true}
        />
        
        {includesDeuterocanon && (
          <TestamentSection
            testament="DC"
            title="Deuterocanonical"
            books={BOOKS_BY_TESTAMENT.DC}
            selectedBookId={selectedBookId}
            onSelectBook={onSelectBook}
            defaultOpen={false}
          />
        )}
      </div>
    </ScrollArea>
  );
}
