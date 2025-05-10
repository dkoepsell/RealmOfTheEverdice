import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePartyPlanning } from "@/hooks/use-party-planning";
import { Plus, PlusCircle, Settings, MoreHorizontal, Edit2, Trash2, CheckCircle, Circle, MessageSquare, User, Calendar, List, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { InsertPartyPlanItem, PartyPlanItem, InsertPartyPlanComment } from "@shared/schema";

// Status badge color mapping
const statusColors = {
  pending: "bg-slate-200 text-slate-800",
  "in-progress": "bg-blue-200 text-blue-800",
  completed: "bg-green-200 text-green-800"
};

// Item type color mapping
const typeColors = {
  task: "bg-amber-100 text-amber-800",
  note: "bg-purple-100 text-purple-800",
  resource: "bg-emerald-100 text-emerald-800",
  strategy: "bg-indigo-100 text-indigo-800"
};

// Item type icons
const typeIcons = {
  task: <CheckCircle className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
  resource: <Calendar className="h-4 w-4" />,
  strategy: <List className="h-4 w-4" />
};

interface PartyPlanningBoardProps {
  campaignId: number;
  users: any[]; // Campaign members
  currentUserId: number;
}

export function PartyPlanningBoard({ campaignId, users, currentUserId }: PartyPlanningBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    partyPlans,
    isLoadingPlans,
    getPartyPlanItems,
    createPlanMutation,
    updatePlanMutation,
    deletePlanMutation,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    addCommentMutation
  } = usePartyPlanning(campaignId);

  // State for plan creation
  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  
  // Selected plan
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  
  // State for item creation
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemType, setNewItemType] = useState("task");
  const [newItemAssignedToId, setNewItemAssignedToId] = useState<number | null>(null);
  
  // Edit item state
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartyPlanItem | null>(null);
  
  // Comment state
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedItemForComment, setSelectedItemForComment] = useState<PartyPlanItem | null>(null);
  const [newComment, setNewComment] = useState("");
  
  // WebSocket for real-time updates
  const socketRef = useRef<WebSocket | null>(null);
  
  // Get items for the active plan
  const { 
    data: planItems = [], 
    isLoading: isLoadingItems,
    refetch: refetchItems
  } = getPartyPlanItems(activePlanId || 0);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!campaignId) return;
    
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Create a new WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({
        type: 'join',
        campaignId: campaignId
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle real-time updates for party planning
        if (data.type === 'planning') {
          if (data.planId === activePlanId) {
            refetchItems();
          }
          
          // Show toast notification for activity
          const username = data.username || 'Someone';
          
          if (data.action === 'item_created') {
            toast({
              title: "New Item Added",
              description: `${username} added a new item to the plan.`,
            });
          } else if (data.action === 'item_updated') {
            toast({
              title: "Item Updated",
              description: `${username} updated an item in the plan.`,
            });
          } else if (data.action === 'item_deleted') {
            toast({
              title: "Item Removed",
              description: `${username} removed an item from the plan.`,
            });
          } else if (data.action === 'comment_added') {
            toast({
              title: "New Comment",
              description: `${username} commented on an item.`,
            });
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    // Store the WebSocket connection
    socketRef.current = ws;
    window.partyPlanningSocket = ws;
    
    return () => {
      ws.close();
    };
  }, [campaignId]);
  
  // Set the first plan as active when plans are loaded
  useEffect(() => {
    if (partyPlans && partyPlans.length > 0 && !activePlanId) {
      setActivePlanId(partyPlans[0].id);
    }
  }, [partyPlans, activePlanId]);
  
  // Handle plan creation
  const handleCreatePlan = () => {
    if (!newPlanTitle) {
      toast({
        title: "Error",
        description: "Plan title is required.",
        variant: "destructive",
      });
      return;
    }
    
    createPlanMutation.mutate({
      campaignId,
      title: newPlanTitle,
      description: newPlanDescription,
      createdById: currentUserId,
      status: "active"
    }, {
      onSuccess: (plan) => {
        setIsCreatePlanDialogOpen(false);
        setNewPlanTitle("");
        setNewPlanDescription("");
        setActivePlanId(plan.id);
      }
    });
  };
  
  // Handle item creation
  const handleCreateItem = () => {
    if (!newItemContent || !activePlanId) {
      toast({
        title: "Error",
        description: "Item content is required.",
        variant: "destructive",
      });
      return;
    }
    
    const newItem: InsertPartyPlanItem = {
      planId: activePlanId,
      content: newItemContent,
      type: newItemType,
      status: "pending",
      createdById: currentUserId,
      position: planItems.length,
      assignedToId: newItemAssignedToId || undefined
    };
    
    createItemMutation.mutate({
      planId: activePlanId,
      item: newItem
    }, {
      onSuccess: () => {
        setIsCreateItemDialogOpen(false);
        setNewItemContent("");
        setNewItemType("task");
        setNewItemAssignedToId(null);
      }
    });
  };
  
  // Handle item update
  const handleUpdateItem = () => {
    if (!editingItem || !activePlanId) return;
    
    updateItemMutation.mutate({
      planId: activePlanId,
      itemId: editingItem.id,
      data: {
        content: editingItem.content,
        type: editingItem.type,
        status: editingItem.status,
        assignedToId: editingItem.assignedToId
      }
    }, {
      onSuccess: () => {
        setIsEditItemDialogOpen(false);
        setEditingItem(null);
      }
    });
  };
  
  // Handle item deletion
  const handleDeleteItem = (itemId: number) => {
    if (!activePlanId) return;
    
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate({
        planId: activePlanId,
        itemId
      });
    }
  };
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (!selectedItemForComment || !activePlanId || !newComment) return;
    
    const comment: InsertPartyPlanComment = {
      itemId: selectedItemForComment.id,
      content: newComment,
      userId: currentUserId
    };
    
    addCommentMutation.mutate({
      planId: activePlanId,
      itemId: selectedItemForComment.id,
      comment
    }, {
      onSuccess: () => {
        setIsCommentDialogOpen(false);
        setSelectedItemForComment(null);
        setNewComment("");
      }
    });
  };
  
  // Get username by ID
  const getUsernameById = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : "Unknown";
  };
  
  // Get user initials
  const getUserInitials = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.username) return "?";
    return user.username.slice(0, 2).toUpperCase();
  };
  
  // Change item status
  const handleStatusChange = (itemId: number, newStatus: string) => {
    if (!activePlanId) return;
    
    updateItemMutation.mutate({
      planId: activePlanId,
      itemId,
      data: { status: newStatus }
    });
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-200"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Render type badge
  const renderTypeBadge = (type: string) => {
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-200"}>
        <span className="flex items-center gap-1">
          {typeIcons[type as keyof typeof typeIcons]}
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </Badge>
    );
  };
  
  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }
  
  return (
    <div className="party-planning-board space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Party Planning</h2>
        <Button onClick={() => setIsCreatePlanDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>
      
      {partyPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
          <div className="text-center space-y-3">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No party plans yet</h3>
            <p className="text-muted-foreground max-w-md">
              Create your first party plan to coordinate with your adventuring group.
              Plan quests, manage resources, and strategize together.
            </p>
            <Button 
              variant="default"
              onClick={() => setIsCreatePlanDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {partyPlans.map((plan) => (
              <Button
                key={plan.id}
                variant={activePlanId === plan.id ? "default" : "outline"}
                onClick={() => setActivePlanId(plan.id)}
                className="whitespace-nowrap"
              >
                {plan.title}
              </Button>
            ))}
          </div>
          
          {activePlanId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {partyPlans.find(p => p.id === activePlanId)?.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {partyPlans.find(p => p.id === activePlanId)?.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCreateItemDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const planToEdit = partyPlans.find(p => p.id === activePlanId);
                          if (planToEdit) {
                            setNewPlanTitle(planToEdit.title);
                            setNewPlanDescription(planToEdit.description || "");
                            setIsCreatePlanDialogOpen(true);
                          }
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this plan?")) {
                            deletePlanMutation.mutate(activePlanId, {
                              onSuccess: () => {
                                if (partyPlans.length > 1) {
                                  const nextPlan = partyPlans.find(p => p.id !== activePlanId);
                                  setActivePlanId(nextPlan?.id || null);
                                } else {
                                  setActivePlanId(null);
                                }
                              }
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <div className="grid gap-4">
                    {isLoadingItems ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                      </div>
                    ) : planItems.length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No items in this plan yet.</p>
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => setIsCreateItemDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Item
                        </Button>
                      </div>
                    ) : (
                      planItems.map((item) => (
                        <Card key={item.id} className="relative">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                {renderTypeBadge(item.type)}
                                <CardTitle className="text-base">{item.content}</CardTitle>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingItem(item);
                                      setIsEditItemDialogOpen(true);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedItemForComment(item);
                                      setIsCommentDialogOpen(true);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Comment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Select
                                  defaultValue={item.status}
                                  onValueChange={(value) => handleStatusChange(item.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                {renderStatusBadge(item.status)}
                              </div>
                              
                              {item.assignedToId && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">Assigned to:</span>
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>{getUserInitials(item.assignedToId)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{getUsernameById(item.assignedToId)}</span>
                                </div>
                              )}
                            </div>
                            
                            {item.comments && item.comments.length > 0 && (
                              <div className="mt-4">
                                <Separator className="my-2" />
                                <p className="text-sm text-muted-foreground mb-2">Comments:</p>
                                <ScrollArea className="h-32 w-full rounded-md border p-2">
                                  <div className="space-y-3">
                                    {item.comments.map((comment, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback>{getUserInitials(comment.userId)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex justify-between items-center">
                                            <p className="text-sm font-semibold">{getUsernameById(comment.userId)}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                            </p>
                                          </div>
                                          <p className="text-sm">{comment.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-0">
                            <div className="flex justify-between w-full text-xs text-muted-foreground">
                              <div>Created by {getUsernameById(item.createdById)}</div>
                              <div>
                                {format(new Date(item.createdAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="mt-4">
                  <div className="grid gap-4">
                    {isLoadingItems ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                      </div>
                    ) : planItems.filter(item => item.status === 'pending').length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No pending items.</p>
                      </div>
                    ) : (
                      planItems
                        .filter(item => item.status === 'pending')
                        .map((item) => (
                          <Card key={item.id} className="relative">
                            {/* Item content (same as in "all" tab) */}
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  {renderTypeBadge(item.type)}
                                  <CardTitle className="text-base">{item.content}</CardTitle>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingItem(item);
                                        setIsEditItemDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedItemForComment(item);
                                        setIsCommentDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Comment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Select
                                    defaultValue={item.status}
                                    onValueChange={(value) => handleStatusChange(item.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {renderStatusBadge(item.status)}
                                </div>
                                
                                {item.assignedToId && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-muted-foreground">Assigned to:</span>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{getUserInitials(item.assignedToId)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{getUsernameById(item.assignedToId)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <div className="flex justify-between w-full text-xs text-muted-foreground">
                                <div>Created by {getUsernameById(item.createdById)}</div>
                                <div>
                                  {format(new Date(item.createdAt), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </CardFooter>
                          </Card>
                        ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="in-progress" className="mt-4">
                  <div className="grid gap-4">
                    {isLoadingItems ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                      </div>
                    ) : planItems.filter(item => item.status === 'in-progress').length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No in-progress items.</p>
                      </div>
                    ) : (
                      planItems
                        .filter(item => item.status === 'in-progress')
                        .map((item) => (
                          <Card key={item.id} className="relative">
                            {/* Item content (same as in "all" tab) */}
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  {renderTypeBadge(item.type)}
                                  <CardTitle className="text-base">{item.content}</CardTitle>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingItem(item);
                                        setIsEditItemDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedItemForComment(item);
                                        setIsCommentDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Comment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Select
                                    defaultValue={item.status}
                                    onValueChange={(value) => handleStatusChange(item.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {renderStatusBadge(item.status)}
                                </div>
                                
                                {item.assignedToId && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-muted-foreground">Assigned to:</span>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{getUserInitials(item.assignedToId)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{getUsernameById(item.assignedToId)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <div className="flex justify-between w-full text-xs text-muted-foreground">
                                <div>Created by {getUsernameById(item.createdById)}</div>
                                <div>
                                  {format(new Date(item.createdAt), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </CardFooter>
                          </Card>
                        ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="mt-4">
                  <div className="grid gap-4">
                    {isLoadingItems ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                      </div>
                    ) : planItems.filter(item => item.status === 'completed').length === 0 ? (
                      <div className="text-center p-8 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No completed items.</p>
                      </div>
                    ) : (
                      planItems
                        .filter(item => item.status === 'completed')
                        .map((item) => (
                          <Card key={item.id} className="relative">
                            {/* Item content (same as in "all" tab) */}
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  {renderTypeBadge(item.type)}
                                  <CardTitle className="text-base">{item.content}</CardTitle>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingItem(item);
                                        setIsEditItemDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedItemForComment(item);
                                        setIsCommentDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Comment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Select
                                    defaultValue={item.status}
                                    onValueChange={(value) => handleStatusChange(item.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {renderStatusBadge(item.status)}
                                </div>
                                
                                {item.assignedToId && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-muted-foreground">Assigned to:</span>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{getUserInitials(item.assignedToId)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{getUsernameById(item.assignedToId)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <div className="flex justify-between w-full text-xs text-muted-foreground">
                                <div>Created by {getUsernameById(item.createdById)}</div>
                                <div>
                                  {format(new Date(item.createdAt), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </CardFooter>
                          </Card>
                        ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
      
      {/* Create Plan Dialog */}
      <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {partyPlans.find(p => p.id === activePlanId) ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            <DialogDescription>
              {partyPlans.find(p => p.id === activePlanId)
                ? "Update your party's plan details."
                : "Create a new plan for your adventuring party."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title</Label>
              <Input
                id="title"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder="e.g. Dragon Hunt Preparation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
                placeholder="Describe what this plan is for..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatePlanDialogOpen(false);
                setNewPlanTitle("");
                setNewPlanDescription("");
              }}
            >
              Cancel
            </Button>
            
            {partyPlans.find(p => p.id === activePlanId) ? (
              <Button
                onClick={() => {
                  if (!activePlanId) return;
                  
                  updatePlanMutation.mutate({
                    planId: activePlanId,
                    data: {
                      title: newPlanTitle,
                      description: newPlanDescription
                    }
                  }, {
                    onSuccess: () => {
                      setIsCreatePlanDialogOpen(false);
                      setNewPlanTitle("");
                      setNewPlanDescription("");
                    }
                  });
                }}
                disabled={!newPlanTitle || updatePlanMutation.isPending}
              >
                {updatePlanMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Plan
              </Button>
            ) : (
              <Button
                onClick={handleCreatePlan}
                disabled={!newPlanTitle || createPlanMutation.isPending}
              >
                {createPlanMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Plan
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Item Dialog */}
      <Dialog open={isCreateItemDialogOpen} onOpenChange={setIsCreateItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new task, note, resource, or strategy to your party plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type</Label>
              <Select
                value={newItemType}
                onValueChange={setNewItemType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Describe this item..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To (Optional)</Label>
              <Select
                value={newItemAssignedToId?.toString() || ""}
                onValueChange={(value) => setNewItemAssignedToId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select party member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateItemDialogOpen(false);
                setNewItemContent("");
                setNewItemType("task");
                setNewItemAssignedToId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={!newItemContent || createItemMutation.isPending}
            >
              {createItemMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update this item's details.
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editItemType">Item Type</Label>
                <Select
                  value={editingItem.type}
                  onValueChange={(value) => setEditingItem({...editingItem, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContent">Content</Label>
                <Textarea
                  id="editContent"
                  value={editingItem.content}
                  onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                  placeholder="Describe this item..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editingItem.status}
                  onValueChange={(value) => setEditingItem({...editingItem, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAssignedTo">Assign To (Optional)</Label>
                <Select
                  value={editingItem.assignedToId?.toString() || ""}
                  onValueChange={(value) => 
                    setEditingItem({
                      ...editingItem, 
                      assignedToId: value ? parseInt(value) : null
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select party member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditItemDialogOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateItem}
              disabled={!editingItem?.content || updateItemMutation.isPending}
            >
              {updateItemMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to this item.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItemForComment && (
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-md p-3">
                <p className="font-medium text-sm">{selectedItemForComment.content}</p>
                <div className="flex items-center mt-1">
                  {renderTypeBadge(selectedItemForComment.type)}
                  <span className="text-xs text-muted-foreground ml-2">
                    Added by {getUsernameById(selectedItemForComment.createdById)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCommentDialogOpen(false);
                setSelectedItemForComment(null);
                setNewComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddComment}
              disabled={!newComment || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}