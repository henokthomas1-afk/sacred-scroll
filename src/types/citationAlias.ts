/**
 * Citation Alias Types
 * 
 * Document-level citation aliases that enable academic-style references
 * like "CCC 17" or "ST I.2.3" to automatically become clickable citations.
 */

export interface CitationAlias {
  id: string;
  documentId: string;
  /** Short prefix used in citations (e.g., "CCC", "ST", "Augustine Conf.") */
  prefix: string;
  /** Regex pattern to match the full citation (e.g., "CCC\\s*§?\\s*(\\d+)" for "CCC 17") */
  pattern: string;
  /** How to extract the node number from the matched pattern */
  numberExtractor: 'paragraph' | 'section' | 'chapter:verse' | 'custom';
  /** Custom regex group index for number extraction (if numberExtractor is 'custom') */
  customGroupIndex?: number;
  /** Display format for the alias (e.g., "CCC §{number}", "{prefix} {number}") */
  displayFormat: string;
  /** Priority when multiple aliases could match (higher = checked first) */
  priority: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Resolved citation from an alias pattern
 */
export interface ResolvedCitation {
  /** The original matched text (e.g., "CCC 17") */
  originalText: string;
  /** The document ID this citation points to */
  documentId: string;
  /** The document title for display */
  documentTitle: string;
  /** The target node ID if found */
  nodeId?: string;
  /** The extracted reference (e.g., "17", "I.2.3") */
  reference: string;
  /** The display text for the citation */
  displayText: string;
  /** Whether the target node was found in the document */
  isResolved: boolean;
}

/**
 * Preset citation patterns for common document types
 */
export type CitationPreset = 
  | 'catechism'      // CCC 1-2865
  | 'summa'          // ST I.2.3 format
  | 'confessions'    // Augustine Conf. I.1
  | 'generic';       // Simple numbered

export interface CitationPresetConfig {
  id: CitationPreset;
  label: string;
  description: string;
  defaultPrefix: string;
  defaultPattern: string;
  numberExtractor: CitationAlias['numberExtractor'];
  displayFormat: string;
}

/**
 * Predefined presets for common document types
 */
export const CITATION_PRESETS: CitationPresetConfig[] = [
  {
    id: 'catechism',
    label: 'Catechism',
    description: 'CCC §17, CCC 17-20',
    defaultPrefix: 'CCC',
    defaultPattern: '(CCC)\\s*§?§?\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?',
    numberExtractor: 'paragraph',
    displayFormat: 'CCC §{number}',
  },
  {
    id: 'summa',
    label: 'Summa Theologiae',
    description: 'ST I.2.3, ST II-II.4.1',
    defaultPrefix: 'ST',
    defaultPattern: '(ST)\\s+([I|II|III]+(?:-[I|II|III]+)?)\\.(\\d+)\\.(\\d+)',
    numberExtractor: 'section',
    displayFormat: 'ST {number}',
  },
  {
    id: 'confessions',
    label: 'Confessions',
    description: 'Augustine Conf. I.1',
    defaultPrefix: 'Conf.',
    defaultPattern: '(Conf\\.|Confessions)\\s+([IVX]+)\\.(\\d+)',
    numberExtractor: 'chapter:verse',
    displayFormat: 'Conf. {number}',
  },
  {
    id: 'generic',
    label: 'Generic Numbered',
    description: 'Prefix followed by number',
    defaultPrefix: '',
    defaultPattern: '',
    numberExtractor: 'paragraph',
    displayFormat: '{prefix} {number}',
  },
];

/**
 * Get a preset configuration by ID
 */
export function getCitationPreset(id: CitationPreset): CitationPresetConfig | undefined {
  return CITATION_PRESETS.find(p => p.id === id);
}
