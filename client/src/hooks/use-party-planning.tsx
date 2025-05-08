import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for party planning
interface PartyPlan {
  id: number;
  campaignId: number;
  title: string;
  description: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string | null;
  items: PartyPlanItem[];
}

interface PartyPlanItem {
  id: number;
  planId: number;
  content: string;
  type: string;
  status: string;
  position: number;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string | null;
  comments?: PartyPlanComment[];
}

interface PartyPlanComment {
  id: number;
  itemId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: {
    username: string;
  };
}

// Define parameter and return types
interface UsePartyPlanningOptions {
  enabled?: boolean;
}

interface UsePartyPlanningReturn {
  plans: PartyPlan[];
  currentPlan: PartyPlan | null;
  isLoading: boolean;
  error: Error | null;
  createPlan: (plan: Omit<PartyPlan, "id" | "createdAt" | "updatedAt" | "items">) => Promise<PartyPlan>;
  deletePlan: (id: number) => Promise<void>;
  createPlanItem: (item: Omit<PartyPlanItem, "id" | "createdAt" | "updatedAt" | "comments" | "status"> & { status?: string }) => Promise<PartyPlanItem>;
  updatePlanItem: (id: number, updates: Partial<PartyPlanItem>) => Promise<void>;
  deletePlanItem: (id: number) => Promise<void>;
  addComment: (comment: Omit<PartyPlanComment, "id" | "createdAt" | "user">) => Promise<PartyPlanComment>;
  setActivePlan: (planId: number) => void;
  connected: boolean;
}

/**
 * Hook for managing party planning functionality with WebSocket integration
 */
export function usePartyPlanning(
  campaignId: number,
  options: UsePartyPlanningOptions = {}
): UsePartyPlanningReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Query for fetching all plans
  const { 
    data: plans = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/plans`],
    enabled: options.enabled !== false
  });
  
  // Find the current plan
  const currentPlan = plans.find(p => p.id === currentPlanId) || null;
  
  // Mutations for CRUD operations
  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<PartyPlan, "id" | "createdAt" | "updatedAt" | "items">) => {
      const response = await apiRequest(
        "POST", 
        `/api/campaigns/${campaignId}/plans`, 
        plan
      );
      return await response.json();
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
      setCurrentPlanId(newPlan.id);
    }
  });
  
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest(
        "DELETE", 
        `/api/campaigns/${campaignId}/plans/${planId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
      if (plans.length > 0 && currentPlanId) {
        // Set to another plan if available
        const otherPlan = plans.find(p => p.id !== currentPlanId);
        if (otherPlan) {
          setCurrentPlanId(otherPlan.id);
        } else {
          setCurrentPlanId(null);
        }
      }
    }
  });
  
  const createPlanItemMutation = useMutation({
    mutationFn: async (item: Omit<PartyPlanItem, "id" | "createdAt" | "updatedAt" | "comments" | "status"> & { status?: string }) => {
      const itemWithStatus = {
        ...item,
        status: item.status || "pending"
      };
      
      const response = await apiRequest(
        "POST", 
        `/api/campaigns/${campaignId}/plans/${item.planId}/items`, 
        itemWithStatus
      );
      return await response.json();
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
      
      // Send WebSocket update
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "ITEM_CREATED",
          data: {
            campaignId,
            planId: newItem.planId,
            item: newItem
          }
        }));
      }
    }
  });
  
  const updatePlanItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<PartyPlanItem> }) => {
      await apiRequest(
        "PATCH", 
        `/api/campaigns/${campaignId}/plans/items/${id}`, 
        updates
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
      
      // Find the item to get its planId
      const plan = plans.find(p => p.items.some(item => item.id === variables.id));
      if (plan && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "ITEM_UPDATED",
          data: {
            campaignId,
            planId: plan.id,
            itemId: variables.id,
            updates: variables.updates
          }
        }));
      }
    }
  });
  
  const deletePlanItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest(
        "DELETE", 
        `/api/campaigns/${campaignId}/plans/items/${itemId}`
      );
    },
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
      
      // Find the item to get its planId
      const plan = plans.find(p => p.items.some(item => item.id === itemId));
      if (plan && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "ITEM_DELETED",
          data: {
            campaignId,
            planId: plan.id,
            itemId
          }
        }));
      }
    }
  });
  
  const addCommentMutation = useMutation({
    mutationFn: async (comment: Omit<PartyPlanComment, "id" | "createdAt" | "user">) => {
      const response = await apiRequest(
        "POST", 
        `/api/campaigns/${campaignId}/plans/items/${comment.itemId}/comments`, 
        comment
      );
      return await response.json();
    },
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
      
      // Find the item to get its planId
      const plan = plans.find(p => p.items.some(item => item.id === newComment.itemId));
      if (plan && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "COMMENT_ADDED",
          data: {
            campaignId,
            planId: plan.id,
            itemId: newComment.itemId,
            comment: newComment
          }
        }));
      }
    }
  });
  
  // WebSocket connection setup
  useEffect(() => {
    if (!campaignId) return;
    
    const setupSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const socket = new WebSocket(`${protocol}//${host}/ws`);
      
      socket.onopen = () => {
        console.log('WebSocket connected for party planning');
        setConnected(true);
        
        // Join the campaign's party planning room
        socket.send(JSON.stringify({
          type: 'JOIN_CAMPAIGN',
          data: { campaignId }
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          switch (message.type) {
            case 'ITEM_CREATED':
            case 'ITEM_UPDATED':
            case 'ITEM_DELETED':
            case 'COMMENT_ADDED':
              // Invalidate the query to refetch the plans
              queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/plans`] });
              break;
              
            default:
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            setupSocket();
          }
        }, 3000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
      
      socketRef.current = socket;
    };
    
    setupSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [campaignId, queryClient]);
  
  // Wrapper functions for the mutations
  const createPlan = useCallback(
    async (plan: Omit<PartyPlan, "id" | "createdAt" | "updatedAt" | "items">) => {
      return await createPlanMutation.mutateAsync(plan);
    },
    [createPlanMutation]
  );
  
  const deletePlan = useCallback(
    async (id: number) => {
      await deletePlanMutation.mutateAsync(id);
    },
    [deletePlanMutation]
  );
  
  const createPlanItem = useCallback(
    async (item: Omit<PartyPlanItem, "id" | "createdAt" | "updatedAt" | "comments" | "status"> & { status?: string }) => {
      return await createPlanItemMutation.mutateAsync(item);
    },
    [createPlanItemMutation]
  );
  
  const updatePlanItem = useCallback(
    async (id: number, updates: Partial<PartyPlanItem>) => {
      await updatePlanItemMutation.mutateAsync({ id, updates });
    },
    [updatePlanItemMutation]
  );
  
  const deletePlanItem = useCallback(
    async (id: number) => {
      await deletePlanItemMutation.mutateAsync(id);
    },
    [deletePlanItemMutation]
  );
  
  const addComment = useCallback(
    async (comment: Omit<PartyPlanComment, "id" | "createdAt" | "user">) => {
      return await addCommentMutation.mutateAsync(comment);
    },
    [addCommentMutation]
  );
  
  const setActivePlan = useCallback((planId: number) => {
    setCurrentPlanId(planId);
  }, []);
  
  return {
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
    setActivePlan,
    connected
  };
}