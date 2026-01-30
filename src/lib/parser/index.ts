/**
 * Sacred Text Parser
 * 
 * Deterministic, idempotent parsing following strict rules:
 * 1. Structural detection happens FIRST
 * 2. Paragraphs are detected AFTER headers are removed
 * 3. Paragraph numbers are the sole authority for citation boundaries
 */

import { 
  DocumentNode, 
  StructuralNode, 
  CitableNode,
  StructuralLevel,
  SourceType,
  ParsedDocument,
  DocumentMetadata,
  getStructuralAlignment
} from "@/types/document";

// Structural patterns - order matters (more specific first)
const STRUCTURAL_PATTERNS: Array<{
  pattern: RegExp;
  level: StructuralLevel;
}> = [
  // "IN BRIEF" sections
  { pattern: /^IN BRIEF$/i, level: "brief" },
  
  // Book/Part titles (all caps, substantial length)
  { pattern: /^(PART\s+(?:ONE|TWO|THREE|FOUR|[IVX]+))(?:\s*[-:.]?\s*(.+))?$/i, level: "part" },
  { pattern: /^(BOOK\s+(?:ONE|TWO|THREE|FOUR|[IVX]+))(?:\s*[-:.]?\s*(.+))?$/i, level: "book" },
  
  // Article/Section titles
  { pattern: /^ARTICLE\s+\d+/i, level: "article" },
  { pattern: /^SECTION\s+(?:ONE|TWO|THREE|FOUR|\d+)/i, level: "section" },
  
  // Chapter titles (including patristic format)
  { pattern: /^Chapter\s+[IVX]+\.?[-—]?/i, level: "chapter" },
  { pattern: /^CHAPTER\s+(?:\d+|[IVX]+)/i, level: "chapter" },
  
  // Roman numeral sections (I., II., III. etc. - standalone)
  { pattern: /^([IVX]+)\.\s*(.+)$/, level: "roman" },
  
  // Preface, Greeting, Introduction
  { pattern: /^(PREFACE|GREETING|INTRODUCTION|PROLOGUE|EPILOGUE)$/i, level: "preface" },
  
  // All-caps titles (must be at least 3 chars, all uppercase letters/spaces)
  { pattern: /^[A-Z][A-Z\s]{2,}[A-Z]$/, level: "section" },
];

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect if a line is structural and extract its details
 */
function detectStructural(line: string): { level: StructuralLevel; content: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  for (const { pattern, level } of STRUCTURAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { level, content: trimmed };
    }
  }
  
  return null;
}

/**
 * Extract paragraph number from text
 * Returns [number, remainingText] or null
 */
function extractParagraphNumber(text: string, sourceType: SourceType): [number, string, string] | null {
  const trimmed = text.trim();
  
  if (sourceType === "catechism") {
    // CCC format: "1234 Text..." or "1234. Text..."
    const match = trimmed.match(/^(\d{1,4})\.?\s+(.+)$/s);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 2865) {
        return [num, match[1], match[2]];
      }
    }
  }
  
  if (sourceType === "patristic" || sourceType === "treatise" || sourceType === "generic") {
    // Numbered prose: "1. Text..." or "1 Text..."
    const match = trimmed.match(/^(\d{1,3})\.?\s+(.+)$/s);
    if (match) {
      return [parseInt(match[1], 10), match[1], match[2]];
    }
  }
  
  return null;
}

/**
 * Split text that might contain multiple structural elements on one line
 * (Common in PDFs where headers get concatenated)
 */
function splitCompoundLine(line: string): string[] {
  const parts: string[] = [];
  let remaining = line.trim();
  
  // Try to split by known patterns
  const splitPatterns = [
    /\s+(IN BRIEF)\s*/i,
    /\s+([IVX]+\.)\s+/,
    /\s+(ARTICLE\s+\d+)/i,
  ];
  
  for (const pattern of splitPatterns) {
    const match = remaining.match(pattern);
    if (match && match.index !== undefined) {
      const before = remaining.substring(0, match.index).trim();
      const matched = match[1].trim();
      const after = remaining.substring(match.index + match[0].length).trim();
      
      if (before) parts.push(before);
      if (matched) parts.push(matched);
      remaining = after;
    }
  }
  
  if (remaining) parts.push(remaining);
  
  return parts.length > 0 ? parts : [line];
}

/**
 * Main parsing function
 */
export function parseDocument(
  rawText: string,
  title: string,
  sourceType: SourceType,
  author?: string
): ParsedDocument {
  const nodes: DocumentNode[] = [];
  let citableCount = 0;
  
  // Split into lines and normalize
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  let currentParagraph = "";
  let currentParagraphNumber: [number, string] | null = null;
  
  const flushParagraph = () => {
    if (currentParagraph && currentParagraphNumber) {
      citableCount++;
      const citableNode: CitableNode = {
        nodeType: "citable",
        id: generateId(),
        number: currentParagraphNumber[0],
        displayNumber: currentParagraphNumber[1],
        content: currentParagraph.trim(),
      };
      nodes.push(citableNode);
      currentParagraph = "";
      currentParagraphNumber = null;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Step 1: Check for compound lines (multiple headers on one line)
    const parts = splitCompoundLine(line);
    
    for (const part of parts) {
      // Step 2: Check if this part is structural
      const structural = detectStructural(part);
      
      if (structural) {
        // Flush any pending paragraph before adding structural node
        flushParagraph();
        
        const structuralNode: StructuralNode = {
          nodeType: "structural",
          id: generateId(),
          level: structural.level,
          content: structural.content,
          alignment: getStructuralAlignment(structural.level),
        };
        nodes.push(structuralNode);
        continue;
      }
      
      // Step 3: Check for paragraph number at start
      const paragraphMatch = extractParagraphNumber(part, sourceType);
      
      if (paragraphMatch) {
        // Flush previous paragraph if exists
        flushParagraph();
        
        // Start new paragraph
        currentParagraphNumber = [paragraphMatch[0], paragraphMatch[1]];
        currentParagraph = paragraphMatch[2];
      } else if (currentParagraphNumber) {
        // Continue current paragraph
        currentParagraph += " " + part;
      } else {
        // No current paragraph and no number found
        // For patristic/generic sources, create unnumbered paragraphs
        if (sourceType === "patristic" || sourceType === "generic") {
          // Group consecutive unnumbered lines into paragraphs
          if (!currentParagraph) {
            citableCount++;
            currentParagraphNumber = [citableCount, citableCount.toString()];
            currentParagraph = part;
          } else {
            currentParagraph += " " + part;
          }
        }
      }
    }
  }
  
  // Flush any remaining paragraph
  flushParagraph();
  
  const metadata: DocumentMetadata = {
    id: generateId(),
    title,
    author,
    sourceType,
    importedAt: new Date(),
    totalCitableNodes: citableCount,
  };
  
  return { metadata, nodes };
}

/**
 * Format citation display string
 */
export function formatCitationRange(
  document: ParsedDocument,
  startNumber: number,
  endNumber?: number
): string {
  const prefix = getCitationPrefix(document.metadata.sourceType, document.metadata.title);
  
  if (!endNumber || startNumber === endNumber) {
    return `${prefix} ${startNumber}`;
  }
  
  return `${prefix} ${startNumber}-${endNumber}`;
}

function getCitationPrefix(sourceType: SourceType, title: string): string {
  switch (sourceType) {
    case "catechism":
      return "CCC";
    case "scripture":
      return title;
    case "patristic":
    case "treatise":
    case "generic":
    default:
      return title;
  }
}
