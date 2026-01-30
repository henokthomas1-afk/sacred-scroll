/**
 * Import Review Phase Types
 * 
 * These types support the pre-save review phase where users can
 * reclassify, merge, split, and renumber nodes before canonicalization.
 */

import { StructuralLevel, StructuralAlignment } from './document';

/**
 * Review node classification
 */
export type ReviewNodeType = 'structural' | 'citable' | 'ignored';

/**
 * A node in the review phase (mutable until canonicalization)
 */
export interface ReviewNode {
  tempId: string;                    // Temporary ID during review
  nodeType: ReviewNodeType;
  content: string;
  
  // Structural properties
  level?: StructuralLevel;
  alignment?: StructuralAlignment;
  
  // Citable properties
  displayNumber?: string;            // User-editable display number
  
  // Tracking
  originalIndex: number;             // Position from initial parse
  modified: boolean;                 // Has user modified this node?
}

/**
 * Review action types for undo/redo
 */
export type ReviewActionType = 
  | 'reclassify'
  | 'merge'
  | 'split'
  | 'renumber'
  | 'edit_content'
  | 'ignore';

/**
 * Classification options for structural nodes
 */
export interface StructuralClassification {
  type: 'structural';
  level: StructuralLevel;
  alignment: StructuralAlignment;
}

/**
 * Classification options for citable nodes
 */
export interface CitableClassification {
  type: 'citable';
  displayNumber: string;
}

/**
 * Ignore classification
 */
export interface IgnoreClassification {
  type: 'ignored';
}

export type NodeClassification = 
  | StructuralClassification 
  | CitableClassification 
  | IgnoreClassification;

/**
 * Review session state
 */
export interface ReviewState {
  nodes: ReviewNode[];
  selectedNodeId: string | null;
  isDirty: boolean;
}

/**
 * Stats for review display
 */
export interface ReviewStats {
  total: number;
  structural: number;
  citable: number;
  ignored: number;
}
