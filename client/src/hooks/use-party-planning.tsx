import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export type PlanItemStatus = 'pending' | 'in_progress' | 'completed';

export interface PlanItem {
  id: string;
  title: string;
  description: string;
  status: PlanItemStatus;
  assignedTo?: string; // Character ID or name
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanningAction {
  action: 'add' | 'update' | 'remove' | 'assign' | 'status_change';
  planId?: string;
  planData?: PlanItem;
}

export interface UsePartyPlanningOptions {
  campaignId: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onPlanUpdate?: (items: PlanItem[]) => void;
}

export function usePartyPlanning({ 
  campaignId, 
  onConnect, 
  onDisconnect,
  onPlanUpdate 
}: UsePartyPlanningOptions) {
  const [connected, setConnected] = useState(false);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!campaignId || !user) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      // Join the campaign chat room
      ws.send(JSON.stringify({
        type: 'join',
        campaignId: campaignId
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle connection confirmation
        if (data.type === 'join_confirm') {
          setConnected(true);
          setLoading(false);
          if (onConnect) onConnect();
        }
        
        // Handle planning updates
        if (data.type === 'planning') {
          handlePlanningUpdate(data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      setConnected(false);
      if (onDisconnect) onDisconnect();
      
      // You might want to attempt reconnection here
      toast({
        title: 'Connection Lost',
        description: 'Party planning connection lost. Reconnecting...',
        variant: 'destructive',
      });
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [campaignId, user, toast, onConnect, onDisconnect]);
  
  // Handle planning updates received from server
  const handlePlanningUpdate = useCallback((data: any) => {
    if (!data.action || !data.planData) return;
    
    // Different actions to handle
    switch (data.action) {
      case 'add':
        setPlanItems(prev => [...prev, data.planData]);
        break;
        
      case 'update':
        setPlanItems(prev => 
          prev.map(item => 
            item.id === data.planId ? { ...item, ...data.planData } : item
          )
        );
        break;
        
      case 'remove':
        setPlanItems(prev => prev.filter(item => item.id !== data.planId));
        break;
        
      case 'assign':
        setPlanItems(prev => 
          prev.map(item => 
            item.id === data.planId ? { ...item, assignedTo: data.planData.assignedTo } : item
          )
        );
        break;
        
      case 'status_change':
        setPlanItems(prev => 
          prev.map(item => 
            item.id === data.planId ? { ...item, status: data.planData.status } : item
          )
        );
        break;
        
      default:
        console.warn('Unknown planning action:', data.action);
    }
    
    // Call the onPlanUpdate callback if provided
    if (onPlanUpdate) {
      onPlanUpdate(planItems);
    }
  }, [planItems, onPlanUpdate]);
  
  // Send planning actions to server
  const sendPlanningAction = useCallback((planningAction: PlanningAction) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !user) {
      toast({
        title: 'Connection Error',
        description: 'Could not send planning data. Please check your connection.',
        variant: 'destructive',
      });
      return false;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'planning',
      action: planningAction.action,
      planId: planningAction.planId,
      planData: planningAction.planData,
      userId: user.id,
      username: user.username,
      campaignId: campaignId
    }));
    
    return true;
  }, [campaignId, user, toast]);
  
  // Add a new plan item
  const addPlanItem = useCallback((title: string, description: string) => {
    if (!user) return false;
    
    const newItem: PlanItem = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'pending',
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return sendPlanningAction({
      action: 'add',
      planData: newItem
    });
  }, [user, sendPlanningAction]);
  
  // Update an existing plan item
  const updatePlanItem = useCallback((id: string, updates: Partial<PlanItem>) => {
    const item = planItems.find(i => i.id === id);
    
    if (!item) {
      console.error('Cannot update non-existent plan item');
      return false;
    }
    
    return sendPlanningAction({
      action: 'update',
      planId: id,
      planData: {
        ...item,
        ...updates,
        updatedAt: new Date()
      }
    });
  }, [planItems, sendPlanningAction]);
  
  // Remove a plan item
  const removePlanItem = useCallback((id: string) => {
    return sendPlanningAction({
      action: 'remove',
      planId: id
    });
  }, [sendPlanningAction]);
  
  // Assign a plan item to a character
  const assignPlanItem = useCallback((id: string, characterId: string) => {
    return sendPlanningAction({
      action: 'assign',
      planId: id,
      planData: {
        assignedTo: characterId,
        updatedAt: new Date()
      } as any
    });
  }, [sendPlanningAction]);
  
  // Change the status of a plan item
  const changePlanItemStatus = useCallback((id: string, status: PlanItemStatus) => {
    return sendPlanningAction({
      action: 'status_change',
      planId: id,
      planData: {
        status,
        updatedAt: new Date()
      } as any
    });
  }, [sendPlanningAction]);
  
  return {
    connected,
    loading,
    planItems,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    assignPlanItem,
    changePlanItemStatus
  };
}