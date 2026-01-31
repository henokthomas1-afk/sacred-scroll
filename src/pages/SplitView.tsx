/**
 * SplitView - Dedicated page for the stable split-screen layout
 * 
 * Layout invariants:
 * - body/root do NOT scroll
 * - Only the two panes scroll independently
 * - No modals for the main reader
 * - Local-first only (no Supabase)
 */

import { SplitReaderLayout } from "@/components/layout";

export default function SplitView() {
  return <SplitReaderLayout />;
}
