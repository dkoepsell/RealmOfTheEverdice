import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Campaign, Character } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  CalendarDays, 
  Users, 
  Map, 
  ScrollText, 
  Crown, 
  UserCog, 
  Plus, 
  RefreshCcw,
  Send,
  ArrowRight,
  Trash2
} from "lucide-react";

export function CampaignsDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  
  // Fetch user's campaigns
  const { 
    data: campaigns, 
    isLoading: campaignsLoading,
    refetch: refetchCampaigns
  } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });
  
  // Fetch user's characters to link them to campaigns
  const { 
    data: characters, 
    isLoading: charactersLoading
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });
  
  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      try {
        const response = await apiRequest("DELETE", `/api/campaigns/${campaignId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete campaign");
        }
        return await response.json();
      } catch (error) {
        console.error("Campaign deletion error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: "The campaign was successfully deleted.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setCampaignToDelete(null);
      // Redirect to campaigns list to prevent staying on a non-existent campaign page
      navigate("/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Campaign",
        description: error?.message || "There was an error deleting the campaign. Please try again.",
        variant: "destructive",
      });
      // Close dialog even on error
      setCampaignToDelete(null);
    }
  });
  
  const handleDeleteCampaign = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setCampaignToDelete(campaign);
  };
  
  const confirmDeleteCampaign = () => {
    if (campaignToDelete) {
      deleteCampaignMutation.mutate(campaignToDelete.id);
    }
  };
  
  const handleCampaignClick = (campaignId: number) => {
    navigate(`/campaigns/${campaignId}`);
  };
  
  // For now, consider all campaigns as active since we don't have an isPublic flag
  const joinableCampaigns: Campaign[] = []; // This would be campaigns from other DMs that are public
  const activeCampaigns = campaigns || [];
  
  const renderActiveCampaigns = () => {
    if (campaignsLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-accent/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-accent/20 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-accent/10 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-accent/20 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (!activeCampaigns || activeCampaigns.length === 0) {
      return (
        <div className="text-center py-8">
          <ScrollText className="mx-auto h-12 w-12 text-accent/50 mb-4" />
          <h3 className="text-xl font-medieval mb-2">No Active Adventures</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">You haven't joined any campaigns yet. Create your own or join an existing one!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/campaigns/create")}>
              <Plus className="mr-2 h-4 w-4" /> Create New Campaign
            </Button>
            <Button variant="outline" onClick={() => document.getElementById("joinable-tab")?.click()}>
              <Users className="mr-2 h-4 w-4" /> Find Campaigns to Join
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeCampaigns.map((campaign) => (
          <Card key={campaign.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-medieval">{campaign.name}</CardTitle>
                <Badge variant={campaign.dmId ? "secondary" : "outline"}>
                  {campaign.dmId ? (
                    <span className="flex items-center">
                      <UserCog className="mr-1 h-3 w-3" /> DM Mode
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Users className="mr-1 h-3 w-3" /> Player
                    </span>
                  )}
                </Badge>
              </div>
              <CardDescription className="flex items-center">
                <Map className="h-3 w-3 mr-1" /> {campaign.setting || "Fantasy World"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-3">
                <p className="line-clamp-2 text-sm">
                  {campaign.description || "No description available."}
                </p>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" /> 
                  {/* Would use campaign.playerCount once implemented */}
                  1-5 players
                </div>
                <div className="flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1" /> 
                  Started {new Date(campaign.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button 
                  className="w-full font-medieval"
                  onClick={() => handleCampaignClick(campaign.id)}
                >
                  <ScrollText className="mr-2 h-4 w-4" /> Continue Adventure
                </Button>
                
                {/* Only show delete button if user is the DM */}
                {campaign.dmId && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => handleDeleteCampaign(campaign, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex items-center justify-center mt-2">
                      <Badge variant="outline" className="cursor-help">
                        Party: {campaign.name || "Unnamed Party"}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is your party's name in this campaign</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        ))}
        
        {/* Create Campaign Card */}
        <Card className="border-dashed border-accent/50 hover:border-accent transition-colors">
          <CardHeader className="pb-2">
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Start a new adventure</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Plus className="h-12 w-12 text-accent/50 mb-2" />
            <p className="text-center text-muted-foreground">
              Create a new campaign and invite your friends to join
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/campaigns/create")}
            >
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  const renderJoinableCampaigns = () => {
    if (campaignsLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-accent/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-accent/20 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-accent/10 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-accent/20 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    // In a real app, these would be campaigns from other DMs that are joinable
    // For now, we'll just show a message
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-accent/50 mb-4" />
        <h3 className="text-xl font-medieval mb-2">Find Adventures</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          You can browse campaigns that are open for new players or check your invitations.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="default" onClick={() => navigate("/social")}>
            <Users className="mr-2 h-4 w-4" /> View Invitations
          </Button>
          <Button variant="outline" onClick={() => refetchCampaigns()}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh List
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Delete Campaign Confirmation Dialog */}
      <Dialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {campaignToDelete?.name}? This action cannot be undone.
              All campaign data, adventures, and logs will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setCampaignToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCampaign}
              disabled={deleteCampaignMutation.isPending}
            >
              {deleteCampaignMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                <>Delete Campaign</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="bg-gradient-to-b from-accent/10 to-background rounded-lg p-4 md:p-6 mb-8 border border-accent/20">
        <h2 className="text-2xl font-medieval text-primary mb-2">Your D&D Adventures</h2>
        <p className="text-muted-foreground mb-4">
          Continue your existing campaigns or join new ones
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" onClick={() => navigate("/campaigns/create")} className="sm:text-lg">
            <Plus className="mr-2 h-5 w-5" /> Create New Campaign
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/characters")} className="sm:text-lg">
            <ArrowRight className="mr-2 h-5 w-5" /> Manage Characters
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-accent/20 w-full grid grid-cols-2">
          <TabsTrigger value="active" className="text-base py-3">
            <ScrollText className="mr-2 h-4 w-4" /> Active Campaigns
          </TabsTrigger>
          <TabsTrigger value="joinable" id="joinable-tab" className="text-base py-3">
            <Users className="mr-2 h-4 w-4" /> Find Campaigns
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medieval text-secondary">Your Campaigns</h2>
            <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          
          {renderActiveCampaigns()}
        </TabsContent>
        
        <TabsContent value="joinable" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medieval text-secondary">Available Campaigns</h2>
            <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          
          {renderJoinableCampaigns()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CampaignsDashboard;