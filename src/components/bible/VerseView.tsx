/**
 * VerseView - Individual verse display with citation support
 * 
 * Each verse is citable and can be selected for notes.
 */

import { useState, useCallback } from 'react';
import { BibleVerse } from '@/types/bible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link2, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerseViewProps {
  verse: BibleVerse;
  isHighlighted?: boolean;
  onCite?: (verse: BibleVerse) => void;
  className?: string;
}

export function VerseView({
  verse,
  isHighlighted = false,
  onCite,
  className,
}: VerseViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCite = useCallback(() => {
    onCite?.(verse);
  }, [onCite, verse]);

  return (
    <span
      id={`verse-${verse.verse}`}
      data-verse-id={verse.id}
      className={cn(
        "relative inline group",
        isHighlighted && "bg-primary/20 rounded px-0.5",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Verse number */}
      <sup className="text-xs font-semibold text-primary mr-1 select-none">
        {verse.verse}
      </sup>
      
      {/* Verse text */}
      <span className="text-foreground">{verse.text}</span>
      
      {/* Cite button - shows on hover */}
      {onCite && isHovered && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1 inline-flex align-middle opacity-60 hover:opacity-100"
              onClick={handleCite}
            >
              <Link2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Cite this verse</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {" "}
    </span>
  );
}

interface ChapterViewProps {
  verses: BibleVerse[];
  highlightedVerse?: number;
  onCiteVerse?: (verse: BibleVerse) => void;
  className?: string;
}

export function ChapterView({
  verses,
  highlightedVerse,
  onCiteVerse,
  className,
}: ChapterViewProps) {
  return (
    <div className={cn("leading-relaxed text-lg font-body", className)}>
      {verses.map((verse) => (
        <VerseView
          key={verse.id}
          verse={verse}
          isHighlighted={verse.verse === highlightedVerse}
          onCite={onCiteVerse}
        />
      ))}
    </div>
  );
}
