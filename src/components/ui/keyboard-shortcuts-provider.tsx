"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <>
      {children}
      {/* Keyboard shortcuts help dialog - triggered by ? key */}
      <KeyboardShortcutsHelp />
    </>
  );
}
