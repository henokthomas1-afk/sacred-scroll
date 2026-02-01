/**
 * Bible book data and structure
 * 
 * Defines the canonical book list with chapter/verse counts.
 * Deuterocanonical books are included but filtered based on translation.
 */

import { BibleBook, Testament } from '@/types/bible';

// Old Testament books (Protestant/Catholic canon)
const OLD_TESTAMENT: BibleBook[] = [
  { id: 'GEN', name: 'Genesis', shortName: 'Gen', testament: 'OT', chapters: 50, chapterVerses: [0, 31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26] },
  { id: 'EXO', name: 'Exodus', shortName: 'Exod', testament: 'OT', chapters: 40, chapterVerses: [0, 22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38] },
  { id: 'LEV', name: 'Leviticus', shortName: 'Lev', testament: 'OT', chapters: 27, chapterVerses: [0, 17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34] },
  { id: 'NUM', name: 'Numbers', shortName: 'Num', testament: 'OT', chapters: 36, chapterVerses: [0, 54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13] },
  { id: 'DEU', name: 'Deuteronomy', shortName: 'Deut', testament: 'OT', chapters: 34, chapterVerses: [0, 46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12] },
  { id: 'JOS', name: 'Joshua', shortName: 'Josh', testament: 'OT', chapters: 24, chapterVerses: [0, 18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33] },
  { id: 'JDG', name: 'Judges', shortName: 'Judg', testament: 'OT', chapters: 21, chapterVerses: [0, 36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25] },
  { id: 'RUT', name: 'Ruth', shortName: 'Ruth', testament: 'OT', chapters: 4, chapterVerses: [0, 22, 23, 18, 22] },
  { id: '1SA', name: '1 Samuel', shortName: '1 Sam', testament: 'OT', chapters: 31, chapterVerses: [0, 28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13] },
  { id: '2SA', name: '2 Samuel', shortName: '2 Sam', testament: 'OT', chapters: 24, chapterVerses: [0, 27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25] },
  { id: '1KI', name: '1 Kings', shortName: '1 Kgs', testament: 'OT', chapters: 22, chapterVerses: [0, 53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53] },
  { id: '2KI', name: '2 Kings', shortName: '2 Kgs', testament: 'OT', chapters: 25, chapterVerses: [0, 18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30] },
  { id: '1CH', name: '1 Chronicles', shortName: '1 Chr', testament: 'OT', chapters: 29, chapterVerses: [0, 54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30] },
  { id: '2CH', name: '2 Chronicles', shortName: '2 Chr', testament: 'OT', chapters: 36, chapterVerses: [0, 17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23] },
  { id: 'EZR', name: 'Ezra', shortName: 'Ezra', testament: 'OT', chapters: 10, chapterVerses: [0, 11, 70, 13, 24, 17, 22, 28, 36, 15, 44] },
  { id: 'NEH', name: 'Nehemiah', shortName: 'Neh', testament: 'OT', chapters: 13, chapterVerses: [0, 11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31] },
  { id: 'EST', name: 'Esther', shortName: 'Esth', testament: 'OT', chapters: 10, chapterVerses: [0, 22, 23, 15, 17, 14, 14, 10, 17, 32, 3] },
  { id: 'JOB', name: 'Job', shortName: 'Job', testament: 'OT', chapters: 42, chapterVerses: [0, 22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17] },
  { id: 'PSA', name: 'Psalms', shortName: 'Ps', testament: 'OT', chapters: 150, chapterVerses: [0, 6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6] },
  { id: 'PRO', name: 'Proverbs', shortName: 'Prov', testament: 'OT', chapters: 31, chapterVerses: [0, 33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31] },
  { id: 'ECC', name: 'Ecclesiastes', shortName: 'Eccl', testament: 'OT', chapters: 12, chapterVerses: [0, 18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14] },
  { id: 'SNG', name: 'Song of Solomon', shortName: 'Song', testament: 'OT', chapters: 8, chapterVerses: [0, 17, 17, 11, 16, 16, 13, 13, 14] },
  { id: 'ISA', name: 'Isaiah', shortName: 'Isa', testament: 'OT', chapters: 66, chapterVerses: [0, 31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24] },
  { id: 'JER', name: 'Jeremiah', shortName: 'Jer', testament: 'OT', chapters: 52, chapterVerses: [0, 19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34] },
  { id: 'LAM', name: 'Lamentations', shortName: 'Lam', testament: 'OT', chapters: 5, chapterVerses: [0, 22, 22, 66, 22, 22] },
  { id: 'EZK', name: 'Ezekiel', shortName: 'Ezek', testament: 'OT', chapters: 48, chapterVerses: [0, 28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35] },
  { id: 'DAN', name: 'Daniel', shortName: 'Dan', testament: 'OT', chapters: 12, chapterVerses: [0, 21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13] },
  { id: 'HOS', name: 'Hosea', shortName: 'Hos', testament: 'OT', chapters: 14, chapterVerses: [0, 11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9] },
  { id: 'JOL', name: 'Joel', shortName: 'Joel', testament: 'OT', chapters: 3, chapterVerses: [0, 20, 32, 21] },
  { id: 'AMO', name: 'Amos', shortName: 'Amos', testament: 'OT', chapters: 9, chapterVerses: [0, 15, 16, 15, 13, 27, 14, 17, 14, 15] },
  { id: 'OBA', name: 'Obadiah', shortName: 'Obad', testament: 'OT', chapters: 1, chapterVerses: [0, 21] },
  { id: 'JON', name: 'Jonah', shortName: 'Jonah', testament: 'OT', chapters: 4, chapterVerses: [0, 17, 10, 10, 11] },
  { id: 'MIC', name: 'Micah', shortName: 'Mic', testament: 'OT', chapters: 7, chapterVerses: [0, 16, 13, 12, 13, 15, 16, 20] },
  { id: 'NAM', name: 'Nahum', shortName: 'Nah', testament: 'OT', chapters: 3, chapterVerses: [0, 15, 13, 19] },
  { id: 'HAB', name: 'Habakkuk', shortName: 'Hab', testament: 'OT', chapters: 3, chapterVerses: [0, 17, 20, 19] },
  { id: 'ZEP', name: 'Zephaniah', shortName: 'Zeph', testament: 'OT', chapters: 3, chapterVerses: [0, 18, 15, 20] },
  { id: 'HAG', name: 'Haggai', shortName: 'Hag', testament: 'OT', chapters: 2, chapterVerses: [0, 15, 23] },
  { id: 'ZEC', name: 'Zechariah', shortName: 'Zech', testament: 'OT', chapters: 14, chapterVerses: [0, 21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21] },
  { id: 'MAL', name: 'Malachi', shortName: 'Mal', testament: 'OT', chapters: 4, chapterVerses: [0, 14, 17, 18, 6] },
];

// New Testament books
const NEW_TESTAMENT: BibleBook[] = [
  { id: 'MAT', name: 'Matthew', shortName: 'Matt', testament: 'NT', chapters: 28, chapterVerses: [0, 25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20] },
  { id: 'MRK', name: 'Mark', shortName: 'Mark', testament: 'NT', chapters: 16, chapterVerses: [0, 45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20] },
  { id: 'LUK', name: 'Luke', shortName: 'Luke', testament: 'NT', chapters: 24, chapterVerses: [0, 80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53] },
  { id: 'JHN', name: 'John', shortName: 'John', testament: 'NT', chapters: 21, chapterVerses: [0, 51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25] },
  { id: 'ACT', name: 'Acts', shortName: 'Acts', testament: 'NT', chapters: 28, chapterVerses: [0, 26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31] },
  { id: 'ROM', name: 'Romans', shortName: 'Rom', testament: 'NT', chapters: 16, chapterVerses: [0, 32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27] },
  { id: '1CO', name: '1 Corinthians', shortName: '1 Cor', testament: 'NT', chapters: 16, chapterVerses: [0, 31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24] },
  { id: '2CO', name: '2 Corinthians', shortName: '2 Cor', testament: 'NT', chapters: 13, chapterVerses: [0, 24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14] },
  { id: 'GAL', name: 'Galatians', shortName: 'Gal', testament: 'NT', chapters: 6, chapterVerses: [0, 24, 21, 29, 31, 26, 18] },
  { id: 'EPH', name: 'Ephesians', shortName: 'Eph', testament: 'NT', chapters: 6, chapterVerses: [0, 23, 22, 21, 32, 33, 24] },
  { id: 'PHP', name: 'Philippians', shortName: 'Phil', testament: 'NT', chapters: 4, chapterVerses: [0, 30, 30, 21, 23] },
  { id: 'COL', name: 'Colossians', shortName: 'Col', testament: 'NT', chapters: 4, chapterVerses: [0, 29, 23, 25, 18] },
  { id: '1TH', name: '1 Thessalonians', shortName: '1 Thess', testament: 'NT', chapters: 5, chapterVerses: [0, 10, 20, 13, 18, 28] },
  { id: '2TH', name: '2 Thessalonians', shortName: '2 Thess', testament: 'NT', chapters: 3, chapterVerses: [0, 12, 17, 18] },
  { id: '1TI', name: '1 Timothy', shortName: '1 Tim', testament: 'NT', chapters: 6, chapterVerses: [0, 20, 15, 16, 16, 25, 21] },
  { id: '2TI', name: '2 Timothy', shortName: '2 Tim', testament: 'NT', chapters: 4, chapterVerses: [0, 18, 26, 17, 22] },
  { id: 'TIT', name: 'Titus', shortName: 'Titus', testament: 'NT', chapters: 3, chapterVerses: [0, 16, 15, 15] },
  { id: 'PHM', name: 'Philemon', shortName: 'Phlm', testament: 'NT', chapters: 1, chapterVerses: [0, 25] },
  { id: 'HEB', name: 'Hebrews', shortName: 'Heb', testament: 'NT', chapters: 13, chapterVerses: [0, 14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25] },
  { id: 'JAS', name: 'James', shortName: 'Jas', testament: 'NT', chapters: 5, chapterVerses: [0, 27, 26, 18, 17, 20] },
  { id: '1PE', name: '1 Peter', shortName: '1 Pet', testament: 'NT', chapters: 5, chapterVerses: [0, 25, 25, 22, 19, 14] },
  { id: '2PE', name: '2 Peter', shortName: '2 Pet', testament: 'NT', chapters: 3, chapterVerses: [0, 21, 22, 18] },
  { id: '1JN', name: '1 John', shortName: '1 John', testament: 'NT', chapters: 5, chapterVerses: [0, 10, 29, 24, 21, 21] },
  { id: '2JN', name: '2 John', shortName: '2 John', testament: 'NT', chapters: 1, chapterVerses: [0, 13] },
  { id: '3JN', name: '3 John', shortName: '3 John', testament: 'NT', chapters: 1, chapterVerses: [0, 15] },
  { id: 'JUD', name: 'Jude', shortName: 'Jude', testament: 'NT', chapters: 1, chapterVerses: [0, 25] },
  { id: 'REV', name: 'Revelation', shortName: 'Rev', testament: 'NT', chapters: 22, chapterVerses: [0, 20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21] },
];

// Deuterocanonical books (Catholic/Orthodox canon)
const DEUTEROCANONICAL: BibleBook[] = [
  { id: 'TOB', name: 'Tobit', shortName: 'Tob', testament: 'DC', chapters: 14, chapterVerses: [0, 22, 14, 17, 21, 22, 17, 18, 21, 6, 14, 18, 22, 18, 15] },
  { id: 'JDT', name: 'Judith', shortName: 'Jdt', testament: 'DC', chapters: 16, chapterVerses: [0, 16, 28, 10, 15, 24, 21, 32, 36, 14, 23, 23, 20, 20, 19, 14, 25] },
  { id: 'ESG', name: 'Esther (Greek)', shortName: 'Esth (Gr)', testament: 'DC', chapters: 10, chapterVerses: [0, 22, 23, 15, 17, 14, 14, 10, 17, 32, 13] },
  { id: 'WIS', name: 'Wisdom', shortName: 'Wis', testament: 'DC', chapters: 19, chapterVerses: [0, 16, 24, 19, 20, 23, 25, 30, 21, 18, 21, 26, 27, 19, 31, 19, 29, 21, 25, 22] },
  { id: 'SIR', name: 'Sirach', shortName: 'Sir', testament: 'DC', chapters: 51, chapterVerses: [0, 30, 18, 31, 31, 15, 37, 36, 19, 18, 31, 34, 18, 26, 27, 20, 30, 32, 33, 30, 31, 28, 27, 27, 34, 26, 29, 30, 26, 28, 25, 31, 24, 33, 31, 26, 31, 31, 34, 35, 30, 27, 25, 35, 23, 26, 20, 25, 25, 16, 29, 30] },
  { id: 'BAR', name: 'Baruch', shortName: 'Bar', testament: 'DC', chapters: 6, chapterVerses: [0, 22, 35, 38, 37, 9, 73] },
  { id: 'LJE', name: 'Letter of Jeremiah', shortName: 'Ep Jer', testament: 'DC', chapters: 1, chapterVerses: [0, 73] },
  { id: '1MA', name: '1 Maccabees', shortName: '1 Macc', testament: 'DC', chapters: 16, chapterVerses: [0, 64, 70, 60, 61, 68, 63, 50, 32, 73, 89, 74, 53, 53, 49, 41, 24] },
  { id: '2MA', name: '2 Maccabees', shortName: '2 Macc', testament: 'DC', chapters: 15, chapterVerses: [0, 36, 32, 40, 50, 27, 31, 42, 36, 29, 38, 38, 45, 26, 46, 39] },
];

// Export all books
export const ALL_BOOKS: BibleBook[] = [...OLD_TESTAMENT, ...NEW_TESTAMENT, ...DEUTEROCANONICAL];

// Export by testament
export const BOOKS_BY_TESTAMENT = {
  OT: OLD_TESTAMENT,
  NT: NEW_TESTAMENT,
  DC: DEUTEROCANONICAL,
};

// Get books for a translation
export function getBooksForTranslation(includesDeuterocanon: boolean): BibleBook[] {
  if (includesDeuterocanon) {
    return ALL_BOOKS;
  }
  return [...OLD_TESTAMENT, ...NEW_TESTAMENT];
}

// Get a book by ID
export function getBookById(bookId: string): BibleBook | undefined {
  return ALL_BOOKS.find(b => b.id === bookId);
}

// Get verse count for a chapter
export function getVerseCount(bookId: string, chapter: number): number {
  const book = getBookById(bookId);
  if (!book || chapter < 1 || chapter > book.chapters) {
    return 0;
  }
  return book.chapterVerses[chapter] || 0;
}
