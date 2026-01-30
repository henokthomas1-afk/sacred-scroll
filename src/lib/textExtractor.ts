/**
 * Client-side text extraction from various file formats
 * 
 * All formats are normalized to plain text before parsing.
 * The parser never knows about the original file format.
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ============= Types =============

export type SupportedFileType = 'txt' | 'md' | 'pdf' | 'doc' | 'docx';

export interface ExtractionResult {
  text: string;
  pageCount?: number;
}

// ============= File Type Detection =============

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function getSupportedFileType(filename: string): SupportedFileType | null {
  const ext = getFileExtension(filename);
  
  switch (ext) {
    case 'txt':
    case 'md':
    case 'pdf':
    case 'doc':
    case 'docx':
      return ext as SupportedFileType;
    default:
      return null;
  }
}

// ============= Text Extraction =============

/**
 * Extract text from TXT or MD files
 * Simply reads as UTF-8, preserving line breaks
 */
async function extractFromText(file: File): Promise<ExtractionResult> {
  const text = await file.text();
  return { text };
}

/**
 * Extract text from PDF files using PDF.js
 * Joins text blocks in reading order with normalized whitespace
 */
async function extractFromPdf(file: File): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  const pageCount = pdf.numPages;
  
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Track previous item for paragraph detection
    let lastY: number | null = null;
    let pageText = '';
    
    for (const item of textContent.items) {
      if ('str' in item && item.str) {
        // Check if this is a new line/paragraph based on Y position change
        if (lastY !== null && 'transform' in item) {
          const currentY = item.transform[5];
          const yDiff = Math.abs(currentY - lastY);
          
          // Significant Y change indicates new line/paragraph
          if (yDiff > 5) {
            // Large gap = paragraph break, small gap = line break
            pageText += yDiff > 20 ? '\n\n' : '\n';
          } else if (pageText && !pageText.endsWith(' ')) {
            // Same line, add space between words
            pageText += ' ';
          }
        }
        
        pageText += item.str;
        
        if ('transform' in item) {
          lastY = item.transform[5];
        }
      }
    }
    
    if (pageText.trim()) {
      textParts.push(pageText.trim());
    }
  }
  
  // Join pages with double line breaks
  let text = textParts.join('\n\n');
  
  // Normalize whitespace
  text = normalizeWhitespace(text);
  
  return { text, pageCount };
}

/**
 * Extract text from DOC/DOCX files using Mammoth
 * Preserves paragraph breaks, strips styling
 */
async function extractFromDocx(file: File): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use mammoth to extract raw text (no HTML formatting)
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  let text = result.value;
  
  // Normalize whitespace
  text = normalizeWhitespace(text);
  
  return { text };
}

// ============= Normalization =============

/**
 * Normalize whitespace in extracted text
 * - Collapse excessive blank lines (3+ → 2)
 * - Trim lines
 * - Normalize line endings
 */
function normalizeWhitespace(text: string): string {
  return text
    // Normalize line endings to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse multiple spaces to single space
    .replace(/[ \t]+/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim the whole text
    .trim();
}

// ============= Main Export =============

/**
 * Extract plain text from a file, regardless of format
 * 
 * This is the single entry point for all file types.
 * The returned text is normalized and ready for the parser.
 * 
 * @param file - The file to extract text from
 * @returns Promise resolving to the extracted plain text
 * @throws Error if the file format is not supported
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = getSupportedFileType(file.name);
  
  if (!fileType) {
    const ext = getFileExtension(file.name);
    throw new Error(
      `Unsupported file format: .${ext}. ` +
      `Supported formats: .txt, .md, .pdf, .doc, .docx`
    );
  }
  
  let result: ExtractionResult;
  
  switch (fileType) {
    case 'txt':
    case 'md':
      result = await extractFromText(file);
      break;
    case 'pdf':
      result = await extractFromPdf(file);
      break;
    case 'doc':
    case 'docx':
      result = await extractFromDocx(file);
      break;
    default:
      throw new Error(`Extraction not implemented for: .${fileType}`);
  }
  
  if (!result.text.trim()) {
    throw new Error('No text content could be extracted from the file.');
  }
  
  return result.text;
}

/**
 * Check if a file type is supported for import
 */
export function isFileTypeSupported(filename: string): boolean {
  return getSupportedFileType(filename) !== null;
}

/**
 * Get the list of accepted file extensions for the file input
 */
export function getAcceptedFileTypes(): string {
  return '.txt,.md,.pdf,.doc,.docx';
}
