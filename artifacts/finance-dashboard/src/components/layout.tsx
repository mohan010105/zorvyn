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
  Plus,
  TrendingUp,
  Shield,
  Eye
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
    <div className="min-h-screen bg-mesh flex w-full">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 sidebar-gradient border-r border-border/60 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-sm">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">Coffer</span>
            <span className="block text-[10px] text-muted-foreground -mt-0.5 font-medium">Finance Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <motion.div 
                  whileHover={{ x: 2 }}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer relative ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25' 
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary rounded-xl"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Role badge in sidebar */}
        <div className="p-4 border-t border-border/60">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50">
            {role === 'Admin' 
              ? <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              : <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            }
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium">Current Role</p>
              <p className="text-xs font-semibold text-foreground truncate">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9 rounded-xl" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-none">{pageTitle}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {location === "/" ? "Financial overview" : location === "/transactions" ? "Manage your records" : "Smart financial analysis"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Role selector */}
            <Select value={role} onValueChange={(val: "Viewer" | "Admin") => setRole(val)}>
              <SelectTrigger className="w-[110px] h-9 bg-background/80 backdrop-blur-sm border-border/60 rounded-xl text-sm font-medium">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="Viewer">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    Viewer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dark mode toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl bg-background/60 border border-border/60 hover:bg-muted/70"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm cursor-pointer flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {role === 'Admin' ? 'A' : 'V'}
              </span>
            </div>
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
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-2.5 bg-primary text-primary-foreground rounded-2xl px-5 py-3 shadow-xl shadow-primary/30 font-semibold text-sm hover:shadow-2xl hover:shadow-primary/35 transition-shadow"
              aria-label="Quick add transaction"
            >
              <Plus className="h-4 w-4" />
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
