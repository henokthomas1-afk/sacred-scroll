/**
 * Bible translations registry
 * 
 * Defines available translations with their properties.
 * Each translation specifies whether it includes the Deuterocanonical books.
 */

import { BibleTranslation } from '@/types/bible';

export const TRANSLATIONS: BibleTranslation[] = [
  {
    id: 'NABRE',
    name: 'New American Bible Revised Edition',
    shortName: 'NABRE',
    includesDeuterocanon: true,
    language: 'en',
    year: 2011,
  },
  {
    id: 'RSV2CE',
    name: 'Revised Standard Version, Second Catholic Edition',
    shortName: 'RSV-2CE',
    includesDeuterocanon: true,
    language: 'en',
    year: 2006,
  },
  {
    id: 'DRB',
    name: 'Douay-Rheims Bible',
    shortName: 'D-R',
    includesDeuterocanon: true,
    language: 'en',
    year: 1899,
  },
  {
    id: 'KJV',
    name: 'King James Version',
    shortName: 'KJV',
    includesDeuterocanon: false,
    language: 'en',
    year: 1611,
  },
  {
    id: 'ESV',
    name: 'English Standard Version',
    shortName: 'ESV',
    includesDeuterocanon: false,
    language: 'en',
    year: 2001,
  },
  {
    id: 'NRSV',
    name: 'New Revised Standard Version',
    shortName: 'NRSV',
    includesDeuterocanon: true,
    language: 'en',
    year: 1989,
  },
];

export const DEFAULT_TRANSLATION = 'NABRE';

export function getTranslation(id: string): BibleTranslation | undefined {
  return TRANSLATIONS.find(t => t.id === id);
}

export function getTranslationOrDefault(id: string | undefined): BibleTranslation {
  if (!id) {
    return TRANSLATIONS.find(t => t.id === DEFAULT_TRANSLATION)!;
  }
  return getTranslation(id) || TRANSLATIONS.find(t => t.id === DEFAULT_TRANSLATION)!;
}
