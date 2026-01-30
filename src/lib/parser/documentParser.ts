/**
 * Client-side document parser
 * Runs entirely offline in the browser
 */

import { SourceType } from '@/lib/db';

// ============= Types =============

export interface ParsedNode {
  nodeType: 'structural' | 'citable';
  level?: string;
  alignment?: 'center' | 'left';
  number?: number;
  displayNumber?: string;
  content: string;
}

export interface ParseResult {
  nodes: ParsedNode[];
  stats: {
    total: number;
    structural: number;
    citable: number;
  };
}

// ============= Structural Patterns =============

const STRUCTURAL_PATTERNS: Array<{
  pattern: RegExp;
  level: string;
}> = [
  // "IN BRIEF" sections
  { pattern: /^IN BRIEF$/i, level: 'brief' },
  
  // Book/Part titles (all caps, substantial length)
  { pattern: /^(PART\s+(?:ONE|TWO|THREE|FOUR|[IVX]+))(?:\s*[-:.]?\s*(.+))?$/i, level: 'part' },
  { pattern: /^(BOOK\s+(?:ONE|TWO|THREE|FOUR|[IVX]+))(?:\s*[-:.]?\s*(.+))?$/i, level: 'book' },
  
  // Article/Section titles
  { pattern: /^ARTICLE\s+\d+/i, level: 'article' },
  { pattern: /^SECTION\s+(?:ONE|TWO|THREE|FOUR|\d+)/i, level: 'section' },
  
  // Chapter titles (including patristic format)
  { pattern: /^Chapter\s+[IVX]+\.?[-—]?/i, level: 'chapter' },
  { pattern: /^CHAPTER\s+(?:\d+|[IVX]+)/i, level: 'chapter' },
  
  // Roman numeral sections (I., II., III. etc. - standalone)
  { pattern: /^([IVX]+)\.\s*(.+)$/, level: 'roman' },
  
  // Preface, Greeting, Introduction
  { pattern: /^(PREFACE|GREETING|INTRODUCTION|PROLOGUE|EPILOGUE)$/i, level: 'preface' },
  
  // All-caps titles (must be at least 3 chars, all uppercase letters/spaces)
  { pattern: /^[A-Z][A-Z\s]{2,}[A-Z]$/, level: 'section' },
];

// ============= Helper Functions =============

function getStructuralAlignment(level: string): 'center' | 'left' {
  switch (level) {
    case 'book':
    case 'part':
    case 'section':
    case 'article':
    case 'chapter':
      return 'center';
    case 'roman':
    case 'subsection':
    case 'brief':
    case 'preface':
    case 'heading':
    default:
      return 'left';
  }
}

function detectStructural(line: string): { level: string; content: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  for (const { pattern, level } of STRUCTURAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { level, content: trimmed };
    }
  }
  
  return null;
}

function extractParagraphNumber(text: string, sourceType: SourceType): [number, string, string] | null {
  const trimmed = text.trim();
  
  if (sourceType === 'catechism') {
    const match = trimmed.match(/^(\d{1,4})\.?\s+(.+)$/s);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 2865) {
        return [num, match[1], match[2]];
      }
    }
  }
  
  if (sourceType === 'patristic' || sourceType === 'treatise' || sourceType === 'generic') {
    const match = trimmed.match(/^(\d{1,3})\.?\s+(.+)$/s);
    if (match) {
      return [parseInt(match[1], 10), match[1], match[2]];
    }
  }
  
  return null;
}

function splitCompoundLine(line: string): string[] {
  const parts: string[] = [];
  let remaining = line.trim();
  
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

// ============= Main Parser =============

export function parseDocument(rawText: string, sourceType: SourceType): ParseResult {
  const nodes: ParsedNode[] = [];
  
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  let currentParagraph = '';
  let currentParagraphNumber: [number, string] | null = null;
  let citableCount = 0;
  
  const flushParagraph = () => {
    if (currentParagraph && currentParagraphNumber) {
      citableCount++;
      nodes.push({
        nodeType: 'citable',
        number: currentParagraphNumber[0],
        displayNumber: currentParagraphNumber[1],
        content: currentParagraph.trim(),
      });
      currentParagraph = '';
      currentParagraphNumber = null;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = splitCompoundLine(line);
    
    for (const part of parts) {
      const structural = detectStructural(part);
      
      if (structural) {
        flushParagraph();
        
        nodes.push({
          nodeType: 'structural',
          level: structural.level,
          alignment: getStructuralAlignment(structural.level),
          content: structural.content,
        });
        continue;
      }
      
      const paragraphMatch = extractParagraphNumber(part, sourceType);
      
      if (paragraphMatch) {
        flushParagraph();
        currentParagraphNumber = [paragraphMatch[0], paragraphMatch[1]];
        currentParagraph = paragraphMatch[2];
      } else if (currentParagraphNumber) {
        currentParagraph += ' ' + part;
      } else {
        if (sourceType === 'patristic' || sourceType === 'generic') {
          if (!currentParagraph) {
            citableCount++;
            currentParagraphNumber = [citableCount, citableCount.toString()];
            currentParagraph = part;
          } else {
            currentParagraph += ' ' + part;
          }
        }
      }
    }
  }
  
  flushParagraph();
  
  return {
    nodes,
    stats: {
      total: nodes.length,
      structural: nodes.filter(n => n.nodeType === 'structural').length,
      citable: nodes.filter(n => n.nodeType === 'citable').length,
    },
  };
}
