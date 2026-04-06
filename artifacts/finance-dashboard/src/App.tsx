import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { RoleProvider } from "@/components/role-provider";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { BudgetProvider } from "@/context/budget-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Insights from "@/pages/insights";
import BudgetPage from "@/pages/budget";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ResetPassword from "@/pages/reset-password";

import { TransactionProvider } from "@/context/transaction-context";
import UploadPage from "@/pages/upload";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log("[AppRoutes] Rendering routes, auth state:", { isAuthenticated, isLoading });
  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/signup">
        {isAuthenticated ? <Redirect to="/" /> : <Signup />}
      </Route>
      <Route path="/reset-password">
        {isAuthenticated ? <Redirect to="/" /> : <ResetPassword />}
      </Route>

      <Route>
        <ProtectedRoute>
          <Layout>
            <Switch>
              <Route path="/"><Dashboard /></Route>
              <Route path="/transactions"><Transactions /></Route>
              <Route path="/insights"><Insights /></Route>
              <Route path="/budget"><BudgetPage /></Route>
              <Route path="/upload"><UploadPage /></Route>
              <Route><NotFound /></Route>
            </Switch>
          </Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RoleProvider>
              <TransactionProvider>
                <BudgetProvider>
                  <TooltipProvider>
                    <WouterRouter base={(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}>
                      <AppRoutes />
                    </WouterRouter>
                    <Toaster />
                  </TooltipProvider>
                </BudgetProvider>
              </TransactionProvider>
            </RoleProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
