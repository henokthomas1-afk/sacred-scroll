/**
 * Sample Bible verse content for demonstration
 * 
 * In a production app, this would be loaded from bundled files or IndexedDB.
 * For now, we include sample content for key passages.
 */

import { BibleVerse, formatBibleCitationId } from '@/types/bible';

// Sample verses for demonstration - Genesis 1
const GENESIS_1: Record<number, string> = {
  1: "In the beginning God created the heavens and the earth.",
  2: "The earth was formless and void, and darkness was over the surface of the deep, and the Spirit of God was moving over the surface of the waters.",
  3: "Then God said, \"Let there be light\"; and there was light.",
  4: "God saw that the light was good; and God separated the light from the darkness.",
  5: "God called the light day, and the darkness He called night. And there was evening and there was morning, one day.",
  6: "Then God said, \"Let there be an expanse in the midst of the waters, and let it separate the waters from the waters.\"",
  7: "God made the expanse, and separated the waters which were below the expanse from the waters which were above the expanse; and it was so.",
  8: "God called the expanse heaven. And there was evening and there was morning, a second day.",
  9: "Then God said, \"Let the waters below the heavens be gathered into one place, and let the dry land appear\"; and it was so.",
  10: "God called the dry land earth, and the gathering of the waters He called seas; and God saw that it was good.",
  11: "Then God said, \"Let the earth sprout vegetation, plants yielding seed, and fruit trees on the earth bearing fruit after their kind with seed in them\"; and it was so.",
  12: "The earth brought forth vegetation, plants yielding seed after their kind, and trees bearing fruit with seed in them, after their kind; and God saw that it was good.",
  13: "There was evening and there was morning, a third day.",
  14: "Then God said, \"Let there be lights in the expanse of the heavens to separate the day from the night, and let them be for signs and for seasons and for days and years;",
  15: "and let them be for lights in the expanse of the heavens to give light on the earth\"; and it was so.",
  16: "God made the two great lights, the greater light to govern the day, and the lesser light to govern the night; He made the stars also.",
  17: "God placed them in the expanse of the heavens to give light on the earth,",
  18: "and to govern the day and the night, and to separate the light from the darkness; and God saw that it was good.",
  19: "There was evening and there was morning, a fourth day.",
  20: "Then God said, \"Let the waters teem with swarms of living creatures, and let birds fly above the earth in the open expanse of the heavens.\"",
  21: "God created the great sea monsters and every living creature that moves, with which the waters swarmed after their kind, and every winged bird after its kind; and God saw that it was good.",
  22: "God blessed them, saying, \"Be fruitful and multiply, and fill the waters in the seas, and let birds multiply on the earth.\"",
  23: "There was evening and there was morning, a fifth day.",
  24: "Then God said, \"Let the earth bring forth living creatures after their kind: cattle and creeping things and beasts of the earth after their kind\"; and it was so.",
  25: "God made the beasts of the earth after their kind, and the cattle after their kind, and everything that creeps on the ground after its kind; and God saw that it was good.",
  26: "Then God said, \"Let Us make man in Our image, according to Our likeness; and let them rule over the fish of the sea and over the birds of the sky and over the cattle and over all the earth, and over every creeping thing that creeps on the earth.\"",
  27: "God created man in His own image, in the image of God He created him; male and female He created them.",
  28: "God blessed them; and God said to them, \"Be fruitful and multiply, and fill the earth, and subdue it; and rule over the fish of the sea and over the birds of the sky and over every living thing that moves on the earth.\"",
  29: "Then God said, \"Behold, I have given you every plant yielding seed that is on the surface of all the earth, and every tree which has fruit yielding seed; it shall be food for you;",
  30: "and to every beast of the earth and to every bird of the sky and to every thing that moves on the earth which has life, I have given every green plant for food\"; and it was so.",
  31: "God saw all that He had made, and behold, it was very good. And there was evening and there was morning, the sixth day.",
};

// Sample verses - John 1
const JOHN_1: Record<number, string> = {
  1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
  2: "He was in the beginning with God.",
  3: "All things came into being through Him, and apart from Him nothing came into being that has come into being.",
  4: "In Him was life, and the life was the Light of men.",
  5: "The Light shines in the darkness, and the darkness did not comprehend it.",
  6: "There came a man sent from God, whose name was John.",
  7: "He came as a witness, to testify about the Light, so that all might believe through him.",
  8: "He was not the Light, but he came to testify about the Light.",
  9: "There was the true Light which, coming into the world, enlightens every man.",
  10: "He was in the world, and the world was made through Him, and the world did not know Him.",
  11: "He came to His own, and those who were His own did not receive Him.",
  12: "But as many as received Him, to them He gave the right to become children of God, even to those who believe in His name,",
  13: "who were born, not of blood nor of the will of the flesh nor of the will of man, but of God.",
  14: "And the Word became flesh, and dwelt among us, and we saw His glory, glory as of the only begotten from the Father, full of grace and truth.",
  15: "John testified about Him and cried out, saying, \"This was He of whom I said, 'He who comes after me has a higher rank than I, for He existed before me.'\"",
  16: "For of His fullness we have all received, and grace upon grace.",
  17: "For the Law was given through Moses; grace and truth were realized through Jesus Christ.",
  18: "No one has seen God at any time; the only begotten God who is in the bosom of the Father, He has explained Him.",
};

// Sample verses - Psalm 23
const PSALM_23: Record<number, string> = {
  1: "The LORD is my shepherd, I shall not want.",
  2: "He makes me lie down in green pastures; He leads me beside quiet waters.",
  3: "He restores my soul; He guides me in the paths of righteousness for His name's sake.",
  4: "Even though I walk through the valley of the shadow of death, I fear no evil, for You are with me; Your rod and Your staff, they comfort me.",
  5: "You prepare a table before me in the presence of my enemies; You have anointed my head with oil; my cup overflows.",
  6: "Surely goodness and lovingkindness will follow me all the days of my life, and I will dwell in the house of the LORD forever.",
};

// Content storage by book and chapter
const SAMPLE_CONTENT: Record<string, Record<number, Record<number, string>>> = {
  GEN: { 1: GENESIS_1 },
  JHN: { 1: JOHN_1 },
  PSA: { 23: PSALM_23 },
};

/**
 * Get verses for a chapter
 * Returns empty array if content not available (would be loaded from files in production)
 */
export function getChapterVerses(
  translation: string,
  bookId: string,
  chapter: number
): BibleVerse[] {
  const bookContent = SAMPLE_CONTENT[bookId];
  if (!bookContent) {
    // Return placeholder verses for chapters without sample content
    return generatePlaceholderVerses(translation, bookId, chapter);
  }

  const chapterContent = bookContent[chapter];
  if (!chapterContent) {
    return generatePlaceholderVerses(translation, bookId, chapter);
  }

  return Object.entries(chapterContent).map(([verseNum, text]) => ({
    id: formatBibleCitationId({
      translation,
      book: bookId,
      chapter,
      verse: parseInt(verseNum, 10),
    }),
    book: bookId,
    chapter,
    verse: parseInt(verseNum, 10),
    text,
  }));
}

/**
 * Generate placeholder verses for chapters without sample content
 */
function generatePlaceholderVerses(
  translation: string,
  bookId: string,
  chapter: number
): BibleVerse[] {
  // Return 10 placeholder verses
  const verses: BibleVerse[] = [];
  for (let v = 1; v <= 10; v++) {
    verses.push({
      id: formatBibleCitationId({ translation, book: bookId, chapter, verse: v }),
      book: bookId,
      chapter,
      verse: v,
      text: `[Verse ${v} content would be loaded from bundled Bible data. This is placeholder text for ${bookId} ${chapter}:${v}.]`,
    });
  }
  return verses;
}

/**
 * Check if real content is available for a chapter
 */
export function hasRealContent(bookId: string, chapter: number): boolean {
  return !!(SAMPLE_CONTENT[bookId]?.[chapter]);
}
