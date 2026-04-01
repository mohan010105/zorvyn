import { Link, useLocation } from "wouter";
import { useRole } from "./role-provider";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TransactionModal } from "@/components/transaction-modal";
import { useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  LineChart, 
  Moon, 
  Sun,
  Wallet,
  Menu,
  Plus
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { role, setRole } = useRole();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
    { href: "/insights", label: "Insights", icon: LineChart },
  ];

  const pageTitle = location === "/" 
    ? "Dashboard" 
    : location.substring(1).charAt(0).toUpperCase() + location.substring(2);

  const handleQuickAddSuccess = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Wallet className="h-6 w-6 text-primary mr-2" />
          <span className="font-semibold text-lg tracking-tight">Coffer</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Role badge in sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
            <div className={`h-2 w-2 rounded-full ${role === 'Admin' ? 'bg-primary' : 'bg-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">Logged in as <span className="font-medium text-foreground">{role}</span></span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-card sticky top-0 z-30">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold hidden sm:block">
              {pageTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={role} onValueChange={(val: "Viewer" | "Admin") => setRole(val)}>
              <SelectTrigger className="w-[120px] h-9 bg-background">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating Quick Add Button (Admin only) */}
      <AnimatePresence>
        {role === "Admin" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-3 shadow-lg shadow-primary/30 font-medium text-sm hover:bg-primary/90 transition-colors"
              aria-label="Quick add transaction"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Quick Add</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        transactionId={null}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}
