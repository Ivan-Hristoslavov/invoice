"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Users, 
  Building, 
  Package, 
  Settings, 
  LayoutDashboard,
  Plus,
  Search,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Command
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category: "navigation" | "create" | "settings" | "actions";
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {
    isLoadingUsage,
    canCreateInvoice,
    canCreateCompany,
    canCreateClient,
    canCreateProduct,
  } = useSubscriptionLimit();

  const commands: CommandItem[] = React.useMemo(() => {
    const createCommands: CommandItem[] = [];
    if (!isLoadingUsage) {
      if (canCreateInvoice) {
        createCommands.push({
          id: "new-invoice",
          title: "Нова фактура",
          description: "Създай нова фактура",
          icon: Plus,
          action: () => router.push("/invoices/new"),
          keywords: ["new", "create", "invoice", "нова", "създай", "фактура"],
          category: "create",
        });
      }
      if (canCreateClient) {
        createCommands.push({
          id: "new-client",
          title: "Нов клиент",
          description: "Добави нов клиент",
          icon: Plus,
          action: () => router.push("/clients/new"),
          keywords: ["new", "create", "client", "нов", "добави", "клиент"],
          category: "create",
        });
      }
      if (canCreateCompany) {
        createCommands.push({
          id: "new-company",
          title: "Нова компания",
          description: "Добави нова компания",
          icon: Plus,
          action: () => router.push("/companies/new"),
          keywords: ["new", "create", "company", "нова", "добави", "компания"],
          category: "create",
        });
      }
      if (canCreateProduct) {
        createCommands.push({
          id: "new-product",
          title: "Нов продукт",
          description: "Добави нов продукт",
          icon: Plus,
          action: () => router.push("/products/new"),
          keywords: ["new", "create", "product", "нов", "добави", "продукт"],
          category: "create",
        });
      }
    }

    return [
    // Navigation
    {
      id: "dashboard",
      title: "Табло",
      description: "Отиди на таблото",
      icon: LayoutDashboard,
      action: () => router.push("/dashboard"),
      keywords: ["dashboard", "home", "начало"],
      category: "navigation",
    },
    {
      id: "invoices",
      title: "Фактури",
      description: "Виж всички фактури",
      icon: FileText,
      action: () => router.push("/invoices"),
      keywords: ["invoices", "фактури", "bills"],
      category: "navigation",
    },
    {
      id: "clients",
      title: "Клиенти",
      description: "Виж всички клиенти",
      icon: Users,
      action: () => router.push("/clients"),
      keywords: ["clients", "клиенти", "customers"],
      category: "navigation",
    },
    {
      id: "companies",
      title: "Компании",
      description: "Виж всички компании",
      icon: Building,
      action: () => router.push("/companies"),
      keywords: ["companies", "компании", "фирми"],
      category: "navigation",
    },
    {
      id: "products",
      title: "Продукти",
      description: "Виж всички продукти",
      icon: Package,
      action: () => router.push("/products"),
      keywords: ["products", "продукти", "услуги"],
      category: "navigation",
    },
    ...createCommands,
    // Settings
    {
      id: "settings",
      title: "Настройки",
      description: "Фактури, компания, абонамент",
      icon: Settings,
      action: () => router.push("/settings/invoice-preferences"),
      keywords: ["settings", "настройки", "preferences"],
      category: "settings",
    },
    {
      id: "profile",
      title: "Профил",
      description: "Редактирай профила си",
      icon: Users,
      action: () => router.push("/settings/profile"),
      keywords: ["profile", "профил", "account"],
      category: "settings",
    },
    {
      id: "help",
      title: "Помощ",
      description: "Отвори помощния център",
      icon: HelpCircle,
      action: () => router.push("/help"),
      keywords: ["help", "помощ", "support"],
      category: "settings",
    },
    // Actions
    {
      id: "toggle-theme",
      title: theme === "dark" ? "Светла тема" : "Тъмна тема",
      description: "Смени темата на приложението",
      icon: theme === "dark" ? Sun : Moon,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
      keywords: ["theme", "тема", "dark", "light", "тъмна", "светла"],
      category: "actions",
    },
    {
      id: "logout",
      title: "Изход",
      description: "Излез от акаунта си",
      icon: LogOut,
      action: () => signOut({ callbackUrl: "/" }),
      keywords: ["logout", "signout", "изход", "излез"],
      category: "actions",
    },
  ];
  }, [router, theme, setTheme, isLoadingUsage, canCreateInvoice, canCreateCompany, canCreateClient, canCreateProduct]);

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter((command) => {
      const titleMatch = command.title.toLowerCase().includes(searchLower);
      const descriptionMatch = command.description?.toLowerCase().includes(searchLower);
      const keywordMatch = command.keywords?.some(k => k.toLowerCase().includes(searchLower));
      return titleMatch || descriptionMatch || keywordMatch;
    });
  }, [commands, search]);

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      create: [],
      settings: [],
      actions: [],
    };
    
    filteredCommands.forEach((command) => {
      groups[command.category].push(command);
    });
    
    return groups;
  }, [filteredCommands]);

  const categoryLabels: Record<string, string> = {
    navigation: "Навигация",
    create: "Създаване",
    settings: "Настройки",
    actions: "Действия",
  };

  // Reset selection when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when open; handle Escape and click outside
  React.useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = filteredCommands[selectedIndex];
      if (command) {
        command.action();
        onOpenChange(false);
      }
    }
  };

  const executeCommand = (command: CommandItem) => {
    command.action();
    onOpenChange(false);
  };

  let currentIndex = 0;

  const panel = (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4 pb-4"
      role="dialog"
      aria-modal="true"
      aria-label="Команден панел"
    >
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center border-b px-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 opacity-50 mr-1.5" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Търси команди..."
            className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-hidden placeholder:text-muted-foreground/45 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Затвори"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {filteredCommands.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Няма намерени резултати.
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={category} className="mb-1">
                  <div className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {categoryLabels[category]}
                  </div>
                  {items.map((command) => {
                    const itemIndex = currentIndex++;
                    const isSelected = itemIndex === selectedIndex;
                    
                    return (
                      <button
                        key={command.id}
                        onClick={() => executeCommand(command)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors",
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        <command.icon className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isSelected ? "text-primary-foreground" : "text-muted-foreground"
                        )} />
                        <div className="min-w-0 flex-1 truncate">
                          <span className="font-semibold">{command.title}</span>
                          {command.description && (
                            <span className={cn(
                              "ml-1.5 text-[11px]",
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              · {command.description}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        
        <div className="flex shrink-0 items-center justify-between border-t bg-muted/50 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 select-none items-center rounded border bg-muted px-1 font-mono text-[9px]">↑↓</kbd>
            навигация
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 select-none items-center rounded border bg-muted px-1 font-mono text-[9px]">Enter</kbd>
            избор
          </span>
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  return typeof document !== "undefined" ? createPortal(panel, document.body) : null;
}

// Context for Command Palette
const CommandPaletteContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

// Hook to use Command Palette
export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    // Return dummy values when used outside provider (during SSR or initial render)
    return { open: false, setOpen: () => {} };
  }
  return context;
}

// Provider component to wrap the app
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  // Global keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.defaultPrevented || e.isComposing || isEditableTarget) return;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}
