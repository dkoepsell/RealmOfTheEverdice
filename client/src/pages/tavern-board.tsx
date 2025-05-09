import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTavern } from "@/hooks/use-tavern";
import { Redirect, Link } from "wouter";
import { Beer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  PlusCircle, 
  MessageSquare, 
  Shield, 
  Sword, 
  Users, 
  Scroll,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

const TavernBoard = () => {
  const { user } = useAuth();
  const { 
    notices, 
    isLoadingNotices, 
    getNoticeReplies,
    createNotice, 
    createNoticeLoading,
    replyToNotice,
    replyToNoticeLoading
  } = useTavern();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeType, setNoticeType] = useState("quest");
  
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  const handleCreateNotice = () => {
    createNotice({
      title: noticeTitle,
      content: noticeContent,
      type: noticeType
    });
    
    setNoticeTitle("");
    setNoticeContent("");
    setNoticeType("quest");
    setIsDialogOpen(false);
  };
  
  const handleReply = () => {
    if (!selectedNotice) return;
    
    replyToNotice({
      noticeId: selectedNotice.id,
      content: replyContent
    });
    
    setReplyContent("");
    setReplyDialogOpen(false);
  };
  
  const openReplyDialog = (notice: any) => {
    setSelectedNotice(notice);
    setReplyDialogOpen(true);
  };
  
  const getNoticeIcon = (type: string) => {
    switch (type) {
      case "quest":
        return <Scroll className="h-5 w-5 text-amber-600" />;
      case "party_search":
        return <Users className="h-5 w-5 text-blue-600" />;
      case "announcement":
        return <Shield className="h-5 w-5 text-red-600" />;
      default:
        return <Scroll className="h-5 w-5 text-amber-600" />;
    }
  };
  
  const getNoticeTypeName = (type: string) => {
    switch (type) {
      case "quest":
        return "Quest Opportunity";
      case "party_search":
        return "Party Recruitment";
      case "announcement":
        return "Official Announcement";
      default:
        return "Tavern Notice";
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Sword className="h-8 w-8 mr-2 text-amber-600" />
          <h1 className="text-3xl font-bold">Tavern Notice Board</h1>
        </div>
        <Button variant="outline" asChild className="mr-2">
          <Link to="/tavern">
            <Beer className="h-4 w-4 mr-2" />
            Back to Tavern
          </Link>
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Post Notice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a New Notice</DialogTitle>
              <DialogDescription>
                Share quest information, recruit party members, or make announcements.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Notice Type</Label>
                <Select
                  value={noticeType}
                  onValueChange={setNoticeType}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select notice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Notice Types</SelectLabel>
                      <SelectItem value="quest">Quest Opportunity</SelectItem>
                      <SelectItem value="party_search">Party Recruitment</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notice title"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your notice here..."
                  rows={5}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNotice}
                disabled={!noticeTitle || !noticeContent || createNoticeLoading}
              >
                {createNoticeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-muted-foreground mb-8">
        The tavern notice board is where adventurers gather to find quests, recruit party members, and share important information.
      </p>
      
      {isLoadingNotices ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : notices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No notices have been posted yet.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Post the First Notice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {notices.map((notice: any) => {
            const {
              data: replies = [],
              isLoading: isLoadingReplies
            } = getNoticeReplies(notice.id);
            
            return (
              <Card key={notice.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {getNoticeIcon(notice.type)}
                      <CardTitle className="ml-2">
                        {notice.title}
                      </CardTitle>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {getNoticeTypeName(notice.type)}
                    </span>
                  </div>
                  <CardDescription className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Posted {format(new Date(notice.createdAt), "PPP")} by {notice.username || "Unknown"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <div className="whitespace-pre-line">
                    {notice.content}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t bg-muted/50 pt-4 pb-2 px-6 flex-col items-start">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="replies" className="border-b-0">
                      <AccordionTrigger className="py-2 text-sm">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {isLoadingReplies ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : replies.length === 0 ? (
                          <p className="text-center py-4 text-muted-foreground text-sm">
                            No replies yet. Be the first to respond!
                          </p>
                        ) : (
                          <div className="space-y-4 mt-2">
                            {replies.map((reply: any) => (
                              <div key={reply.id} className="p-3 rounded-md bg-background">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="font-medium">{reply.username || "Unknown"}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(reply.createdAt), "PPp")}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-line">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => openReplyDialog(notice)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Reply
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Notice</DialogTitle>
            <DialogDescription>
              {selectedNotice?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                placeholder="Write your reply here..."
                rows={5}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReply}
              disabled={!replyContent || replyToNoticeLoading}
            >
              {replyToNoticeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TavernBoard;