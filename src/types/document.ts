/**
 * Sacred Text Document Model
 * 
 * Every document is a linear list of nodes.
 * There are exactly two node types: structural and citable.
 */

export type NodeType = "structural" | "citable";

/**
 * Structural nodes represent document organization.
 * They are NEVER counted as paragraphs and NEVER citation targets.
 */
export type StructuralAlignment = "center" | "left";

export type StructuralLevel = 
  | "book"           // Book titles (centered, largest)
  | "part"           // Part titles (centered)
  | "section"        // Section titles (centered)
  | "article"        // Article titles (centered)
  | "chapter"        // Chapter titles (centered)
  | "roman"          // Roman numeral sections I., II. (left-aligned)
  | "subsection"     // Subsection headings (left-aligned)
  | "brief"          // "IN BRIEF" markers (left-aligned)
  | "preface"        // Preface, Greeting, etc. (left-aligned)
  | "heading";       // Generic heading (left-aligned)

export interface StructuralNode {
  nodeType: "structural";
  id: string;
  level: StructuralLevel;
  content: string;
  alignment: StructuralAlignment;
}

/**
 * Citable nodes contain the actual text content.
 * They are the ONLY nodes eligible for citation.
 * They are counted sequentially.
 */
export interface CitableNode {
  nodeType: "citable";
  id: string;
  number: number;          // Citation number (e.g., CCC 1, verse 1)
  displayNumber: string;   // Display format (e.g., "1", "1:1", "§1")
  content: string;
  footnotes?: Footnote[];
}

export interface Footnote {
  id: string;
  marker: string;          // e.g., "1", "*", "†"
  content: string;
}

export type DocumentNode = StructuralNode | CitableNode;

/**
 * Source types determine parsing rules
 */
export type SourceType = 
  | "catechism"      // CCC with numbered paragraphs 1-2865
  | "scripture"      // Bible with book:chapter:verse
  | "patristic"      // Church Fathers (varied formats)
  | "treatise"       // Theological treatises
  | "generic";       // Fallback

export interface DocumentMetadata {
  id: string;
  title: string;
  author?: string;
  sourceType: SourceType;
  importedAt: Date;
  totalCitableNodes: number;
}

export interface ParsedDocument {
  metadata: DocumentMetadata;
  nodes: DocumentNode[];
}

/**
 * Citation reference for copying/exporting
 */
export interface Citation {
  documentId: string;
  documentTitle: string;
  nodeIds: string[];
  displayRange: string;    // e.g., "CCC 1-5", "Genesis 1:1-3"
  content: string;
}

/**
 * Type guards
 */
export function isStructuralNode(node: DocumentNode): node is StructuralNode {
  return node.nodeType === "structural";
}

export function isCitableNode(node: DocumentNode): node is CitableNode {
  return node.nodeType === "citable";
}

/**
 * Determines alignment based on structural level
 */
export function getStructuralAlignment(level: StructuralLevel): StructuralAlignment {
  switch (level) {
    case "book":
    case "part":
    case "section":
    case "article":
    case "chapter":
      return "center";
    case "roman":
    case "subsection":
    case "brief":
    case "preface":
    case "heading":
    default:
      return "left";
  }
}
