import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertPartyPlan, InsertPartyPlanItem, InsertPartyPlanComment, PartyPlan, PartyPlanItem } from "@shared/schema";

export function usePartyPlanning(campaignId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all party plans for a campaign
  const {
    data: partyPlans = [],
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans
  } = useQuery<PartyPlan[]>({
    queryKey: ['/api/campaigns', campaignId, 'party-plans'],
    enabled: !!campaignId,
  });

  // Get items for a specific plan
  const getPartyPlanItems = (planId: number) => {
    return useQuery<PartyPlanItem[]>({
      queryKey: ['/api/party-plans', planId, 'items'],
      enabled: !!planId,
    });
  };

  // Create a new party plan
  const createPlanMutation = useMutation({
    mutationFn: async (plan: InsertPartyPlan) => {
      const response = await apiRequest('POST', `/api/campaigns/${campaignId}/party-plans`, plan);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
      toast({
        title: "Plan Created",
        description: "Your party plan has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create party plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update an existing party plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, data }: { planId: number; data: Partial<PartyPlan> }) => {
      const response = await apiRequest('PUT', `/api/party-plans/${planId}`, data);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
      toast({
        title: "Plan Updated",
        description: "The party plan has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update party plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete a party plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest('DELETE', `/api/party-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
      toast({
        title: "Plan Deleted",
        description: "The party plan has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete party plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create a party plan item
  const createItemMutation = useMutation({
    mutationFn: async ({ planId, item }: { planId: number; item: InsertPartyPlanItem }) => {
      const response = await apiRequest('POST', `/api/party-plans/${planId}/items`, item);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/party-plans', variables.planId, 'items'] });
      
      // Send real-time update via WebSocket
      if (window.partyPlanningSocket?.readyState === WebSocket.OPEN) {
        window.partyPlanningSocket.send(JSON.stringify({
          type: 'planning',
          action: 'item_created',
          campaignId,
          planId: variables.planId,
          timestamp: new Date()
        }));
      }
      
      toast({
        title: "Item Added",
        description: "New item added to the party plan.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update a party plan item
  const updateItemMutation = useMutation({
    mutationFn: async ({ 
      planId, 
      itemId, 
      data 
    }: { 
      planId: number; 
      itemId: number; 
      data: Partial<PartyPlanItem> 
    }) => {
      const response = await apiRequest('PUT', `/api/party-plans/${planId}/items/${itemId}`, data);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/party-plans', variables.planId, 'items'] });
      
      // Send real-time update via WebSocket
      if (window.partyPlanningSocket?.readyState === WebSocket.OPEN) {
        window.partyPlanningSocket.send(JSON.stringify({
          type: 'planning',
          action: 'item_updated',
          campaignId,
          planId: variables.planId,
          itemId: variables.itemId,
          timestamp: new Date()
        }));
      }
      
      toast({
        title: "Item Updated",
        description: "The item has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete a party plan item
  const deleteItemMutation = useMutation({
    mutationFn: async ({ planId, itemId }: { planId: number; itemId: number }) => {
      await apiRequest('DELETE', `/api/party-plans/${planId}/items/${itemId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/party-plans', variables.planId, 'items'] });
      
      // Send real-time update via WebSocket
      if (window.partyPlanningSocket?.readyState === WebSocket.OPEN) {
        window.partyPlanningSocket.send(JSON.stringify({
          type: 'planning',
          action: 'item_deleted',
          campaignId,
          planId: variables.planId,
          itemId: variables.itemId,
          timestamp: new Date()
        }));
      }
      
      toast({
        title: "Item Deleted",
        description: "The item has been removed from the party plan.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add a comment to an item
  const addCommentMutation = useMutation({
    mutationFn: async ({ 
      planId, 
      itemId, 
      comment 
    }: { 
      planId: number; 
      itemId: number; 
      comment: InsertPartyPlanComment 
    }) => {
      const response = await apiRequest('POST', `/api/party-plans/${planId}/items/${itemId}/comments`, comment);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/party-plans', variables.planId, 'items'] });
      
      // Send real-time update via WebSocket
      if (window.partyPlanningSocket?.readyState === WebSocket.OPEN) {
        window.partyPlanningSocket.send(JSON.stringify({
          type: 'planning',
          action: 'comment_added',
          campaignId,
          planId: variables.planId,
          itemId: variables.itemId,
          timestamp: new Date()
        }));
      }
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the item.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    // Queries
    partyPlans,
    isLoadingPlans,
    plansError,
    refetchPlans,
    getPartyPlanItems,
    
    // Mutations
    createPlanMutation,
    updatePlanMutation,
    deletePlanMutation,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    addCommentMutation,
  };
}

// Add property to Window interface for TypeScript
declare global {
  interface Window {
    partyPlanningSocket?: WebSocket;
  }
}