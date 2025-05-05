import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import SimplifiedAuthPage from "@/pages/simplified-auth";
import CharacterCreation from "@/pages/character-creation";
import CampaignCreation from "@/pages/campaign-creation";
import CampaignPage from "@/pages/campaign-page";
import LearnPage from "@/pages/learn-page";
import SocialPage from "@/pages/social-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={SimplifiedAuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/characters/create" component={CharacterCreation} />
      <ProtectedRoute path="/campaigns/create" component={CampaignCreation} />
      <ProtectedRoute path="/campaigns/:id" component={CampaignPage} />
      <ProtectedRoute path="/learn" component={LearnPage} />
      <ProtectedRoute path="/social" component={SocialPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
