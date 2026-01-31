/**
 * Documents Database Module - Folder support for document library
 * 
 * Extends the main db with folder organization for documents.
 * Flat data model with parentId references for nesting.
 * Float-based ordering for stable drag & drop.
 */

import Dexie, { type Table } from 'dexie';
import { generateId, now } from '../db';

// ============= Document Folder Model =============

export interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null; // null = root level
  order: number; // Float for stable insertion
  createdAt: number;
  updatedAt: number;
}

export interface DocumentFolderAssignment {
  id: string;
  documentId: string;
  folderId: string | null; // null = root level
  order: number; // Float for stable insertion within folder
  createdAt: number;
  updatedAt: number;
}

// ============= Extended Database for Document Folders =============

class DocumentFoldersDB extends Dexie {
  documentFolders!: Table<DocumentFolder, string>;
  documentFolderAssignments!: Table<DocumentFolderAssignment, string>;

  constructor() {
    super('SacredScrollDocumentsDB');
    
    this.version(1).stores({
      documentFolders: 'id, parentId, order, createdAt, updatedAt',
      documentFolderAssignments: 'id, documentId, folderId, order, [folderId+order]',
    });
  }
}

export const docFoldersDb = new DocumentFoldersDB();

// ============= Folder Operations =============

export async function getAllDocumentFolders(): Promise<DocumentFolder[]> {
  return docFoldersDb.documentFolders.toArray();
}

export async function createDocumentFolder(
  name: string,
  parentId: string | null = null
): Promise<string> {
  const id = generateId();
  const timestamp = now();

  // Get max order in parent
  const siblings = await docFoldersDb.documentFolders
    .where('parentId')
    .equals(parentId ?? '')
    .toArray();
  const maxOrder = siblings.length > 0
    ? Math.max(...siblings.map(f => f.order))
    : 0;

  await docFoldersDb.documentFolders.add({
    id,
    name,
    parentId,
    order: maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return id;
}

export async function renameDocumentFolder(id: string, name: string): Promise<void> {
  await docFoldersDb.documentFolders.update(id, {
    name,
    updatedAt: now(),
  });
}

export async function moveDocumentFolder(
  id: string,
  newParentId: string | null,
  newOrder: number
): Promise<void> {
  await docFoldersDb.documentFolders.update(id, {
    parentId: newParentId,
    order: newOrder,
    updatedAt: now(),
  });
}

export async function deleteDocumentFolder(id: string): Promise<void> {
  await docFoldersDb.transaction('rw', [docFoldersDb.documentFolders, docFoldersDb.documentFolderAssignments], async () => {
    // Recursively get all child folder IDs
    const getAllChildFolderIds = async (parentId: string): Promise<string[]> => {
      const children = await docFoldersDb.documentFolders
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

    // Move documents in these folders to root
    await docFoldersDb.documentFolderAssignments
      .where('folderId')
      .anyOf(allFolderIds)
      .modify({ folderId: null });

    // Delete folders
    await docFoldersDb.documentFolders
      .where('id')
      .anyOf(allFolderIds)
      .delete();
  });
}

// ============= Document Assignment Operations =============

export async function getAllDocumentAssignments(): Promise<DocumentFolderAssignment[]> {
  return docFoldersDb.documentFolderAssignments.toArray();
}

export async function getDocumentAssignment(documentId: string): Promise<DocumentFolderAssignment | undefined> {
  return docFoldersDb.documentFolderAssignments
    .where('documentId')
    .equals(documentId)
    .first();
}

export async function assignDocumentToFolder(
  documentId: string,
  folderId: string | null
): Promise<void> {
  const timestamp = now();
  const existing = await getDocumentAssignment(documentId);

  // Get max order in target folder
  const siblings = await docFoldersDb.documentFolderAssignments
    .where('folderId')
    .equals(folderId ?? '')
    .toArray();
  const maxOrder = siblings.length > 0
    ? Math.max(...siblings.map(a => a.order))
    : 0;

  if (existing) {
    await docFoldersDb.documentFolderAssignments.update(existing.id, {
      folderId,
      order: maxOrder + 1,
      updatedAt: timestamp,
    });
  } else {
    await docFoldersDb.documentFolderAssignments.add({
      id: generateId(),
      documentId,
      folderId,
      order: maxOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

export async function moveDocumentInFolder(
  documentId: string,
  newFolderId: string | null,
  newOrder: number
): Promise<void> {
  const existing = await getDocumentAssignment(documentId);
  const timestamp = now();

  if (existing) {
    await docFoldersDb.documentFolderAssignments.update(existing.id, {
      folderId: newFolderId,
      order: newOrder,
      updatedAt: timestamp,
    });
  } else {
    await docFoldersDb.documentFolderAssignments.add({
      id: generateId(),
      documentId,
      folderId: newFolderId,
      order: newOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

export async function removeDocumentAssignment(documentId: string): Promise<void> {
  await docFoldersDb.documentFolderAssignments
    .where('documentId')
    .equals(documentId)
    .delete();
}

// ============= Reordering Helpers =============

export function calculateOrderBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1;
  if (before === null) return (after as number) / 2;
  if (after === null) return (before as number) + 1;
  return ((before as number) + (after as number)) / 2;
}
