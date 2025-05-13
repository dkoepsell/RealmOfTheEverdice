import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { GameArea, GameAreaProps } from "./game-area";

// Extended component that adds NPC action functionality when user is DM
export function GameAreaWithNpcActions(props: GameAreaProps) {
  const { toast } = useToast();
  const [isProcessingNpcActions, setIsProcessingNpcActions] = useState(false);
  
  // Mutation for triggering NPC actions
  const triggerNpcActionsMutation = useMutation({
    mutationFn: async () => {
      const campaignId = props.campaign?.id;
      if (!campaignId) throw new Error("Campaign ID not found");
      
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/npcs/actions`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate game logs cache to show new NPC actions
      if (props.campaign?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${props.campaign.id}/logs`] });
      }
      
      // Add any returned logs directly
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach(log => {
          if (props.onAddGameLog) {
            props.onAddGameLog(log);
          }
        });
      }
      
      toast({
        title: "NPC actions processed",
        description: `${data.actionsCount || 0} NPC action(s) were processed successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process NPC actions",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessingNpcActions(false);
    }
  });
  
  const handleTriggerNpcActions = () => {
    setIsProcessingNpcActions(true);
    triggerNpcActionsMutation.mutate();
  };
  
  return (
    <div className="relative">
      <GameArea {...props} />
      
      {/* Only show NPC action button if user is DM */}
      {props.isDm && (
        <div className="absolute bottom-4 right-4">
          <Button 
            onClick={handleTriggerNpcActions}
            disabled={isProcessingNpcActions}
            variant="outline"
            className="bg-amber-50 hover:bg-amber-100 border-amber-700 text-amber-900"
          >
            {isProcessingNpcActions ? "Processing NPC Actions..." : "Trigger NPC Actions"}
          </Button>
        </div>
      )}
    </div>
  );
}