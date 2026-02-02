/**
 * CitationAutoLinker - Detects and converts citation patterns in rich text
 * 
 * This module handles:
 * - Auto-detection of citation patterns (CCC 17, ST I.2.3, etc.)
 * - Converting matched patterns to clickable citation links
 * - Preserving existing links when re-processing
 */

import { findCitationMatches, resolveCitationMatch, CitationMatch } from '@/lib/citationResolver';
import { isBibleCitationId, parseBibleCitationId } from '@/types/bible';

/**
 * Citation link format in HTML:
 * <a data-citation="doc:documentId:nodeId" class="citation-link">CCC 17</a>
 * <a data-citation="bible:translation:book:chapter:verse" class="citation-link">John 3:16</a>
 */

const CITATION_LINK_CLASS = 'citation-link';
const CITATION_DATA_ATTR = 'data-citation';

/**
 * Process HTML content and convert citation patterns to links
 */
export async function autoLinkCitations(html: string): Promise<{
  html: string;
  linkedCount: number;
}> {
  // Create a temporary div to work with HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  let linkedCount = 0;

  // Process text nodes recursively
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    // Skip if inside an anchor or already processed
    if (node.parentElement?.closest('a')) continue;
    textNodes.push(node);
  }

  // Process each text node
  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    if (!text.trim()) continue;

    // Find citation matches
    const matches = await findCitationMatches(text);
    if (matches.length === 0) continue;

    // Build new content with links
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of matches) {
      // Add text before the match
      if (match.startIndex > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.startIndex))
        );
      }

      // Resolve the citation
      const resolved = await resolveCitationMatch(match);
      
      // Create the link
      const link = document.createElement('a');
      link.className = CITATION_LINK_CLASS;
      link.setAttribute(CITATION_DATA_ATTR, `doc:${resolved.documentId}${resolved.nodeId ? `:${resolved.nodeId}` : ''}`);
      link.textContent = match.match;
      link.style.cssText = 'color: hsl(var(--primary)); text-decoration: underline; cursor: pointer;';
      
      if (!resolved.isResolved) {
        link.style.opacity = '0.6';
        link.title = 'Referenced paragraph not found';
      }
      
      fragment.appendChild(link);
      linkedCount++;
      
      lastIndex = match.endIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    // Replace the text node
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return {
    html: tempDiv.innerHTML,
    linkedCount,
  };
}

/**
 * Extract citation data from a link element
 */
export function extractCitationFromLink(element: HTMLElement): {
  type: 'document' | 'bible';
  documentId?: string;
  nodeId?: string;
  translation?: string;
  book?: string;
  chapter?: number;
  verse?: number;
} | null {
  const citationId = element.getAttribute(CITATION_DATA_ATTR);
  if (!citationId) return null;

  // Check for Bible citation
  if (isBibleCitationId(citationId)) {
    const parsed = parseBibleCitationId(citationId);
    if (parsed) {
      return {
        type: 'bible',
        translation: parsed.translation,
        book: parsed.book,
        chapter: parsed.chapter,
        verse: parsed.verse,
      };
    }
  }

  // Document citation
  if (citationId.startsWith('doc:')) {
    const parts = citationId.slice(4).split(':');
    return {
      type: 'document',
      documentId: parts[0],
      nodeId: parts[1],
    };
  }

  return null;
}

/**
 * Check if an element is a citation link
 */
export function isCitationLink(element: HTMLElement): boolean {
  return element.tagName === 'A' && element.classList.contains(CITATION_LINK_CLASS);
}

/**
 * Remove citation link but keep the text
 */
export function unlinkCitation(element: HTMLElement): void {
  if (!isCitationLink(element)) return;
  
  const text = element.textContent || '';
  const textNode = document.createTextNode(text);
  element.parentNode?.replaceChild(textNode, element);
}

/**
 * Create a citation link from selected text
 */
export function createCitationLink(
  text: string,
  documentId: string,
  nodeId?: string
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = CITATION_LINK_CLASS;
  link.setAttribute(CITATION_DATA_ATTR, `doc:${documentId}${nodeId ? `:${nodeId}` : ''}`);
  link.textContent = text;
  link.style.cssText = 'color: hsl(var(--primary)); text-decoration: underline; cursor: pointer;';
  return link;
}
