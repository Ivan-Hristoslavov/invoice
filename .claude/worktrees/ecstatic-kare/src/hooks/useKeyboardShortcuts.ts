"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

// Global keyboard shortcuts for the application
export function useKeyboardShortcuts(enabled = true) {
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      key: "d",
      alt: true,
      handler: () => router.push("/dashboard"),
      description: "Отиди на таблото",
    },
    {
      key: "i",
      alt: true,
      handler: () => router.push("/invoices"),
      description: "Отиди на фактури",
    },
    {
      key: "c",
      alt: true,
      handler: () => router.push("/clients"),
      description: "Отиди на клиенти",
    },
    {
      key: "p",
      alt: true,
      handler: () => router.push("/products"),
      description: "Отиди на продукти",
    },
    // Create shortcuts
    {
      key: "n",
      alt: true,
      handler: () => router.push("/invoices/new"),
      description: "Нова фактура",
    },
    {
      key: "n",
      alt: true,
      shift: true,
      handler: () => router.push("/clients/new"),
      description: "Нов клиент",
    },
    // Settings
    {
      key: "s",
      alt: true,
      handler: () => router.push("/settings"),
      description: "Настройки",
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    ) {
      return;
    }

    if (event.defaultPrevented || event.isComposing) return;

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [router]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  return shortcuts;
}

// Hook for custom shortcuts on specific pages
export function useCustomShortcut(
  key: string,
  handler: ShortcutHandler,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.defaultPrevented || event.isComposing) return;

      const ctrlMatch = options.ctrl ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = !event.metaKey;
      const shiftMatch = options.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = options.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();

      if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, handler, options]);
}

// Keyboard shortcuts help modal content
export const shortcutsHelp = [
  {
    category: "Навигация",
    shortcuts: [
      { keys: ["Alt", "D"], description: "Табло" },
      { keys: ["Alt", "I"], description: "Фактури" },
      { keys: ["Alt", "C"], description: "Клиенти" },
      { keys: ["Alt", "P"], description: "Продукти" },
    ],
  },
  {
    category: "Създаване",
    shortcuts: [
      { keys: ["Alt", "N"], description: "Нова фактура" },
      { keys: ["Alt", "Shift", "N"], description: "Нов клиент" },
    ],
  },
  {
    category: "Действия",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Търсене" },
      { keys: ["Alt", "S"], description: "Настройки" },
      { keys: ["Esc"], description: "Затвори" },
    ],
  },
];
