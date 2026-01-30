/**
 * Citation formatting utilities
 */

import { ParsedDocument } from '@/types/document';

/**
 * Format a citation range for display (e.g., "CCC 1-5", "Genesis 1:1-3")
 */
export function formatCitationRange(
  document: ParsedDocument,
  startNumber: number,
  endNumber: number
): string {
  const { sourceType, title } = document.metadata;
  
  // Get prefix based on source type
  let prefix = title;
  
  switch (sourceType) {
    case 'catechism':
      prefix = 'CCC';
      break;
    case 'scripture':
      // Keep the document title for scripture
      break;
    case 'patristic':
    case 'treatise':
      // Use abbreviated title if too long
      if (title.length > 20) {
        prefix = title.substring(0, 20) + '...';
      }
      break;
    default:
      break;
  }
  
  if (startNumber === endNumber) {
    return `${prefix} ${startNumber}`;
  }
  
  return `${prefix} ${startNumber}-${endNumber}`;
}

