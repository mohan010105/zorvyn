import { useState, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPassword() {
  console.log("[ResetPassword] Rendering...");
  const { resetPassword } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (newPassword.length < 6) return setError("New password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setIsLoading(true);
    try {
      await resetPassword(email.trim(), newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed.");
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
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl icon-bg-blue flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
            <p className="text-sm text-muted-foreground">Enter your email and choose a new password</p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4 text-center"
              >
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Password updated!</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecting you to login...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-4">
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
                    <Label htmlFor="email" className="text-sm font-medium">Account Email</Label>
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
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10 rounded-xl bg-background/60 border-border/60 pr-10 focus:ring-primary/20"
                        autoComplete="new-password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10 rounded-xl bg-background/60 border-border/60 pr-10 focus:ring-primary/20"
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {confirmPassword && newPassword === confirmPassword && (
                        <CheckCircle className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      )}
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
                        Updating password...
                      </>
                    ) : "Reset password"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center">
            <Link href="/login">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
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
