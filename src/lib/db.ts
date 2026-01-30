/**
 * Local-first database using IndexedDB (Dexie)
 * This is the single source of truth for all data.
 */

import Dexie, { type Table } from 'dexie';

// ============= Data Models =============

export type DocumentCategory = 'scripture' | 'catechism' | 'patristic' | 'commentary' | 'custom';
export type SourceType = 'catechism' | 'scripture' | 'patristic' | 'treatise' | 'generic';
export type NoteType = 'document' | 'section' | 'paragraph';

export interface LocalDocument {
  id: string;
  title: string;
  author?: string;
  category: DocumentCategory;
  sourceType: SourceType;
  rawContent?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LocalDocumentNode {
  id: string;
  documentId: string;
  nodeType: 'structural' | 'citable';
  order: number; // FLOAT for safe insertion between nodes
  level?: string;
  alignment?: 'center' | 'left';
  number?: number;
  displayNumber?: string;
  content: string;
}

export interface LocalNote {
  id: string;
  documentId: string;
  nodeId?: string;
  type: NoteType;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface LocalNoteCitation {
  id: string;
  noteId: string;
  targetDocumentId: string;
  targetNodeId?: string;
  citationText: string;
  createdAt: number;
}

// ============= Database Definition =============

class SacredScrollDB extends Dexie {
  documents!: Table<LocalDocument, string>;
  documentNodes!: Table<LocalDocumentNode, string>;
  notes!: Table<LocalNote, string>;
  noteCitations!: Table<LocalNoteCitation, string>;

  constructor() {
    super('SacredScrollDB');
    
    this.version(1).stores({
      documents: 'id, title, category, sourceType, createdAt, updatedAt',
      documentNodes: 'id, documentId, nodeType, order, [documentId+order]',
      notes: 'id, documentId, nodeId, type, createdAt, updatedAt',
      noteCitations: 'id, noteId, targetDocumentId, targetNodeId, createdAt',
    });
  }
}

export const db = new SacredScrollDB();

// ============= Utility Functions =============

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Date.now();
}

// ============= Document Operations =============

export async function getAllDocuments(): Promise<LocalDocument[]> {
  return db.documents.orderBy('createdAt').reverse().toArray();
}

export async function getDocument(id: string): Promise<LocalDocument | undefined> {
  return db.documents.get(id);
}

export async function getDocumentNodes(documentId: string): Promise<LocalDocumentNode[]> {
  return db.documentNodes
    .where('documentId')
    .equals(documentId)
    .sortBy('order');
}

export async function saveDocument(
  doc: Omit<LocalDocument, 'id' | 'createdAt' | 'updatedAt'>,
  nodes: Omit<LocalDocumentNode, 'id' | 'documentId'>[]
): Promise<string> {
  const docId = generateId();
  const timestamp = now();

  const localDoc: LocalDocument = {
    ...doc,
    id: docId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const localNodes: LocalDocumentNode[] = nodes.map((node, index) => ({
    ...node,
    id: generateId(),
    documentId: docId,
    order: index, // Start with integer orders
  }));

  await db.transaction('rw', [db.documents, db.documentNodes], async () => {
    await db.documents.add(localDoc);
    await db.documentNodes.bulkAdd(localNodes);
  });

  return docId;
}

export async function deleteDocument(id: string): Promise<void> {
  await db.transaction('rw', [db.documents, db.documentNodes, db.notes, db.noteCitations], async () => {
    // Get all notes for this document
    const notes = await db.notes.where('documentId').equals(id).toArray();
    const noteIds = notes.map(n => n.id);

    // Delete citations for those notes
    if (noteIds.length > 0) {
      await db.noteCitations.where('noteId').anyOf(noteIds).delete();
    }

    // Delete notes, nodes, and document
    await db.notes.where('documentId').equals(id).delete();
    await db.documentNodes.where('documentId').equals(id).delete();
    await db.documents.delete(id);
  });
}

// ============= Note Operations =============

export async function getNotesForDocument(documentId: string): Promise<LocalNote[]> {
  return db.notes
    .where('documentId')
    .equals(documentId)
    .reverse()
    .sortBy('createdAt');
}

export async function getCitationsForNotes(noteIds: string[]): Promise<LocalNoteCitation[]> {
  if (noteIds.length === 0) return [];
  return db.noteCitations.where('noteId').anyOf(noteIds).toArray();
}

export async function createNote(
  documentId: string,
  type: NoteType,
  content: string,
  nodeId?: string
): Promise<string> {
  const id = generateId();
  const timestamp = now();

  await db.notes.add({
    id,
    documentId,
    nodeId,
    type,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

export async function updateNote(id: string, content: string): Promise<void> {
  await db.notes.update(id, {
    content,
    updatedAt: now(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await db.transaction('rw', [db.notes, db.noteCitations], async () => {
    await db.noteCitations.where('noteId').equals(id).delete();
    await db.notes.delete(id);
  });
}

export async function addNoteCitation(
  noteId: string,
  targetDocumentId: string,
  citationText: string,
  targetNodeId?: string
): Promise<string> {
  const id = generateId();

  await db.noteCitations.add({
    id,
    noteId,
    targetDocumentId,
    targetNodeId,
    citationText,
    createdAt: now(),
  });

  return id;
}

export async function removeNoteCitation(id: string): Promise<void> {
  await db.noteCitations.delete(id);
}

// ============= Export/Import for Sync =============

export interface LibraryExport {
  version: 1;
  exportedAt: number;
  documents: LocalDocument[];
  documentNodes: LocalDocumentNode[];
  notes: LocalNote[];
  noteCitations: LocalNoteCitation[];
}

export async function exportLibrary(): Promise<LibraryExport> {
  const [documents, documentNodes, notes, noteCitations] = await Promise.all([
    db.documents.toArray(),
    db.documentNodes.toArray(),
    db.notes.toArray(),
    db.noteCitations.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: now(),
    documents,
    documentNodes,
    notes,
    noteCitations,
  };
}

export async function importLibrary(data: LibraryExport): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  await db.transaction('rw', [db.documents, db.documentNodes, db.notes, db.noteCitations], async () => {
    // Merge documents (timestamp-based conflict resolution)
    for (const doc of data.documents) {
      const existing = await db.documents.get(doc.id);
      if (!existing) {
        await db.documents.add(doc);
        added++;
      } else if (doc.updatedAt > existing.updatedAt) {
        await db.documents.put(doc);
        updated++;
      }
    }

    // Nodes: replace all for updated documents
    for (const node of data.documentNodes) {
      const existing = await db.documentNodes.get(node.id);
      if (!existing) {
        await db.documentNodes.add(node);
      }
    }

    // Notes: timestamp-based merge
    for (const note of data.notes) {
      const existing = await db.notes.get(note.id);
      if (!existing) {
        await db.notes.add(note);
      } else if (note.updatedAt > existing.updatedAt) {
        await db.notes.put(note);
      }
    }

    // Citations: add if not exists
    for (const citation of data.noteCitations) {
      const existing = await db.noteCitations.get(citation.id);
      if (!existing) {
        await db.noteCitations.add(citation);
      }
    }
  });

  return { added, updated };
}
