/**
 * Citation Resolver
 * 
 * Centralized resolver for all citation types:
 * - Document aliases (CCC 17, ST I.2.3)
 * - Bible references (bible:translation:book:chapter:verse)
 * - Direct document/node references
 * 
 * This module provides:
 * - Pattern detection in text
 * - Alias-to-document resolution
 * - Node lookup by citation number
 */

import { CitationAlias, ResolvedCitation } from '@/types/citationAlias';
import { getAllCitationAliases } from './db/citationAliasDb';
import { getAllDocuments, getDocumentNodes } from './db';
import { isBibleCitationId } from '@/types/bible';

// Cache for aliases (refreshed on demand)
let aliasCache: CitationAlias[] | null = null;
let aliasCacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Get all aliases with caching
 */
async function getCachedAliases(): Promise<CitationAlias[]> {
  const now = Date.now();
  if (!aliasCache || now - aliasCacheTime > CACHE_TTL) {
    aliasCache = await getAllCitationAliases();
    aliasCacheTime = now;
  }
  return aliasCache;
}

/**
 * Invalidate the alias cache (call after creating/updating/deleting aliases)
 */
export function invalidateAliasCache(): void {
  aliasCache = null;
}

/**
 * Match result from pattern detection
 */
export interface CitationMatch {
  /** Full matched text */
  match: string;
  /** Start index in the source text */
  startIndex: number;
  /** End index in the source text */
  endIndex: number;
  /** The alias that matched */
  alias: CitationAlias;
  /** Extracted reference number/path */
  reference: string;
  /** For ranges: start reference */
  rangeStart?: string;
  /** For ranges: end reference */
  rangeEnd?: string;
}

/**
 * Find all citation alias matches in a text
 */
export async function findCitationMatches(text: string): Promise<CitationMatch[]> {
  const aliases = await getCachedAliases();
  const matches: CitationMatch[] = [];

  // Sort by priority (higher first)
  const sortedAliases = [...aliases].sort((a, b) => b.priority - a.priority);

  for (const alias of sortedAliases) {
    try {
      const regex = new RegExp(alias.pattern, 'gi');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        // Check if this position is already matched by a higher-priority alias
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        const isOverlapping = matches.some(m =>
          (startIndex >= m.startIndex && startIndex < m.endIndex) ||
          (endIndex > m.startIndex && endIndex <= m.endIndex)
        );

        if (!isOverlapping) {
          // Extract reference based on numberExtractor type
          const reference = extractReference(match, alias);
          const rangeEnd = extractRangeEnd(match, alias);

          matches.push({
            match: match[0],
            startIndex,
            endIndex,
            alias,
            reference,
            rangeStart: rangeEnd ? reference : undefined,
            rangeEnd,
          });
        }
      }
    } catch (err) {
      console.warn(`Invalid regex pattern for alias ${alias.prefix}:`, err);
    }
  }

  // Sort by position in text
  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Extract the reference from a regex match based on the alias type
 */
function extractReference(match: RegExpExecArray, alias: CitationAlias): string {
  switch (alias.numberExtractor) {
    case 'paragraph':
      // Group 2 is typically the paragraph number
      return match[2] || match[1];
    
    case 'section':
      // Combine groups for section references (e.g., "I.2.3")
      const parts = [];
      for (let i = 2; i < match.length; i++) {
        if (match[i]) parts.push(match[i]);
      }
      return parts.join('.');
    
    case 'chapter:verse':
      // Groups for chapter and verse
      return `${match[2] || ''}.${match[3] || ''}`;
    
    case 'custom':
      const groupIndex = alias.customGroupIndex || 1;
      return match[groupIndex] || '';
    
    default:
      return match[1] || match[0];
  }
}

/**
 * Extract range end if present (for patterns like "CCC 17-20")
 */
function extractRangeEnd(match: RegExpExecArray, alias: CitationAlias): string | undefined {
  // For paragraph type, group 3 might be range end
  if (alias.numberExtractor === 'paragraph' && match[3]) {
    return match[3];
  }
  return undefined;
}

/**
 * Resolve a citation match to a document and node
 */
export async function resolveCitationMatch(
  match: CitationMatch
): Promise<ResolvedCitation> {
  const documents = await getAllDocuments();
  const document = documents.find(d => d.id === match.alias.documentId);

  if (!document) {
    return {
      originalText: match.match,
      documentId: match.alias.documentId,
      documentTitle: 'Unknown Document',
      reference: match.reference,
      displayText: match.match,
      isResolved: false,
    };
  }

  // Look up the node by citation number
  const nodes = await getDocumentNodes(match.alias.documentId);
  let nodeId: string | undefined;

  // For paragraph-based references, try to find the matching node
  if (match.alias.numberExtractor === 'paragraph') {
    const targetNumber = parseInt(match.reference, 10);
    const citableNodes = nodes.filter(n => n.nodeType === 'citable');
    const targetNode = citableNodes.find(n => n.number === targetNumber);
    nodeId = targetNode?.id;
  }

  // Format display text
  const displayText = match.alias.displayFormat
    .replace('{prefix}', match.alias.prefix)
    .replace('{number}', match.reference);

  return {
    originalText: match.match,
    documentId: match.alias.documentId,
    documentTitle: document.title,
    nodeId,
    reference: match.reference,
    displayText,
    isResolved: !!nodeId,
  };
}

/**
 * Check if a string is a valid citation pattern
 */
export async function isCitationPattern(text: string): Promise<boolean> {
  // Check for Bible citation
  if (isBibleCitationId(text)) return true;
  
  // Check for alias patterns
  const matches = await findCitationMatches(text);
  return matches.length > 0 && matches[0].match === text.trim();
}

/**
 * Create a citation ID from a resolved citation
 * Format: doc:documentId:nodeId or doc:documentId
 */
export function createDocumentCitationId(documentId: string, nodeId?: string): string {
  return nodeId ? `doc:${documentId}:${nodeId}` : `doc:${documentId}`;
}

/**
 * Parse a document citation ID
 */
export function parseDocumentCitationId(citationId: string): { documentId: string; nodeId?: string } | null {
  if (!citationId.startsWith('doc:')) return null;
  
  const parts = citationId.slice(4).split(':');
  if (parts.length === 1) {
    return { documentId: parts[0] };
  }
  if (parts.length === 2) {
    return { documentId: parts[0], nodeId: parts[1] };
  }
  return null;
}

/**
 * Check if a string is a document citation ID
 */
export function isDocumentCitationId(id: string): boolean {
  return id.startsWith('doc:');
}
