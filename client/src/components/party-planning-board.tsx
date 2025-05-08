import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  MessageCircle
} from "lucide-react";

// Types based on your database schema
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

interface PartyPlanBoardProps {
  plan: PartyPlan;
  onCreateItem: (item: Omit<PartyPlanItem, "id" | "createdAt" | "updatedAt" | "comments" | "status"> & { status?: string }) => Promise<PartyPlanItem>;
  onUpdateItem: (id: number, updates: Partial<PartyPlanItem>) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onAddComment: (comment: { 
    itemId: number; 
    userId: number; 
    content: string;
  }) => Promise<PartyPlanComment>;
  userId: number;
  isDungeonMaster: boolean;
}

export function PartyPlanBoard({ 
  plan, 
  onCreateItem, 
  onUpdateItem, 
  onDeleteItem,
  onAddComment,
  userId,
  isDungeonMaster
}: PartyPlanBoardProps) {
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemType, setNewItemType] = useState("task");
  const [editingItem, setEditingItem] = useState<PartyPlanItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [commentingItem, setCommentingItem] = useState<PartyPlanItem | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items by status
  const todoItems = plan.items.filter(item => item.status === "pending");
  const inProgressItems = plan.items.filter(item => item.status === "in_progress");
  const completedItems = plan.items.filter(item => item.status === "completed");

  // Handle adding a new item
  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const position = plan.items.length > 0 
        ? Math.max(...plan.items.map(item => item.position)) + 1 
        : 0;
      
      await onCreateItem({
        planId: plan.id,
        content: newItemContent,
        type: newItemType,
        createdById: userId,
        position,
        assignedToId: null
      });
      
      setNewItemContent("");
      setIsAddingItem(false);
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating an item
  const handleUpdateItem = async () => {
    if (!editingItem || !editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onUpdateItem(editingItem.id, {
        content: editContent
      });
      
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating item status
  const handleUpdateStatus = async (itemId: number, status: string) => {
    try {
      await onUpdateItem(itemId, { status });
    } catch (error) {
      console.error("Error updating item status:", error);
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!commentingItem || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment({
        itemId: commentingItem.id,
        userId,
        content: newComment
      });
      
      setNewComment("");
      setCommentingItem(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to determine if user can edit an item
  const canEditItem = (item: PartyPlanItem) => {
    return isDungeonMaster || item.createdById === userId;
  };

  // Render columns for each status
  const renderColumn = (title: string, items: PartyPlanItem[], status: string) => (
    <div className="flex flex-col space-y-3 min-w-[300px] w-1/3">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-medium text-base">{title}</h3>
        <Badge variant="outline" className="px-2 py-0.5">
          {items.length}
        </Badge>
      </div>
      
      <div className="bg-muted/30 rounded-md p-3 space-y-3 min-h-[200px]">
        {items.map(item => (
          <Card key={item.id} className="shadow-sm border-amber-100">
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium break-words">{item.content}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {item.type === "task" ? "Task" : item.type === "supply" ? "Supply" : "Note"}
                  </Badge>
                </div>
                
                {canEditItem(item) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mt-1 -mr-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingItem(item);
                        setEditContent(item.content);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {status !== "pending" && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "pending")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Move to Todo
                        </DropdownMenuItem>
                      )}
                      {status !== "in_progress" && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "in_progress")}>
                          <CheckCircle className="h-4 w-4 mr-2 text-amber-500" />
                          Move to In Progress
                        </DropdownMenuItem>
                      )}
                      {status !== "completed" && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, "completed")}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Comments section */}
              <div className="mt-3 pt-2 border-t border-border/50">
                {item.comments && item.comments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {item.comments.map(comment => (
                      <div key={comment.id} className="flex items-start space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {comment.user?.username?.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/50 rounded-md p-2 text-xs">
                            <p className="font-medium text-xs mb-1">{comment.user?.username || 'User'}</p>
                            <p>{comment.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 text-muted-foreground" 
                  onClick={() => setCommentingItem(item)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Add comment
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {status === "pending" && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground" 
            onClick={() => setIsAddingItem(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add item
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {renderColumn("To Do", todoItems, "pending")}
        {renderColumn("In Progress", inProgressItems, "in_progress")}
        {renderColumn("Completed", completedItems, "completed")}
      </div>
      
      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a task, supply, or note to your party plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-type">Item Type</Label>
              <Select value={newItemType} onValueChange={setNewItemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="supply">Supply</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-content">Content</Label>
              <Textarea
                id="item-content"
                placeholder={
                  newItemType === "task" 
                    ? "e.g., Prepare healing potions"
                    : newItemType === "supply" 
                    ? "e.g., 5 torches, 50ft rope"
                    : "e.g., Remember to check for traps"
                }
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingItem(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingItem(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Comment Dialog */}
      <Dialog open={!!commentingItem} onOpenChange={(open) => !open && setCommentingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to this item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment-content">Comment</Label>
              <Textarea
                id="comment-content"
                placeholder="Type your comment here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCommentingItem(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddComment} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}