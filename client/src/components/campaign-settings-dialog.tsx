import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CampaignSettingsDialogProps {
  campaign: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignSettingsDialog({
  campaign,
  open,
  onOpenChange
}: CampaignSettingsDialogProps) {
  const { toast } = useToast();
  
  const [title, setTitle] = useState(campaign?.title || "");
  const [description, setDescription] = useState(campaign?.description || "");
  
  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "PUT",
        `/api/campaigns/${campaign.id}`,
        { title, description }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update campaign");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Updated",
        description: "Campaign settings have been saved successfully.",
        variant: "default",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/campaigns/${campaign.id}`],
      });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to update campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTitle(campaign?.title || "");
      setDescription(campaign?.description || "");
    }
    onOpenChange(open);
  };

  // Update campaign
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCampaignMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-parchment border-accent max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Campaign Settings
          </DialogTitle>
          <DialogDescription>
            Adjust the settings for your campaign.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/80 border-amber-200"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-32 bg-white/80 border-amber-200"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCampaignMutation.isPending}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCampaignMutation.isPending}
            >
              {updateCampaignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}