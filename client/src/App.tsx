import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import SimplifiedAuthPage from "@/pages/simplified-auth";
import CharactersPage from "@/pages/characters-page";
import CharacterCreation from "@/pages/character-creation";
import CharacterDetail from "@/pages/character-detail";
import CampaignCreation from "@/pages/campaign-creation";
import CampaignPage from "@/pages/campaign-book";
import LearnPage from "@/pages/learn-page";
import SocialPage from "@/pages/social-page";
import SettingsPage from "@/pages/settings-page";
import ProfilePage from "@/pages/profile-page";
import TavernLobby from "@/pages/tavern-lobby";
import TavernBoard from "@/pages/tavern-board";
import AdminDashboard from "@/pages/admin-dashboard";
import AboutPage from "@/pages/about-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  // For superuser, redirect to admin dashboard as landing page
  if (user?.role === "superuser" && window.location.pathname === "/") {
    return <Redirect to="/admin" />;
  }
  
  return (
    <Switch>
      <Route path="/auth" component={SimplifiedAuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/tavern" component={TavernLobby} />
      <ProtectedRoute path="/tavern-board" component={TavernBoard} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/characters" component={CharactersPage} />
      <ProtectedRoute path="/characters/create" component={CharacterCreation} />
      <ProtectedRoute path="/characters/:id" component={CharacterDetail} />
      <ProtectedRoute path="/campaigns/create" component={CampaignCreation} />
      <ProtectedRoute path="/campaigns/:id" component={CampaignPage} />
      <ProtectedRoute path="/learn" component={LearnPage} />
      <ProtectedRoute path="/about" component={AboutPage} />
      <ProtectedRoute path="/social" component={SocialPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="quest-tavern-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
