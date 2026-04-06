import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center space-y-6 shadow-2xl">
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred while rendering this page.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-muted/50 rounded-xl text-left overflow-auto max-h-32 border border-border/40">
                <code className="text-[10px] text-red-500 font-mono break-all capitalize">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <Button 
              onClick={this.handleReset}
              className="w-full h-11 rounded-xl font-semibold shadow-sm shadow-primary/25 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Application
            </Button>
            
            <p className="text-[10px] text-muted-foreground">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
