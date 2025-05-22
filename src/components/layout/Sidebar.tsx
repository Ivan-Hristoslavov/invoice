"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Package,
  CreditCard,
  Settings,
  Menu,
  X,
  FileCheck,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Detect mobile view
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Skip rendering sidebar completely on auth pages
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Navigation items only shown to authenticated users
  const navItems = [
    { name: "Табло", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Фактури", href: "/invoices", icon: <FileText className="w-5 h-5" /> },
    { name: "Клиенти", href: "/clients", icon: <Users className="w-5 h-5" /> },
    { name: "Компании", href: "/companies", icon: <Building className="w-5 h-5" /> },
    { name: "Продукти", href: "/products", icon: <Package className="w-5 h-5" /> },
    { name: "Плащания", href: "/payments", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Настройки", href: "/settings", icon: <Settings className="w-5 h-5" /> },
    { name: "Данъчно съответствие", href: "/settings/tax-compliance", icon: <FileCheck className="w-5 h-5" /> },
    { name: "Абонамент", href: "/settings/subscription", icon: <CreditCardIcon className="w-5 h-5" /> },
  ];
  
  // Public navigation items shown to everyone
  const publicNavItems = [
    { name: "Функции", href: "/#features", icon: <Package className="w-5 h-5" /> },
    { name: "Ценообразуване", href: "/#pricing", icon: <CreditCardIcon className="w-5 h-5" /> },
  ];

  // If we're on the home page but not authenticated, don't show the sidebar at all
  if (pathname === "/" && !isAuthenticated) {
    return null;
  }

  // Determine which navigation items to show based on authentication status
  const displayNavItems = isAuthenticated ? navItems : publicNavItems;

  // Animation variants
  const sidebarVariants = {
    open: { 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: { 
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const navItemVariants = {
    initial: { 
      opacity: 0,
      x: -20
    },
    animate: (i: number) => ({ 
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    }),
    exit: { 
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    },
    hover: {
      scale: 1.03,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.97
    }
  };

  const activeIndicatorVariants = {
    initial: {
      opacity: 0,
      width: 0
    },
    animate: {
      opacity: 1,
      width: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <>
      {/* Mobile toggle - only show if there are nav items to display */}
      {displayNavItems.length > 0 && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={toggleSidebar}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      )}

      {/* Sidebar */}
      <motion.aside 
        className="fixed top-0 left-0 z-30 h-full w-64 bg-background border-r"
        variants={sidebarVariants}
        initial={isMobile ? "closed" : "open"}
        animate={isMobile ? (isOpen ? "open" : "closed") : "open"}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          <motion.div 
            className="p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
              <motion.span 
                className="text-xl font-bold"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {APP_NAME}
              </motion.span>
            </Link>
          </motion.div>

          {displayNavItems.length > 0 && (
            <nav className="flex-grow px-4 pb-4">
              <ul className="space-y-1">
                {displayNavItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <motion.li 
                      key={item.name}
                      custom={index}
                      variants={navItemVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Link 
                        href={item.href}
                        className={`
                          relative flex items-center px-3 py-2 rounded-md text-sm font-medium 
                          ${isActive 
                            ? 'bg-primary/5 text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                          }
                        `}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.span
                          initial={{ rotate: 0 }}
                          animate={isActive ? { rotate: [0, -10, 10, -5, 5, 0] } : { rotate: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="mr-3"
                        >
                          {item.icon}
                        </motion.span>
                        
                        <span className="relative">
                          {item.name}
                          {isActive && (
                            <motion.span 
                              className="absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full"
                              variants={activeIndicatorVariants}
                              initial="initial"
                              animate="animate"
                            />
                          )}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>
          )}

          <motion.div 
            className="p-4 border-t"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-xs text-muted-foreground">
              <p>{APP_NAME} v1.0.0</p>
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
} 