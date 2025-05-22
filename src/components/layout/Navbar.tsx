"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bell, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AnimatedIcon } from "@/components/animation/AnimatedIcon";
import { motion } from "framer-motion";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  
  // Skip rendering navbar on auth pages
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  // Navbar animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  // If we're on the home page but not authenticated, only show minimal navbar
  if (pathname === "/" && !isAuthenticated) {
    return (
      <motion.header 
        className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur border-b"
        initial="hidden"
        animate="visible"
        variants={navbarVariants}
      >
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div>
            {/* Empty div for spacing */}
          </div>
          <motion.div className="flex items-center gap-2" variants={itemVariants}>
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Вход</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" asChild>
                <Link href="/signup">Регистрация</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>
    );
  }

  // Only show create invoice button on relevant pages
  const showCreateButton = isAuthenticated && (
    pathname === "/dashboard" || 
    pathname === "/invoices" || 
    pathname.startsWith("/invoices/")
  );

  return (
    <motion.header 
      className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur border-b"
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="hidden md:block w-64">
          {/* Placeholder for sidebar alignment */}
        </div>

        <motion.div className="w-full md:w-auto flex items-center justify-end flex-1 gap-4" variants={itemVariants}>
          {showCreateButton && (
            <motion.div 
              whileHover={{ 
                scale: 1.05,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }} 
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              <Button size="sm" asChild>
                <Link href="/invoices/new">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Нова Фактура
                </Link>
              </Button>
            </motion.div>
          )}

          {isAuthenticated ? (
            <motion.div 
              className="flex items-center gap-4" 
              variants={itemVariants}
            >
              <ThemeToggle />
              
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <motion.span 
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: [0.5, 1.2, 1],
                      opacity: 1,
                      transition: { duration: 0.3 } 
                    }}
                  ></motion.span>
                </Button>
              </motion.div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <motion.div 
                    className="px-2 py-1.5"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-sm font-medium">
                      {session.user.name || session.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </motion.div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Профил</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Настройки</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Изход
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div 
              className="flex items-center gap-2"
              variants={itemVariants}
            >
              <ThemeToggle />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Вход</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" asChild>
                  <Link href="/signup">Регистрация</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
} 