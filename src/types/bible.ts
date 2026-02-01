/**
 * Bible types and data structures
 * 
 * Defines the canonical citation model, translation support,
 * and book/chapter/verse structures for the Bible reader.
 */

// ============= Canon Types =============

export type Testament = 'OT' | 'NT' | 'DC'; // Old Testament, New Testament, Deuterocanonical

export interface BibleBook {
  id: string;           // Canonical ID (e.g., "GEN", "MAT", "SIR")
  name: string;         // Full name (e.g., "Genesis", "Matthew", "Sirach")
  shortName: string;    // Abbreviated (e.g., "Gen", "Matt", "Sir")
  testament: Testament;
  chapters: number;     // Total chapters in this book
  chapterVerses: number[]; // Array of verse counts per chapter (1-indexed)
}

export interface BibleTranslation {
  id: string;           // e.g., "NABRE", "RSV2CE", "KJV", "DRB"
  name: string;         // e.g., "New American Bible Revised Edition"
  shortName: string;    // e.g., "NABRE"
  includesDeuterocanon: boolean;
  language: string;
  year?: number;
}

// ============= Citation Types =============

/**
 * Canonical Bible citation ID format:
 * bible:<translation>:<book>:<chapter>:<verse>
 * 
 * Example: bible:NABRE:GEN:1:1
 */
export interface BibleCitation {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}

export function formatBibleCitationId(citation: BibleCitation): string {
  return `bible:${citation.translation}:${citation.book}:${citation.chapter}:${citation.verse}`;
}

export function parseBibleCitationId(id: string): BibleCitation | null {
  const parts = id.split(':');
  if (parts.length !== 5 || parts[0] !== 'bible') {
    return null;
  }
  
  const [, translation, book, chapterStr, verseStr] = parts;
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);
  
  if (isNaN(chapter) || isNaN(verse)) {
    return null;
  }
  
  return { translation, book, chapter, verse };
}

export function formatBibleReference(
  book: BibleBook,
  chapter: number,
  verse?: number
): string {
  if (verse !== undefined) {
    return `${book.shortName} ${chapter}:${verse}`;
  }
  return `${book.shortName} ${chapter}`;
}

// ============= Verse Content Types =============

export interface BibleVerse {
  id: string;           // Canonical ID (bible:translation:book:chapter:verse)
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

// ============= Navigation Types =============

export interface BibleNavigationState {
  translation: string;
  book: string;
  chapter: number;
  verse?: number;       // Optional scroll-to target
}

// ============= Helper Functions =============

export function isBibleCitationId(id: string): boolean {
  return id.startsWith('bible:');
}
