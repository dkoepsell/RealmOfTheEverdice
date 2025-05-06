import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckIcon, EditIcon, PlusIcon, TrashIcon, XIcon, CalendarIcon, ListChecksIcon, ScrollTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartyPlanning, PlanItem, PlanItemStatus } from "@/hooks/use-party-planning";
import { Character } from '@shared/schema';
import { format } from "date-fns";

interface PartyPlanningProps {
  campaignId: number;
  characters?: Character[];
}

export function PartyPlanning({ campaignId, characters = [] }: PartyPlanningProps) {
  const { toast } = useToast();
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [assignDialog, setAssignDialog] = useState<{open: boolean, planId: string | null}>({
    open: false,
    planId: null
  });

  // Use the party planning hook
  const {
    connected,
    loading,
    planItems,
    addPlanItem,
    updatePlanItem,
    removePlanItem,
    assignPlanItem,
    changePlanItemStatus
  } = usePartyPlanning({
    campaignId,
    onConnect: () => {
      toast({
        title: 'Connected',
        description: 'Party planning connection established',
      });
    },
    onDisconnect: () => {
      toast({
        title: 'Disconnected',
        description: 'Party planning connection lost',
        variant: 'destructive',
      });
    }
  });

  const handleAddPlan = () => {
    if (!newPlanTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Plan title is required',
        variant: 'destructive',
      });
      return;
    }

    const success = addPlanItem(newPlanTitle, newPlanDescription);
    
    if (success) {
      setNewPlanTitle('');
      setNewPlanDescription('');
      setShowAddDialog(false);
      
      toast({
        title: 'Plan Added',
        description: 'New plan item has been added',
      });
    }
  };

  const handleUpdatePlan = () => {
    if (!editingItem) return;
    
    const success = updatePlanItem(editingItem.id, editingItem);
    
    if (success) {
      setEditingItem(null);
      
      toast({
        title: 'Plan Updated',
        description: 'Plan item has been updated',
      });
    }
  };

  const handleRemovePlan = (id: string) => {
    const success = removePlanItem(id);
    
    if (success) {
      toast({
        title: 'Plan Removed',
        description: 'Plan item has been removed',
      });
    }
  };

  const handleAssignPlan = (characterId: string) => {
    if (!assignDialog.planId) return;
    
    const success = assignPlanItem(assignDialog.planId, characterId);
    
    if (success) {
      setAssignDialog({ open: false, planId: null });
      
      toast({
        title: 'Plan Assigned',
        description: 'Plan item has been assigned',
      });
    }
  };

  const handleStatusChange = (id: string, status: PlanItemStatus) => {
    const success = changePlanItemStatus(id, status);
    
    if (success) {
      toast({
        title: 'Status Updated',
        description: `Plan item status changed to ${status}`,
      });
    }
  };

  // Filter items based on active tab
  const filteredItems = planItems.filter(item => {
    if (activeTab === 'active') return item.status !== 'completed';
    if (activeTab === 'completed') return item.status === 'completed';
    return true; // Show all for 'all' tab
  });

  // Get character name by ID
  const getCharacterName = (characterId?: string) => {
    if (!characterId) return 'Unassigned';
    const character = characters.find(c => c.id.toString() === characterId);
    return character ? character.name : 'Unknown';
  };

  // Get color based on status
  const getStatusColor = (status: PlanItemStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p>Connecting to party planning...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <XIcon className="h-8 w-8 text-destructive mb-2" />
        <p>Disconnected from party planning. Please refresh the page to reconnect.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Party Planning</h3>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Plan</DialogTitle>
                <DialogDescription>
                  Create a new plan for your party to coordinate actions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input
                    id="title"
                    placeholder="Enter plan title"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    placeholder="Enter plan details"
                    value={newPlanDescription}
                    onChange={(e) => setNewPlanDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddPlan}>Add Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Plans</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-grow overflow-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ScrollTextIcon className="h-12 w-12 mb-2" />
            <p className="text-center">No plans yet. Create a plan to coordinate with your party.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className={cn(
                "transition-all",
                item.status === 'completed' ? "opacity-70" : ""
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <div className="flex space-x-1">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'pending' && 'Pending'}
                        {item.status === 'in_progress' && 'In Progress'}
                        {item.status === 'completed' && 'Completed'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center space-x-1 text-xs">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Created {format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                    <span>by {item.createdBy}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{item.description}</p>
                  
                  <div className="mt-2">
                    <span className="text-xs font-medium">Assigned to: </span>
                    <span className="text-xs">{getCharacterName(item.assignedTo)}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignDialog({ open: true, planId: item.id })}
                    >
                      Assign
                    </Button>
                    
                    {item.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm" 
                        onClick={() => handleStatusChange(item.id, 
                          item.status === 'pending' ? 'in_progress' : 'completed'
                        )}
                      >
                        {item.status === 'pending' ? 'Start' : 'Complete'}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlan(item.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the details of your plan.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                <Input
                  id="edit-title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-status" className="text-sm font-medium">Status</label>
                <Select 
                  value={editingItem.status} 
                  onValueChange={(value) => setEditingItem({
                    ...editingItem, 
                    status: value as PlanItemStatus
                  })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleUpdatePlan}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => !open && setAssignDialog({...assignDialog, open: false})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan</DialogTitle>
            <DialogDescription>
              Choose a character to assign this plan to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={(value) => handleAssignPlan(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select character" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((character) => (
                  <SelectItem key={character.id} value={character.id.toString()}>
                    {character.name} ({character.class}, Level {character.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({open: false, planId: null})}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}