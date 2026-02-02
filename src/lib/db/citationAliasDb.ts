/**
 * Citation Alias Database Module
 * 
 * Stores document-level citation aliases for academic-style references.
 * Each document can have multiple aliases (e.g., "CCC", "Catechism").
 */

import Dexie, { type Table } from 'dexie';
import { generateId, now } from '../db';
import { CitationAlias } from '@/types/citationAlias';

// ============= Database Definition =============

class CitationAliasDB extends Dexie {
  citationAliases!: Table<CitationAlias, string>;

  constructor() {
    super('SacredScrollCitationAliasDB');
    
    this.version(1).stores({
      citationAliases: 'id, documentId, prefix, priority, createdAt',
    });
  }
}

export const citationAliasDb = new CitationAliasDB();

// ============= CRUD Operations =============

/**
 * Get all citation aliases
 */
export async function getAllCitationAliases(): Promise<CitationAlias[]> {
  return citationAliasDb.citationAliases
    .orderBy('priority')
    .reverse()
    .toArray();
}

/**
 * Get aliases for a specific document
 */
export async function getAliasesForDocument(documentId: string): Promise<CitationAlias[]> {
  return citationAliasDb.citationAliases
    .where('documentId')
    .equals(documentId)
    .toArray();
}

/**
 * Get alias by prefix (case-insensitive match)
 */
export async function getAliasByPrefix(prefix: string): Promise<CitationAlias | undefined> {
  const all = await citationAliasDb.citationAliases.toArray();
  return all.find(a => a.prefix.toLowerCase() === prefix.toLowerCase());
}

/**
 * Create a new citation alias
 */
export async function createCitationAlias(
  documentId: string,
  prefix: string,
  pattern: string,
  numberExtractor: CitationAlias['numberExtractor'],
  displayFormat: string,
  priority: number = 0
): Promise<string> {
  const id = generateId();
  const timestamp = now();

  await citationAliasDb.citationAliases.add({
    id,
    documentId,
    prefix,
    pattern,
    numberExtractor,
    displayFormat,
    priority,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

/**
 * Update an existing citation alias
 */
export async function updateCitationAlias(
  id: string,
  updates: Partial<Pick<CitationAlias, 'prefix' | 'pattern' | 'numberExtractor' | 'displayFormat' | 'priority'>>
): Promise<void> {
  await citationAliasDb.citationAliases.update(id, {
    ...updates,
    updatedAt: now(),
  });
}

/**
 * Delete a citation alias
 */
export async function deleteCitationAlias(id: string): Promise<void> {
  await citationAliasDb.citationAliases.delete(id);
}

/**
 * Delete all aliases for a document
 */
export async function deleteAliasesForDocument(documentId: string): Promise<void> {
  await citationAliasDb.citationAliases
    .where('documentId')
    .equals(documentId)
    .delete();
}

/**
 * Check if a prefix is already in use
 */
export async function isPrefixInUse(prefix: string, excludeId?: string): Promise<boolean> {
  const all = await citationAliasDb.citationAliases.toArray();
  return all.some(a => 
    a.prefix.toLowerCase() === prefix.toLowerCase() && 
    a.id !== excludeId
  );
}

// ============= Export for Sync =============

export interface CitationAliasExport {
  version: 1;
  exportedAt: number;
  aliases: CitationAlias[];
}

export async function exportCitationAliases(): Promise<CitationAliasExport> {
  const aliases = await citationAliasDb.citationAliases.toArray();
  
  return {
    version: 1,
    exportedAt: now(),
    aliases,
  };
}

export async function importCitationAliases(data: CitationAliasExport): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  for (const alias of data.aliases) {
    const existing = await citationAliasDb.citationAliases.get(alias.id);
    if (!existing) {
      await citationAliasDb.citationAliases.add(alias);
      added++;
    } else if (alias.updatedAt > existing.updatedAt) {
      await citationAliasDb.citationAliases.put(alias);
      updated++;
    }
  }

  return { added, updated };
}
