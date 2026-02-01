/**
 * BibleReader - Main Bible reading component
 * 
 * Integrates book/chapter navigation with verse display.
 * Supports citation linking and translation switching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BibleBook, BibleVerse, BibleNavigationState, formatBibleReference } from '@/types/bible';
import { getBookById, getBooksForTranslation } from '@/lib/bible/bibleData';
import { getTranslationOrDefault, DEFAULT_TRANSLATION } from '@/lib/bible/translations';
import { getChapterVerses, hasRealContent } from '@/lib/bible/sampleVerses';
import { BookSelector } from './BookSelector';
import { ChapterSelector } from './ChapterSelector';
import { TranslationSelector } from './TranslationSelector';
import { ChapterView } from './VerseView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  List,
  X,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';

interface BibleReaderProps {
  initialNavigation?: BibleNavigationState;
  onCiteVerse?: (verseId: string, verseText: string) => void;
  onClose?: () => void;
  className?: string;
}

export function BibleReader({
  initialNavigation,
  onCiteVerse,
  onClose,
  className,
}: BibleReaderProps) {
  // Persisted state
  const [translationId, setTranslationId] = useLocalStorage(
    'sacredScroll.bibleTranslation',
    initialNavigation?.translation || DEFAULT_TRANSLATION
  );
  const [bookId, setBookId] = useLocalStorage(
    'sacredScroll.bibleBook',
    initialNavigation?.book || 'GEN'
  );
  const [chapter, setChapter] = useLocalStorage(
    'sacredScroll.bibleChapter',
    initialNavigation?.chapter || 1
  );

  // UI state
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(
    initialNavigation?.verse
  );
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const translation = getTranslationOrDefault(translationId);
  const book = getBookById(bookId);
  const books = getBooksForTranslation(translation.includesDeuterocanon);

  // Load verses when navigation changes
  useEffect(() => {
    if (book) {
      const chapterVerses = getChapterVerses(translationId, bookId, chapter);
      setVerses(chapterVerses);
    }
  }, [translationId, bookId, chapter, book]);

  // Scroll to highlighted verse
  useEffect(() => {
    if (highlightedVerse && scrollRef.current) {
      const verseElement = scrollRef.current.querySelector(`#verse-${highlightedVerse}`);
      if (verseElement) {
        setTimeout(() => {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightedVerse, verses]);

  // Handle external navigation
  useEffect(() => {
    if (initialNavigation) {
      if (initialNavigation.translation) setTranslationId(initialNavigation.translation);
      if (initialNavigation.book) setBookId(initialNavigation.book);
      if (initialNavigation.chapter) setChapter(initialNavigation.chapter);
      if (initialNavigation.verse) setHighlightedVerse(initialNavigation.verse);
    }
  }, [initialNavigation, setTranslationId, setBookId, setChapter]);

  const handleSelectBook = useCallback((selectedBook: BibleBook) => {
    setBookId(selectedBook.id);
    setChapter(1);
    setShowBookSelector(false);
    setHighlightedVerse(undefined);
  }, [setBookId, setChapter]);

  const handleSelectChapter = useCallback((selectedChapter: number) => {
    setChapter(selectedChapter);
    setShowChapterSelector(false);
    setHighlightedVerse(undefined);
  }, [setChapter]);

  const handleTranslationChange = useCallback((newTranslationId: string) => {
    const newTranslation = getTranslationOrDefault(newTranslationId);
    
    // Check if current book exists in new translation
    if (!newTranslation.includesDeuterocanon && book?.testament === 'DC') {
      // Switch to Genesis if current book is deuterocanonical
      setBookId('GEN');
      setChapter(1);
      toast({
        title: 'Book not available',
        description: `${book.name} is not in ${newTranslation.shortName}. Switched to Genesis.`,
      });
    }
    
    setTranslationId(newTranslationId);
  }, [book, setBookId, setChapter, setTranslationId]);

  const handlePrevChapter = useCallback(() => {
    if (chapter > 1) {
      setChapter(chapter - 1);
      setHighlightedVerse(undefined);
    } else if (book) {
      // Go to previous book's last chapter
      const currentIndex = books.findIndex(b => b.id === book.id);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setBookId(prevBook.id);
        setChapter(prevBook.chapters);
        setHighlightedVerse(undefined);
      }
    }
  }, [chapter, book, books, setChapter, setBookId]);

  const handleNextChapter = useCallback(() => {
    if (book && chapter < book.chapters) {
      setChapter(chapter + 1);
      setHighlightedVerse(undefined);
    } else if (book) {
      // Go to next book's first chapter
      const currentIndex = books.findIndex(b => b.id === book.id);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setBookId(nextBook.id);
        setChapter(1);
        setHighlightedVerse(undefined);
      }
    }
  }, [chapter, book, books, setChapter, setBookId]);

  const handleCiteVerse = useCallback((verse: BibleVerse) => {
    if (onCiteVerse && book) {
      const reference = `${book.shortName} ${verse.chapter}:${verse.verse}`;
      onCiteVerse(verse.id, reference);
      toast({ title: 'Verse cited', description: reference });
    }
  }, [onCiteVerse, book]);

  if (!book) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <p className="text-muted-foreground">Loading Bible...</p>
      </div>
    );
  }

  const hasRealVerses = hasRealContent(bookId, chapter);

  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* Header with navigation controls */}
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Book/Chapter selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowBookSelector(!showBookSelector)}
            >
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{book.shortName}</span>
              <span className="text-muted-foreground">{chapter}</span>
            </Button>
            
            <TranslationSelector
              selectedTranslation={translationId}
              onSelectTranslation={handleTranslationChange}
            />
          </div>

          {/* Right: Close button */}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Chapter navigation */}
        <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevChapter}
            disabled={chapter === 1 && books.findIndex(b => b.id === book.id) === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChapterSelector(!showChapterSelector)}
          >
            <List className="h-4 w-4 mr-1" />
            Chapters
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextChapter}
            disabled={chapter === book.chapters && books.findIndex(b => b.id === book.id) === books.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Book selector panel */}
        {showBookSelector && (
          <div className="w-64 border-r border-border shrink-0">
            <BookSelector
              selectedBookId={bookId}
              onSelectBook={handleSelectBook}
              includesDeuterocanon={translation.includesDeuterocanon}
            />
          </div>
        )}

        {/* Chapter selector panel */}
        {showChapterSelector && !showBookSelector && (
          <div className="w-48 border-r border-border shrink-0">
            <ChapterSelector
              book={book}
              selectedChapter={chapter}
              onSelectChapter={handleSelectChapter}
            />
          </div>
        )}

        {/* Reading area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <article className="max-w-3xl mx-auto px-6 py-8">
            {/* Chapter title */}
            <h1 className="font-display text-2xl font-bold text-center mb-8">
              {book.name} {chapter}
            </h1>

            {/* Sample content notice */}
            {!hasRealVerses && (
              <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  This is placeholder content. In a production app, full Bible text would be 
                  loaded from bundled data files. Sample content is available for Genesis 1, 
                  John 1, and Psalm 23.
                </p>
              </div>
            )}

            {/* Verses */}
            <ChapterView
              verses={verses}
              highlightedVerse={highlightedVerse}
              onCiteVerse={onCiteVerse ? handleCiteVerse : undefined}
            />
          </article>
        </ScrollArea>
      </div>
    </div>
  );
}
