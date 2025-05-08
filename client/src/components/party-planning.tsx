import { useState, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartyPlanBoard } from "./party-planning-board";
import { useToast } from "@/hooks/use-toast";
import { usePartyPlanning } from "@/hooks/use-party-planning";
import { useAuth } from "@/hooks/use-auth";
import { Character } from "@shared/schema";
import { Loader2, Plus, PlusCircle, ListPlus, CalendarPlus, ClipboardList } from "lucide-react";

interface PartyPlanningProps {
  campaignId: number;
  characters?: Character[];
  isDungeonMaster?: boolean | null;
}

export function PartyPlanning({ 
  campaignId, 
  characters = [], 
  isDungeonMaster = false 
}: PartyPlanningProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  // Determine if user is DM based on props
  const isCampaignDm = isDungeonMaster === true;
  
  const {
    plans,
    currentPlan,
    isLoading,
    error,
    createPlan,
    deletePlan,
    createPlanItem,
    updatePlanItem,
    deletePlanItem,
    addComment,
    setActivePlan
  } = usePartyPlanning(campaignId, { enabled: !!campaignId });

  // Select the first plan by default when plans load
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
      setActivePlan(plans[0].id);
    }
  }, [plans, selectedPlanId, setActivePlan]);

  // Handle creating a new plan
  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title for the plan",
        variant: "destructive"
      });
      return;
    }

    try {
      await createPlan({
        campaignId,
        title: newPlanTitle,
        description: newPlanDescription,
        createdById: user!.id
      });
      
      setNewPlanTitle("");
      setNewPlanDescription("");
      setShowNewPlanDialog(false);
      
      toast({
        title: "Plan created",
        description: "Your new plan has been created successfully."
      });
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Failed to create plan",
        description: "There was an error creating your plan. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle changing the selected plan
  const handlePlanChange = (planId: string) => {
    const id = parseInt(planId);
    setSelectedPlanId(id);
    setActivePlan(id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error loading party plans: {error.message}</p>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-md border-amber-200/40">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/30 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-serif text-amber-900">Party Planning Board</CardTitle>
            <CardDescription>Collaborate on quest preparations and party tasks</CardDescription>
          </div>
          <Button 
            onClick={() => setShowNewPlanDialog(true)}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            <Plus className="mr-1 h-4 w-4" /> New Plan
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {plans.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Label htmlFor="planSelect">Select Plan</Label>
                <Select 
                  value={selectedPlanId?.toString() || ""} 
                  onValueChange={handlePlanChange}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentPlan && (
                <div className="flex space-x-1 text-sm text-muted-foreground">
                  <span>Created: {new Date(currentPlan.createdAt).toLocaleDateString()}</span>
                  {currentPlan.updatedAt && (
                    <span>· Last updated: {new Date(currentPlan.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
            
            {currentPlan && (
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-2">{currentPlan.title}</h3>
                {currentPlan.description && (
                  <p className="text-muted-foreground mb-4">{currentPlan.description}</p>
                )}
                
                <PartyPlanBoard 
                  plan={currentPlan}
                  onCreateItem={createPlanItem}
                  onUpdateItem={updatePlanItem}
                  onDeleteItem={deletePlanItem}
                  onAddComment={addComment}
                  userId={user!.id}
                  isDungeonMaster={isCampaignDm}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <ClipboardList className="h-16 w-16 text-amber-300" />
            <h3 className="text-lg font-medium">No plans yet</h3>
            <p className="text-muted-foreground">
              Create your first plan to organize your party's quests and tasks.
            </p>
            <Button 
              onClick={() => setShowNewPlanDialog(true)}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* New Plan Dialog */}
      <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Organize tasks, supplies, and preparations for your next adventure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-title">Plan Title</Label>
              <Input
                id="plan-title"
                placeholder="e.g., Preparing for the Dragon's Lair"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plan-description">Description (Optional)</Label>
              <Textarea
                id="plan-description"
                placeholder="Describe what this plan is for..."
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewPlanDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}