import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, CalendarDays, ArrowUpDown, X, Check, Trash2, User, PlusCircle, Edit, Clock, MoreVertical } from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define schemas
const planSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
  campaignId: z.number()
});

const planItemSchema = z.object({
  content: z.string().min(3, "Content is required").max(500),
  type: z.enum(["task", "note", "resource", "strategy"]).default("task"),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  assignedToId: z.number().optional().nullable(),
  planId: z.number()
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(500),
  itemId: z.number()
});

const PartyPlanning = () => {
  const queryClient = useQueryClient();
  // Use the correct type for wouter params (no TS typings)
  const params = useParams() as {id: string};
  const campaignIdParam = params.id;
  
  // Parse and validate campaign ID ensuring it's always a valid number
  const parsedId = campaignIdParam ? parseInt(campaignIdParam, 10) : 0;
  // Ensure campaignId is a positive number greater than 0
  const campaignId = !isNaN(parsedId) && parsedId > 0 ? parsedId : 0;
  
  // Log campaign ID for debugging
  useEffect(() => {
    console.log("Party Planning received campaignId param:", campaignIdParam, "| parsed as:", campaignId);
    // Extra validation
    if (campaignId <= 0) {
      console.error("Invalid campaign ID in URL for party planning. Raw param:", campaignIdParam);
    }
  }, [campaignIdParam, campaignId]);
  
  const { user } = useAuth();
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [newPlanDialogOpen, setNewPlanDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [editPlanDialogOpen, setEditPlanDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // WebSocket connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    // Only proceed if we have a valid campaign ID and a user
    if (campaignId <= 0 || !user) {
      console.error("Cannot set up WebSocket: Invalid campaign ID or user not logged in", 
                   { campaignId, user: user ? "logged in" : "not logged in" });
      return;
    }
    
    // Setup WebSocket connection with validated campaign ID
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connected");
      // Join party planning room
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.send(JSON.stringify({
          type: "join_room",
          roomType: "party_planning",
          campaignId,
          userId: user.id
        }));
      }
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message:", data);
        
        if (data.type === "party_planning_update") {
          // Invalidate queries to refresh data
          if (data.action === "plan_created" || data.action === "plan_updated" || data.action === "plan_deleted") {
            queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
          }
          
          if (data.action === "item_created" || data.action === "item_updated" || data.action === "item_deleted") {
            if (data.planId) {
              queryClient.invalidateQueries({ queryKey: ['/api/party-plans', data.planId] });
            }
          }
          
          if (data.action === "comment_added") {
            if (data.itemId) {
              queryClient.invalidateQueries({ queryKey: ['/api/party-plan-items', data.itemId, 'comments'] });
            }
          }
          
          // Show toast notification
          toast({
            title: "Update from " + (data.username || "a team member"),
            description: data.message || "Changes made to the party plan",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket closed");
    };
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.send(JSON.stringify({
          type: "leave_room",
          roomType: "party_planning",
          campaignId,
          userId: user.id
        }));
      }
      newSocket.close();
    };
  }, [campaignId, user, queryClient]);

  // Form for creating a new plan
  const newPlanForm = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "active",
      campaignId
    }
  });

  // Form for editing a plan
  const editPlanForm = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "active",
      campaignId
    }
  });

  // Form for creating a new item
  const newItemForm = useForm({
    resolver: zodResolver(planItemSchema),
    defaultValues: {
      content: "",
      type: "task",
      status: "pending",
      assignedToId: null,
      planId: 0
    }
  });

  // Form for editing an item
  const editItemForm = useForm({
    resolver: zodResolver(planItemSchema),
    defaultValues: {
      content: "",
      type: "task",
      status: "pending",
      assignedToId: null,
      planId: 0
    }
  });

  // Form for adding a comment
  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
      itemId: 0
    }
  });

  // Get campaign info
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId
  });

  // Get campaign members
  const { data: campaignMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId, 'members'],
    enabled: !!campaignId
  });

  // Get all party plans for the campaign
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId, 'party-plans'],
    enabled: !!campaignId
  });

  // Get active plan details with items
  const { data: activePlan, isLoading: activePlanLoading } = useQuery({
    queryKey: ['/api/party-plans', activePlanId],
    enabled: !!activePlanId
  });

  // Create a new plan
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/party-plans`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
      setNewPlanDialogOpen(false);
      newPlanForm.reset();
      toast({
        title: "Success",
        description: "Party plan created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create party plan",
        variant: "destructive",
      });
    }
  });

  // Update a plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/party-plans/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
      if (activePlanId) {
        queryClient.invalidateQueries({ queryKey: ['/api/party-plans', activePlanId] });
      }
      setEditPlanDialogOpen(false);
      toast({
        title: "Success",
        description: "Party plan updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update party plan",
        variant: "destructive",
      });
    }
  });

  // Delete a plan
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/party-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'party-plans'] });
      if (activePlanId) {
        setActivePlanId(null);
      }
      toast({
        title: "Success",
        description: "Party plan deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete party plan",
        variant: "destructive",
      });
    }
  });

  // Create a new item
  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/party-plans/${data.planId}/items`, data);
      return await res.json();
    },
    onSuccess: () => {
      if (activePlanId) {
        queryClient.invalidateQueries({ queryKey: ['/api/party-plans', activePlanId] });
      }
      setNewItemDialogOpen(false);
      newItemForm.reset();
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      });
    }
  });

  // Update an item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/party-plan-items/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      if (activePlanId) {
        queryClient.invalidateQueries({ queryKey: ['/api/party-plans', activePlanId] });
      }
      setEditItemDialogOpen(false);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  });

  // Delete an item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/party-plan-items/${id}`);
    },
    onSuccess: () => {
      if (activePlanId) {
        queryClient.invalidateQueries({ queryKey: ['/api/party-plans', activePlanId] });
      }
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  });

  // Add a comment to an item
  const addCommentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/party-plan-items/${data.itemId}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      if (activePlanId) {
        queryClient.invalidateQueries({ queryKey: ['/api/party-plans', activePlanId] });
      }
      commentForm.reset();
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  });

  // Handle form submissions
  const onSubmitNewPlan = (data: any) => {
    createPlanMutation.mutate(data);
  };

  const onSubmitEditPlan = (data: any) => {
    if (!activePlanId) return;
    updatePlanMutation.mutate({ id: activePlanId, data });
  };

  const onSubmitNewItem = (data: any) => {
    createItemMutation.mutate(data);
  };

  const onSubmitEditItem = (data: any) => {
    if (!selectedItem) return;
    updateItemMutation.mutate({ id: selectedItem.id, data });
  };

  const onSubmitComment = (data: any) => {
    addCommentMutation.mutate(data);
  };

  // Set up forms when editing
  useEffect(() => {
    if (activePlan && editPlanDialogOpen) {
      editPlanForm.reset({
        title: activePlan.title,
        description: activePlan.description || "",
        status: activePlan.status,
        campaignId
      });
    }
  }, [activePlan, editPlanDialogOpen, editPlanForm, campaignId]);

  useEffect(() => {
    if (selectedItem && editItemDialogOpen) {
      editItemForm.reset({
        content: selectedItem.content,
        type: selectedItem.type,
        status: selectedItem.status,
        assignedToId: selectedItem.assignedToId,
        planId: selectedItem.planId
      });
    }
  }, [selectedItem, editItemDialogOpen, editItemForm]);

  // Set the planId when creating a new item
  useEffect(() => {
    if (activePlanId && newItemDialogOpen) {
      newItemForm.setValue("planId", activePlanId);
    }
  }, [activePlanId, newItemDialogOpen, newItemForm]);

  // Helper functions
  const getUserById = (id: number) => {
    if (!campaignMembers) return null;
    return campaignMembers.find((member: any) => member.id === id);
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquareIcon className="h-4 w-4 mr-1" />;
      case "note":
        return <FileTextIcon className="h-4 w-4 mr-1" />;
      case "resource":
        return <PackageIcon className="h-4 w-4 mr-1" />;
      case "strategy":
        return <CompassIcon className="h-4 w-4 mr-1" />;
      default:
        return <CheckSquareIcon className="h-4 w-4 mr-1" />;
    }
  };

  if (campaignLoading || membersLoading || plansLoading || !campaignId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">{campaign?.name} - Party Planning</h1>
            <p className="text-muted-foreground mt-1">Coordinate your adventures with fellow party members</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href={`/campaigns/${campaignId}`}>
              <Button variant="outline">Back to Campaign</Button>
            </Link>
            <Dialog open={newPlanDialogOpen} onOpenChange={setNewPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Party Plan</DialogTitle>
                  <DialogDescription>
                    Create a new plan to coordinate with your party members.
                  </DialogDescription>
                </DialogHeader>
                <Form {...newPlanForm}>
                  <form onSubmit={newPlanForm.handleSubmit(onSubmitNewPlan)} className="space-y-4">
                    <FormField
                      control={newPlanForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter plan title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newPlanForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter plan description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createPlanMutation.isPending}>
                        {createPlanMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Plan"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Plans List */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-card rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Party Plans</h2>
                <div className="relative inline-flex">
                  <span className="flex h-3 w-3 absolute -top-1 -right-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              {plansLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : plans && plans.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-240px)]">
                  <div className="space-y-2">
                    {plans.map((plan: any) => (
                      <div 
                        key={plan.id} 
                        className={`p-3 rounded-md cursor-pointer hover:bg-accent transition-colors ${activePlanId === plan.id ? 'bg-accent border-l-4 border-primary' : 'bg-background'}`}
                        onClick={() => setActivePlanId(plan.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{plan.title}</h3>
                          <Badge variant="outline" className={`${getStatusColor(plan.status)}`}>
                            {plan.status}
                          </Badge>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(plan.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <h3 className="font-medium text-lg">No plans yet</h3>
                  <p className="text-muted-foreground mt-1">Create your first party plan</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setNewPlanDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Active Plan Details */}
          <div className="md:col-span-8 lg:col-span-9">
            {activePlanId && activePlan ? (
              <div className="bg-card rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h2 className="text-2xl font-bold">{activePlan.title}</h2>
                        <Badge variant="outline" className={`ml-3 ${getStatusColor(activePlan.status)}`}>
                          {activePlan.status}
                        </Badge>
                      </div>
                      {activePlan.description && (
                        <p className="text-muted-foreground mt-2">{activePlan.description}</p>
                      )}
                      <div className="flex items-center mt-3 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        Created {formatDate(activePlan.createdAt)}
                        {activePlan.updatedAt && activePlan.updatedAt !== activePlan.createdAt && (
                          <span className="ml-2 text-xs">• Updated {formatDate(activePlan.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog open={editPlanDialogOpen} onOpenChange={setEditPlanDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Party Plan</DialogTitle>
                            <DialogDescription>
                              Update the details of your party plan.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...editPlanForm}>
                            <form onSubmit={editPlanForm.handleSubmit(onSubmitEditPlan)} className="space-y-4">
                              <FormField
                                control={editPlanForm.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter plan title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editPlanForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Enter plan description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editPlanForm.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button variant="destructive" type="button" className="mr-auto" onClick={() => {
                                  if (confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
                                    deletePlanMutation.mutate(activePlanId);
                                    setEditPlanDialogOpen(false);
                                  }
                                }}>
                                  Delete Plan
                                </Button>
                                <Button type="submit" disabled={updatePlanMutation.isPending}>
                                  {updatePlanMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    "Save Changes"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Item</DialogTitle>
                            <DialogDescription>
                              Create a new task, note, resource or strategy for this plan.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...newItemForm}>
                            <form onSubmit={newItemForm.handleSubmit(onSubmitNewItem)} className="space-y-4">
                              <FormField
                                control={newItemForm.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Enter item content" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={newItemForm.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="task">Task</SelectItem>
                                          <SelectItem value="note">Note</SelectItem>
                                          <SelectItem value="resource">Resource</SelectItem>
                                          <SelectItem value="strategy">Strategy</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={newItemForm.control}
                                  name="status"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="in-progress">In Progress</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={newItemForm.control}
                                name="assignedToId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Assign To</FormLabel>
                                    <Select 
                                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                                      defaultValue={field.value?.toString() || ""}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Assign to member" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {campaignMembers?.map((member: any) => (
                                          <SelectItem key={member.id} value={member.id.toString()}>
                                            {member.username}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="submit" disabled={createItemMutation.isPending}>
                                  {createItemMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Adding...
                                    </>
                                  ) : (
                                    "Add Item"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Items</h3>
                  
                  {/* Item Tabs */}
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="space-y-4">
                      {activePlan.items && activePlan.items.length > 0 ? (
                        activePlan.items.map((item: any) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <Badge variant="outline" className="mr-2">
                                    {item.type}
                                  </Badge>
                                  <Badge className={getStatusColor(item.status)}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedItem(item);
                                      setEditItemDialogOpen(true);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      if (confirm("Are you sure you want to delete this item?")) {
                                        deleteItemMutation.mutate(item.id);
                                      }
                                    }}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <p className="text-base">{item.content}</p>
                              
                              {item.assignedToId && (
                                <div className="flex items-center mt-3">
                                  <span className="text-sm text-muted-foreground mr-2">Assigned to:</span>
                                  <div className="flex items-center">
                                    <Avatar className="h-6 w-6 mr-1">
                                      <AvatarImage src={getUserById(item.assignedToId)?.avatar} />
                                      <AvatarFallback>
                                        {getInitials(getUserById(item.assignedToId)?.username || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {getUserById(item.assignedToId)?.username || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex flex-col items-start">
                              <div className="w-full mb-3 pb-3 border-b">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    Created by {getUserById(item.createdById)?.username || "Unknown"}
                                  </span>
                                  <span>
                                    {formatDate(item.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Comments Section */}
                              <div className="w-full">
                                <h4 className="text-sm font-medium mb-2">Comments</h4>
                                
                                {/* Display comments */}
                                <div className="space-y-2 mb-4">
                                  {item.comments && item.comments.length > 0 ? (
                                    item.comments.map((comment: any) => (
                                      <div key={comment.id} className="bg-accent/50 rounded-md p-3">
                                        <div className="flex items-center mb-1">
                                          <Avatar className="h-5 w-5 mr-1.5">
                                            <AvatarImage src={getUserById(comment.userId)?.avatar} />
                                            <AvatarFallback>
                                              {getInitials(getUserById(comment.userId)?.username || "")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs font-medium">
                                            {getUserById(comment.userId)?.username || "Unknown"}
                                          </span>
                                          <span className="text-xs text-muted-foreground ml-auto">
                                            {formatDate(comment.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-sm">{comment.content}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No comments yet</p>
                                  )}
                                </div>
                                
                                {/* Add comment form */}
                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    commentForm.setValue("itemId", item.id);
                                    commentForm.handleSubmit(onSubmitComment)();
                                  }}
                                  className="flex items-center space-x-2"
                                >
                                  <Input 
                                    placeholder="Add a comment..." 
                                    className="text-sm" 
                                    value={commentForm.getValues().itemId === item.id ? commentForm.getValues().content : ""}
                                    onChange={(e) => {
                                      commentForm.setValue("content", e.target.value);
                                      commentForm.setValue("itemId", item.id);
                                    }}
                                  />
                                  <Button 
                                    type="submit" 
                                    size="sm" 
                                    disabled={
                                      !commentForm.getValues().content || 
                                      addCommentMutation.isPending
                                    }
                                  >
                                    {addCommentMutation.isPending && commentForm.getValues().itemId === item.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Add"
                                    )}
                                  </Button>
                                </form>
                              </div>
                            </CardFooter>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <h3 className="font-medium text-lg">No items yet</h3>
                          <p className="text-muted-foreground mt-1">Start by adding a task or note</p>
                          <Button 
                            variant="outline" 
                            className="mt-4" 
                            onClick={() => setNewItemDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Item
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="pending" className="space-y-4">
                      {activePlan.items && activePlan.items.filter((item: any) => item.status === "pending").length > 0 ? (
                        activePlan.items
                          .filter((item: any) => item.status === "pending")
                          .map((item: any) => (
                            <Card key={item.id} className="overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-2">
                                      {item.type}
                                    </Badge>
                                    <Badge className={getStatusColor(item.status)}>
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedItem(item);
                                        setEditItemDialogOpen(true);
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        if (confirm("Are you sure you want to delete this item?")) {
                                          deleteItemMutation.mutate(item.id);
                                        }
                                      }}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-base">{item.content}</p>
                                
                                {item.assignedToId && (
                                  <div className="flex items-center mt-3">
                                    <span className="text-sm text-muted-foreground mr-2">Assigned to:</span>
                                    <div className="flex items-center">
                                      <Avatar className="h-6 w-6 mr-1">
                                        <AvatarImage src={getUserById(item.assignedToId)?.avatar} />
                                        <AvatarFallback>
                                          {getInitials(getUserById(item.assignedToId)?.username || "")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {getUserById(item.assignedToId)?.username || "Unknown"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <h3 className="font-medium">No pending items</h3>
                          <p className="text-muted-foreground mt-1">All tasks are in progress or completed</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="in-progress" className="space-y-4">
                      {activePlan.items && activePlan.items.filter((item: any) => item.status === "in-progress").length > 0 ? (
                        activePlan.items
                          .filter((item: any) => item.status === "in-progress")
                          .map((item: any) => (
                            <Card key={item.id} className="overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-2">
                                      {item.type}
                                    </Badge>
                                    <Badge className={getStatusColor(item.status)}>
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedItem(item);
                                        setEditItemDialogOpen(true);
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        if (confirm("Are you sure you want to delete this item?")) {
                                          deleteItemMutation.mutate(item.id);
                                        }
                                      }}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-base">{item.content}</p>
                                
                                {item.assignedToId && (
                                  <div className="flex items-center mt-3">
                                    <span className="text-sm text-muted-foreground mr-2">Assigned to:</span>
                                    <div className="flex items-center">
                                      <Avatar className="h-6 w-6 mr-1">
                                        <AvatarImage src={getUserById(item.assignedToId)?.avatar} />
                                        <AvatarFallback>
                                          {getInitials(getUserById(item.assignedToId)?.username || "")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {getUserById(item.assignedToId)?.username || "Unknown"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <h3 className="font-medium">No items in progress</h3>
                          <p className="text-muted-foreground mt-1">Start working on some tasks</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="completed" className="space-y-4">
                      {activePlan.items && activePlan.items.filter((item: any) => item.status === "completed").length > 0 ? (
                        activePlan.items
                          .filter((item: any) => item.status === "completed")
                          .map((item: any) => (
                            <Card key={item.id} className="overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-2">
                                      {item.type}
                                    </Badge>
                                    <Badge className={getStatusColor(item.status)}>
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedItem(item);
                                        setEditItemDialogOpen(true);
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        if (confirm("Are you sure you want to delete this item?")) {
                                          deleteItemMutation.mutate(item.id);
                                        }
                                      }}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-base">{item.content}</p>
                                
                                {item.assignedToId && (
                                  <div className="flex items-center mt-3">
                                    <span className="text-sm text-muted-foreground mr-2">Assigned to:</span>
                                    <div className="flex items-center">
                                      <Avatar className="h-6 w-6 mr-1">
                                        <AvatarImage src={getUserById(item.assignedToId)?.avatar} />
                                        <AvatarFallback>
                                          {getInitials(getUserById(item.assignedToId)?.username || "")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {getUserById(item.assignedToId)?.username || "Unknown"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <h3 className="font-medium">No completed items</h3>
                          <p className="text-muted-foreground mt-1">Complete some tasks to see them here</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Edit Item Dialog */}
                <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Item</DialogTitle>
                      <DialogDescription>
                        Update the details of this item.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...editItemForm}>
                      <form onSubmit={editItemForm.handleSubmit(onSubmitEditItem)} className="space-y-4">
                        <FormField
                          control={editItemForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter item content" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={editItemForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="task">Task</SelectItem>
                                    <SelectItem value="note">Note</SelectItem>
                                    <SelectItem value="resource">Resource</SelectItem>
                                    <SelectItem value="strategy">Strategy</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editItemForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={editItemForm.control}
                          name="assignedToId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assign To</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                                defaultValue={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Assign to member" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
                                  {campaignMembers?.map((member: any) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                      {member.username}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button variant="destructive" type="button" className="mr-auto" onClick={() => {
                            if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
                              if (selectedItem) {
                                deleteItemMutation.mutate(selectedItem.id);
                                setEditItemDialogOpen(false);
                              }
                            }
                          }}>
                            Delete Item
                          </Button>
                          <Button type="submit" disabled={updateItemMutation.isPending}>
                            {updateItemMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow p-10 text-center">
                <div className="max-w-md mx-auto">
                  <h2 className="text-2xl font-bold mb-4">Select or Create a Plan</h2>
                  <p className="text-muted-foreground mb-6">
                    Choose a plan from the list or create a new one to start planning your adventure with your party.
                  </p>
                  <Button onClick={() => setNewPlanDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Add missing icons
const CheckSquareIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const FileTextIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const PackageIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const CompassIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);

export default PartyPlanning;