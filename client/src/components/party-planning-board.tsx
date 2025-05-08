import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Check, Clock, AlertCircle, Edit, Trash, MessageCircle, RefreshCw, Save } from "lucide-react";
import type { PartyPlan, PartyPlanItem, PartyPlanComment } from "@shared/schema";

// WebSocket connection for real-time updates
let socket: WebSocket | null = null;

interface PartyPlanningBoardProps {
  campaignId: number;
}

export default function PartyPlanningBoard({ campaignId }: PartyPlanningBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [newPlanDialog, setNewPlanDialog] = useState(false);
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [commentItemId, setCommentItemId] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Form states
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemType, setNewItemType] = useState<string>("task");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [editingItem, setEditingItem] = useState<PartyPlanItem | null>(null);
  const [editingItemContent, setEditingItemContent] = useState("");
  const [editingItemStatus, setEditingItemStatus] = useState<string>("");

  // Fetch plans for the campaign
  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useQuery<PartyPlan[]>({
    queryKey: ["/api/campaigns", campaignId, "plans"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/campaigns/${campaignId}/plans`);
      return response.json();
    },
  });

  // Fetch selected plan with items
  const {
    data: selectedPlan,
    isLoading: selectedPlanLoading,
    error: selectedPlanError,
  } = useQuery<PartyPlan & { items: PartyPlanItem[] }>({
    queryKey: ["/api/plans", selectedPlanId],
    queryFn: async () => {
      if (!selectedPlanId) throw new Error("No plan selected");
      const response = await apiRequest("GET", `/api/plans/${selectedPlanId}`);
      return response.json();
    },
    enabled: !!selectedPlanId,
  });

  // Get comments for an item
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
  } = useQuery<PartyPlanComment[]>({
    queryKey: ["/api/plan-items", commentItemId, "comments"],
    queryFn: async () => {
      if (!commentItemId) throw new Error("No item selected");
      const response = await apiRequest("GET", `/api/plan-items/${commentItemId}/comments`);
      return response.json();
    },
    enabled: !!commentItemId,
  });

  // Create a new plan
  const createPlanMutation = useMutation({
    mutationFn: async (newPlan: { title: string; description: string; }) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/plans`, {
        title: newPlan.title,
        description: newPlan.description,
      });
      return response.json();
    },
    onSuccess: (data: PartyPlan) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "plans"] });
      setNewPlanDialog(false);
      setNewPlanTitle("");
      setNewPlanDescription("");
      setSelectedPlanId(data.id);
      toast({
        title: "Success",
        description: "Plan created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add a new item to a plan
  const createItemMutation = useMutation({
    mutationFn: async (newItem: { planId: number; content: string; type: string; }) => {
      const response = await apiRequest("POST", `/api/plans/${newItem.planId}/items`, {
        content: newItem.content,
        type: newItem.type,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans", selectedPlanId] });
      setNewItemDialog(false);
      setNewItemContent("");
      sendWebSocketMessage({
        type: "planning",
        action: "item_added",
        userId: user?.id,
        username: user?.username,
        planId: selectedPlanId,
        campaignId,
      });
      toast({
        title: "Success",
        description: "Item added to plan",
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

  // Add a comment to an item
  const createCommentMutation = useMutation({
    mutationFn: async (newComment: { itemId: number; content: string; }) => {
      const response = await apiRequest("POST", `/api/plan-items/${newComment.itemId}/comments`, {
        content: newComment.content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-items", commentItemId, "comments"] });
      setNewCommentContent("");
      sendWebSocketMessage({
        type: "planning",
        action: "comment_added",
        userId: user?.id,
        username: user?.username,
        planId: selectedPlanId,
        itemId: commentItemId,
        campaignId,
      });
      toast({
        title: "Success",
        description: "Comment added",
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

  // Update an item
  const updateItemMutation = useMutation({
    mutationFn: async (updatedItem: { id: number; content?: string; status?: string; }) => {
      const response = await apiRequest("PATCH", `/api/plan-items/${updatedItem.id}`, {
        content: updatedItem.content,
        status: updatedItem.status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans", selectedPlanId] });
      setEditingItem(null);
      setEditingItemContent("");
      setEditingItemStatus("");
      sendWebSocketMessage({
        type: "planning",
        action: "item_updated",
        userId: user?.id,
        username: user?.username,
        planId: selectedPlanId,
        campaignId,
      });
      toast({
        title: "Success",
        description: "Item updated",
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

  // Delete an item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/plan-items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans", selectedPlanId] });
      sendWebSocketMessage({
        type: "planning",
        action: "item_deleted",
        userId: user?.id,
        username: user?.username,
        planId: selectedPlanId,
        campaignId,
      });
      toast({
        title: "Success",
        description: "Item deleted",
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

  // Delete a plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "plans"] });
      setSelectedPlanId(null);
      sendWebSocketMessage({
        type: "planning",
        action: "plan_deleted",
        userId: user?.id,
        username: user?.username,
        campaignId,
      });
      toast({
        title: "Success",
        description: "Plan deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;

    const setupWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket connected");
        setWsConnected(true);
        // Join the campaign channel
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "join",
            campaignId,
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "join_confirm") {
            console.log("Joined campaign channel:", data.campaignId);
          }

          if (data.type === "planning") {
            // Refresh data when receiving planning updates from other users
            if (data.userId !== user.id) {
              console.log("Received planning update:", data.action);
              
              // Refresh appropriate queries based on the action
              if (data.action === "plan_added" || data.action === "plan_deleted") {
                queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "plans"] });
              }
              
              if (data.action === "item_added" || data.action === "item_updated" || data.action === "item_deleted") {
                queryClient.invalidateQueries({ queryKey: ["/api/plans", data.planId] });
              }
              
              if (data.action === "comment_added") {
                queryClient.invalidateQueries({ queryKey: ["/api/plan-items", data.itemId, "comments"] });
              }

              // Show notification
              toast({
                title: "Update",
                description: `${data.username} ${data.action.replace("_", " ")}`,
              });
            }
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        setWsConnected(false);
        // Try to reconnect after a delay
        setTimeout(setupWebSocket, 3000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsConnected(false);
      };
    };

    setupWebSocket();

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user, campaignId, queryClient]);

  // Function to send WebSocket messages
  const sendWebSocketMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  // Handle form submissions
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate({ title: newPlanTitle, description: newPlanDescription });
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    createItemMutation.mutate({
      planId: selectedPlanId,
      content: newItemContent,
      type: newItemType,
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentItemId) return;
    createCommentMutation.mutate({
      itemId: commentItemId,
      content: newCommentContent,
    });
  };

  const handleUpdateItem = (item: PartyPlanItem) => {
    if (editingItemContent || editingItemStatus) {
      updateItemMutation.mutate({
        id: item.id,
        content: editingItemContent || undefined,
        status: editingItemStatus || undefined,
      });
    }
  };

  const handleDeleteItem = (itemId: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleDeletePlan = (planId: number) => {
    if (window.confirm("Are you sure you want to delete this entire plan?")) {
      deletePlanMutation.mutate(planId);
    }
  };

  // Select a plan when it's the only one available
  useEffect(() => {
    if (plans.length === 1 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Reset editing state when selected plan changes
  useEffect(() => {
    setEditingItem(null);
    setCommentItemId(null);
  }, [selectedPlanId]);

  // Set editing item content when starting to edit
  useEffect(() => {
    if (editingItem) {
      setEditingItemContent(editingItem.content);
      setEditingItemStatus(editingItem.status);
    } else {
      setEditingItemContent("");
      setEditingItemStatus("");
    }
  }, [editingItem]);

  if (plansLoading) {
    return <div className="flex items-center justify-center p-6"><RefreshCw className="h-6 w-6 animate-spin" /></div>;
  }

  if (plansError) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-2">Error loading plans</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "plans"] })}>
          Retry
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "in-progress":
        return <Badge variant="secondary" className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1"><Check className="h-3 w-3" /> Completed</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "task":
        return <Badge variant="outline">Task</Badge>;
      case "note":
        return <Badge variant="secondary">Note</Badge>;
      case "resource":
        return <Badge variant="default">Resource</Badge>;
      case "strategy":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Strategy</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="party-planning-board">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Party Planning</h2>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Real-time connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              Real-time disconnected
            </Badge>
          )}
          <Dialog open={newPlanDialog} onOpenChange={setNewPlanDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
                <DialogDescription>
                  Create a new planning board for your party to collaborate on quests, strategies, or resource gathering.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlan}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPlanTitle}
                      onChange={(e) => setNewPlanTitle(e.target.value)}
                      placeholder="Enter plan title"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPlanDescription}
                      onChange={(e) => setNewPlanDescription(e.target.value)}
                      placeholder="Enter plan description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createPlanMutation.isPending}>
                    {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-muted-foreground">No plans yet! Create your first plan to start collaborating with your party.</p>
            <Button onClick={() => setNewPlanDialog(true)}>Create First Plan</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Plans list sidebar */}
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant={selectedPlanId === plan.id ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="truncate">{plan.title}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected plan view */}
          <Card className="col-span-1 lg:col-span-9">
            {!selectedPlanId ? (
              <CardContent className="p-8 text-center">
                <p className="mb-4 text-muted-foreground">Select a plan from the sidebar or create a new one.</p>
              </CardContent>
            ) : selectedPlanLoading ? (
              <CardContent className="p-8 text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin" />
              </CardContent>
            ) : selectedPlanError ? (
              <CardContent className="p-8 text-center">
                <p className="text-destructive mb-2">Error loading plan details</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/plans", selectedPlanId] })}>
                  Retry
                </Button>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedPlan?.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedPlan?.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewItemDialog(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlan(selectedPlan!.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                      {selectedPlan?.items.length === 0 ? (
                        <div className="text-center p-8 border rounded-lg">
                          <p className="text-muted-foreground">No items in this plan yet. Add some items to get started!</p>
                        </div>
                      ) : (
                        selectedPlan?.items.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              {editingItem?.id === item.id ? (
                                <div className="p-4 bg-muted/20">
                                  <Textarea
                                    value={editingItemContent}
                                    onChange={(e) => setEditingItemContent(e.target.value)}
                                    className="mb-2"
                                    placeholder="Item content"
                                  />
                                  <div className="flex justify-between items-center">
                                    <Select
                                      value={editingItemStatus}
                                      onValueChange={setEditingItemStatus}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => setEditingItem(null)}
                                        variant="outline"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateItem(item)}
                                        variant="default"
                                      >
                                        <Save className="h-4 w-4 mr-1" /> Save
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                      {getTypeBadge(item.type)}
                                      {getStatusBadge(item.status)}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setCommentItemId(commentItemId === item.id ? null : item.id);
                                        }}
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingItem(item)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteItem(item.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="whitespace-pre-line">{item.content}</p>
                                </div>
                              )}

                              {/* Comments section */}
                              {commentItemId === item.id && (
                                <div className="border-t p-4 bg-muted/10">
                                  <h4 className="font-medium mb-2">Comments</h4>
                                  {commentsLoading ? (
                                    <div className="flex justify-center p-4">
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    </div>
                                  ) : comments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground mb-3">No comments yet</p>
                                  ) : (
                                    <ScrollArea className="h-[200px] mb-3">
                                      <div className="space-y-3">
                                        {comments.map((comment) => (
                                          <div key={comment.id} className="text-sm border-l-2 border-primary/20 pl-3">
                                            <div className="flex justify-between">
                                              <span className="font-medium">User #{comment.userId}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {formatDate(comment.createdAt!)}
                                              </span>
                                            </div>
                                            <p className="whitespace-pre-line mt-1">{comment.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  )}
                                  <form onSubmit={handleAddComment} className="mt-2">
                                    <Textarea
                                      placeholder="Add a comment..."
                                      value={newCommentContent}
                                      onChange={(e) => setNewCommentContent(e.target.value)}
                                      className="min-h-[60px] text-sm mb-2"
                                    />
                                    <div className="flex justify-end">
                                      <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!newCommentContent.trim() || createCommentMutation.isPending}
                                      >
                                        {createCommentMutation.isPending ? "Adding..." : "Add Comment"}
                                      </Button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                      {selectedPlan?.items.filter(item => item.status === "pending").map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2">
                                {getTypeBadge(item.type)}
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setCommentItemId(commentItemId === item.id ? null : item.id);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="whitespace-pre-line">{item.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="in-progress" className="space-y-4">
                      {selectedPlan?.items.filter(item => item.status === "in-progress").map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2">
                                {getTypeBadge(item.type)}
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setCommentItemId(commentItemId === item.id ? null : item.id);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="whitespace-pre-line">{item.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4">
                      {selectedPlan?.items.filter(item => item.status === "completed").map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-2">
                                {getTypeBadge(item.type)}
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setCommentItemId(commentItemId === item.id ? null : item.id);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="whitespace-pre-line">{item.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {/* New Item Dialog */}
      <Dialog open={newItemDialog} onOpenChange={setNewItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to your plan. This could be a task, note, resource, or strategy.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-type">Type</Label>
                <Select
                  value={newItemType}
                  onValueChange={setNewItemType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-content">Content</Label>
                <Textarea
                  id="item-content"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="Enter item details"
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}