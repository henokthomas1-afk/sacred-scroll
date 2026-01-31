/**
 * Notes Database Module - Obsidian-style global notes with folders
 * 
 * Flat data model with parentId references for nesting.
 * Float-based ordering for stable drag & drop.
 */

import Dexie, { type Table } from 'dexie';
import { db, generateId, now } from '../db';

// ============= Extended Database for Notes =============

export interface GlobalNote {
  id: string;
  title: string;
  content: string;
  parentId: string | null; // null = root level
  order: number; // Float for stable insertion
  fontSize: number; // Per-note font size
  createdAt: number;
  updatedAt: number;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId: string | null; // null = root level
  order: number; // Float for stable insertion
  createdAt: number;
  updatedAt: number;
}

export interface NoteCitation {
  id: string;
  noteId: string;
  targetDocumentId: string;
  targetNodeId: string | null;
  citationText: string;
  createdAt: number;
}

/**
 * CitationAnchor - Bidirectional link between a reader paragraph and a note
 * 
 * One paragraph → many notes
 * One note → many paragraphs
 */
export interface CitationAnchor {
  id: string;
  documentId: string;      // Source document
  nodeId: string;          // Source paragraph
  noteId: string;          // Target note
  displayLabel: string;    // e.g., "CCC §27" for display
  order: number;           // Order within the note
  createdAt: number;
}

// Extend Dexie database with new tables
class NotesDatabase extends Dexie {
  globalNotes!: Table<GlobalNote, string>;
  noteFolders!: Table<NoteFolder, string>;
  globalNoteCitations!: Table<NoteCitation, string>;
  citationAnchors!: Table<CitationAnchor, string>;

  constructor() {
    super('SacredScrollNotesDB');
    
    this.version(1).stores({
      globalNotes: 'id, parentId, order, createdAt, updatedAt',
      noteFolders: 'id, parentId, order, createdAt, updatedAt',
      globalNoteCitations: 'id, noteId, targetDocumentId, createdAt',
    });

    // Version 2 adds citation anchors with compound index for node lookup
    this.version(2).stores({
      globalNotes: 'id, parentId, order, createdAt, updatedAt',
      noteFolders: 'id, parentId, order, createdAt, updatedAt',
      globalNoteCitations: 'id, noteId, targetDocumentId, createdAt',
      citationAnchors: 'id, documentId, nodeId, noteId, [documentId+nodeId], order, createdAt',
    });
  }
}

export const notesDb = new NotesDatabase();

// ============= Folder Operations =============

export async function getAllFolders(): Promise<NoteFolder[]> {
  return notesDb.noteFolders.toArray();
}

export async function createFolder(
  name: string,
  parentId: string | null = null
): Promise<string> {
  const id = generateId();
  const timestamp = now();

  // Get max order in parent
  const siblings = await notesDb.noteFolders
    .where('parentId')
    .equals(parentId ?? '')
    .toArray();
  const maxOrder = siblings.length > 0
    ? Math.max(...siblings.map(f => f.order))
    : 0;

  await notesDb.noteFolders.add({
    id,
    name,
    parentId,
    order: maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await notesDb.noteFolders.update(id, {
    name,
    updatedAt: now(),
  });
}

export async function moveFolder(
  id: string,
  newParentId: string | null,
  newOrder: number
): Promise<void> {
  await notesDb.noteFolders.update(id, {
    parentId: newParentId,
    order: newOrder,
    updatedAt: now(),
  });
}

export async function deleteFolder(id: string): Promise<void> {
  await notesDb.transaction('rw', [notesDb.noteFolders, notesDb.globalNotes, notesDb.globalNoteCitations], async () => {
    // Recursively get all child folders
    const getAllChildFolderIds = async (parentId: string): Promise<string[]> => {
      const children = await notesDb.noteFolders
        .where('parentId')
        .equals(parentId)
        .toArray();
      
      const childIds = children.map(f => f.id);
      const grandchildIds = await Promise.all(
        childIds.map(id => getAllChildFolderIds(id))
      );
      
      return [...childIds, ...grandchildIds.flat()];
    };

    const allFolderIds = [id, ...(await getAllChildFolderIds(id))];

    // Get all notes in these folders
    const notesInFolders = await notesDb.globalNotes
      .where('parentId')
      .anyOf(allFolderIds)
      .toArray();
    const noteIds = notesInFolders.map(n => n.id);

    // Delete citations
    if (noteIds.length > 0) {
      await notesDb.globalNoteCitations
        .where('noteId')
        .anyOf(noteIds)
        .delete();
    }

    // Delete notes
    await notesDb.globalNotes
      .where('parentId')
      .anyOf(allFolderIds)
      .delete();

    // Delete folders
    await notesDb.noteFolders
      .where('id')
      .anyOf(allFolderIds)
      .delete();
  });
}

// ============= Note Operations =============

export async function getAllGlobalNotes(): Promise<GlobalNote[]> {
  return notesDb.globalNotes.toArray();
}

export async function createGlobalNote(
  title: string,
  content: string = '',
  parentId: string | null = null
): Promise<string> {
  const id = generateId();
  const timestamp = now();

  // Get max order in parent
  const siblingNotes = await notesDb.globalNotes
    .where('parentId')
    .equals(parentId ?? '')
    .toArray();
  const siblingFolders = await notesDb.noteFolders
    .where('parentId')
    .equals(parentId ?? '')
    .toArray();
  
  const maxNoteOrder = siblingNotes.length > 0
    ? Math.max(...siblingNotes.map(n => n.order))
    : 0;
  const maxFolderOrder = siblingFolders.length > 0
    ? Math.max(...siblingFolders.map(f => f.order))
    : 0;
  
  const maxOrder = Math.max(maxNoteOrder, maxFolderOrder);

  await notesDb.globalNotes.add({
    id,
    title,
    content,
    parentId,
    order: maxOrder + 1,
    fontSize: 16, // Default font size
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

export async function updateGlobalNoteFontSize(id: string, fontSize: number): Promise<void> {
  await notesDb.globalNotes.update(id, {
    fontSize,
    updatedAt: now(),
  });
}

export async function updateGlobalNote(
  id: string,
  updates: Partial<Pick<GlobalNote, 'title' | 'content'>>
): Promise<void> {
  await notesDb.globalNotes.update(id, {
    ...updates,
    updatedAt: now(),
  });
}

export async function moveNote(
  id: string,
  newParentId: string | null,
  newOrder: number
): Promise<void> {
  await notesDb.globalNotes.update(id, {
    parentId: newParentId,
    order: newOrder,
    updatedAt: now(),
  });
}

export async function deleteGlobalNote(id: string): Promise<void> {
  await notesDb.transaction('rw', [notesDb.globalNotes, notesDb.globalNoteCitations, notesDb.citationAnchors], async () => {
    await notesDb.globalNoteCitations.where('noteId').equals(id).delete();
    await notesDb.citationAnchors.where('noteId').equals(id).delete();
    await notesDb.globalNotes.delete(id);
  });
}

export async function getGlobalNote(id: string): Promise<GlobalNote | undefined> {
  return notesDb.globalNotes.get(id);
}

// ============= Citation Operations =============

export async function getCitationsForGlobalNote(noteId: string): Promise<NoteCitation[]> {
  return notesDb.globalNoteCitations
    .where('noteId')
    .equals(noteId)
    .toArray();
}

export async function addGlobalNoteCitation(
  noteId: string,
  targetDocumentId: string,
  citationText: string,
  targetNodeId?: string
): Promise<string> {
  const id = generateId();
  
  await notesDb.globalNoteCitations.add({
    id,
    noteId,
    targetDocumentId,
    targetNodeId: targetNodeId || null,
    citationText,
    createdAt: now(),
  });

  return id;
}

export async function removeGlobalNoteCitation(id: string): Promise<void> {
  await notesDb.globalNoteCitations.delete(id);
}

// ============= Citation Anchor Operations =============

/**
 * Get all citation anchors for a specific note (for note → reader navigation)
 */
export async function getAnchorsForNote(noteId: string): Promise<CitationAnchor[]> {
  return notesDb.citationAnchors
    .where('noteId')
    .equals(noteId)
    .sortBy('order');
}

/**
 * Get all citation anchors for a specific paragraph (for reader → note indication)
 */
export async function getAnchorsForNode(documentId: string, nodeId: string): Promise<CitationAnchor[]> {
  return notesDb.citationAnchors
    .where('[documentId+nodeId]')
    .equals([documentId, nodeId])
    .toArray();
}

/**
 * Get all citation anchors for a document (for showing indicators)
 */
export async function getAnchorsForDocument(documentId: string): Promise<CitationAnchor[]> {
  return notesDb.citationAnchors
    .where('documentId')
    .equals(documentId)
    .toArray();
}

/**
 * Create a citation anchor linking a paragraph to a note
 */
export async function createCitationAnchor(
  documentId: string,
  nodeId: string,
  noteId: string,
  displayLabel: string
): Promise<string> {
  const id = generateId();
  
  // Get max order for this note's anchors
  const existingAnchors = await getAnchorsForNote(noteId);
  const maxOrder = existingAnchors.length > 0
    ? Math.max(...existingAnchors.map(a => a.order))
    : 0;

  await notesDb.citationAnchors.add({
    id,
    documentId,
    nodeId,
    noteId,
    displayLabel,
    order: maxOrder + 1,
    createdAt: now(),
  });

  return id;
}

/**
 * Remove a citation anchor
 */
export async function removeCitationAnchor(id: string): Promise<void> {
  await notesDb.citationAnchors.delete(id);
}

/**
 * Remove all anchors for a specific note (called when note is deleted)
 */
export async function removeAnchorsForNote(noteId: string): Promise<void> {
  await notesDb.citationAnchors.where('noteId').equals(noteId).delete();
}

/**
 * Check if an anchor already exists between a paragraph and note
 */
export async function anchorExists(
  documentId: string,
  nodeId: string,
  noteId: string
): Promise<boolean> {
  const count = await notesDb.citationAnchors
    .where('noteId')
    .equals(noteId)
    .filter(a => a.documentId === documentId && a.nodeId === nodeId)
    .count();
  return count > 0;
}

// ============= Reordering Helpers =============

export function calculateOrderBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1;
  if (before === null) return (after as number) / 2;
  if (after === null) return (before as number) + 1;
  return ((before as number) + (after as number)) / 2;
}

// ============= Export for Sync =============

export interface GlobalNotesExport {
  version: 1;
  exportedAt: number;
  folders: NoteFolder[];
  notes: GlobalNote[];
  citations: NoteCitation[];
}

export async function exportGlobalNotes(): Promise<GlobalNotesExport> {
  const [folders, notes, citations] = await Promise.all([
    notesDb.noteFolders.toArray(),
    notesDb.globalNotes.toArray(),
    notesDb.globalNoteCitations.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: now(),
    folders,
    notes,
    citations,
  };
}

export async function importGlobalNotes(data: GlobalNotesExport): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  await notesDb.transaction('rw', [notesDb.noteFolders, notesDb.globalNotes, notesDb.globalNoteCitations], async () => {
    // Merge folders
    for (const folder of data.folders) {
      const existing = await notesDb.noteFolders.get(folder.id);
      if (!existing) {
        await notesDb.noteFolders.add(folder);
        added++;
      } else if (folder.updatedAt > existing.updatedAt) {
        await notesDb.noteFolders.put(folder);
        updated++;
      }
    }

    // Merge notes
    for (const note of data.notes) {
      const existing = await notesDb.globalNotes.get(note.id);
      if (!existing) {
        await notesDb.globalNotes.add(note);
        added++;
      } else if (note.updatedAt > existing.updatedAt) {
        await notesDb.globalNotes.put(note);
        updated++;
      }
    }

    // Merge citations
    for (const citation of data.citations) {
      const existing = await notesDb.globalNoteCitations.get(citation.id);
      if (!existing) {
        await notesDb.globalNoteCitations.add(citation);
      }
    }
  });

  return { added, updated };
}
