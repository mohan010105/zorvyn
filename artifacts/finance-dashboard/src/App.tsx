import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { RoleProvider } from "@/components/role-provider";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { BudgetProvider } from "@/context/budget-context";
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

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

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

      <Route path="/">
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <Layout><Transactions /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/insights">
        <ProtectedRoute>
          <Layout><Insights /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/budget">
        <ProtectedRoute>
          <Layout><BudgetPage /></Layout>
        </ProtectedRoute>
      </Route>

      <Route>
        <ProtectedRoute>
          <Layout><NotFound /></Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <RoleProvider>
          <BudgetProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppRoutes />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
          </BudgetProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
