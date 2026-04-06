import { useState, FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  console.log("[Login] Rendering...");
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const justRegistered = new URLSearchParams(search).get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Password is required.");

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">Coffer</span>
            <span className="block text-xs text-muted-foreground -mt-0.5">Finance Dashboard</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your Coffer account</p>
          </div>

          {justRegistered && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3"
            >
              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Account created! Sign in to continue.</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3"
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-xl bg-background/60 border-border/60 focus:ring-primary/20"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/reset-password">
                  <span className="text-xs text-primary hover:underline cursor-pointer font-medium">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl bg-background/60 border-border/60 pr-10 focus:ring-primary/20"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl font-semibold shadow-sm shadow-primary/25 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : "Sign in"}
            </Button>
          </form>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">Don't have an account? </span>
            <Link href="/signup">
              <span className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                Create account
              </span>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is stored locally and never leaves your device.
        </p>
      </motion.div>
    </div>
  );
}
