import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth-provider";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import SignIn from "@/pages/signin";
import AuthCallback from "@/pages/auth-callback";
import Dashboard from "@/pages/dashboard";
import ProjectsList from "@/pages/projects/index";
import NewProject from "@/pages/projects/new";
import EditProject from "@/pages/projects/edit";
import AssetsPage from "@/pages/assets";
import CategoriesPage from "@/pages/categories";
import StylesPage from "@/pages/styles";
import TagsPage from "@/pages/tags";
import UsersPage from "@/pages/users";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Checking access...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/signin" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function HashRedirect() {
  if (window.location.hash.includes("access_token")) {
    return <AuthCallback />;
  }
  return <ProtectedRoute component={Dashboard} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/" component={HashRedirect} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/projects/new" component={() => <ProtectedRoute component={NewProject} />} />
      <Route path="/projects/:id/edit" component={() => <ProtectedRoute component={EditProject} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={ProjectsList} />} />
      <Route path="/assets" component={() => <ProtectedRoute component={AssetsPage} />} />
      <Route path="/categories" component={() => <ProtectedRoute component={CategoriesPage} />} />
      <Route path="/styles" component={() => <ProtectedRoute component={StylesPage} />} />
      <Route path="/tags" component={() => <ProtectedRoute component={TagsPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
