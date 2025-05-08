import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, UserSession } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DiceRoller, DiceType } from "@/components/dice-roll";
import { 
  Users, 
  UserPlus, 
  UserCog, 
  Beer, 
  ShieldQuestion, 
  DicesIcon, 
  Search, 
  Bell, 
  MessageSquare, 
  BookOpen, 
  Map, 
  Sword,
  Scroll,
  Crown,
  PlusCircle,
  Gamepad2,
  HeartHandshake
} from "lucide-react";

// Simulate tavern ambience with occasional events
const tavernEvents = [
  "A bard strums a lively tune in the corner.",
  "The innkeeper slides a frothy mug down the bar.",
  "A group of adventurers shares tales of their recent exploits.",
  "Two dwarves are engaged in an arm-wrestling contest.",
  "A hooded figure in the corner watches the room intently.",
  "The fireplace crackles, casting dancing shadows on the wall.",
  "A halfling tells an animated story, gesturing wildly.",
  "A wizard demonstrates a minor illusion spell to amused onlookers.",
  "The tavern cat stretches lazily before jumping onto a nearby table.",
  "A notice board filled with adventure requests catches your eye.",
  "A merchant displays exotic wares from distant lands.",
  "A tired courier enters, looking for someone to deliver a package.",
  "The smell of freshly baked bread wafts from the kitchen.",
  "Laughter erupts from a table playing a game of Dragon's Dice.",
  "An old veteran points out battle scars to wide-eyed novices."
];

// Simple tavern mini-games
const tavernGames = [
  {
    id: "dice-poker",
    name: "Dice Poker",
    description: "Roll five dice and aim for the best hand",
    difficulty: "Easy",
    players: "2-6",
    icon: <DicesIcon className="h-6 w-6" />
  },
  {
    id: "dragon-riddles",
    name: "Dragon's Riddles",
    description: "Test your wit against challenging fantasy riddles",
    difficulty: "Medium",
    players: "Any",
    icon: <ShieldQuestion className="h-6 w-6" />
  },
  {
    id: "tavern-brawl",
    name: "Tavern Brawl",
    description: "A casual combat simulation with special tavern rules",
    difficulty: "Medium",
    players: "2-8",
    icon: <Sword className="h-6 w-6" />
  },
  {
    id: "kings-cup",
    name: "King's Cup",
    description: "Draw cards and follow their mystical instructions",
    difficulty: "Easy",
    players: "3-10",
    icon: <Crown className="h-6 w-6" />
  }
];

// D&D Learning topics
const learningTopics = [
  {
    id: "character-creation",
    name: "Character Creation",
    description: "Learn how to craft a compelling character",
    icon: <UserCog className="h-6 w-6" />,
    level: "Beginner"
  },
  {
    id: "rules-basics",
    name: "Basic Rules",
    description: "The core mechanics that power your adventures",
    icon: <BookOpen className="h-6 w-6" />,
    level: "Beginner"
  },
  {
    id: "combat",
    name: "Combat Tactics",
    description: "Master the art of battle in D&D",
    icon: <Sword className="h-6 w-6" />,
    level: "Intermediate"
  },
  {
    id: "spellcasting",
    name: "Spellcasting",
    description: "Understand the magical arts and spell mechanics",
    icon: <Scroll className="h-6 w-6" />,
    level: "Intermediate"
  }
];

// Define user status types for display
type UserStatus = "online" | "looking-for-party" | "looking-for-friends" | "in-game" | "idle" | "offline";

const UserStatusBadge = ({ status }: { status: UserStatus }) => {
  const statusConfig = {
    online: { label: "Online", color: "bg-green-500" },
    "looking-for-party": { label: "Looking for Party", color: "bg-blue-500" },
    "looking-for-friends": { label: "Looking for Friends", color: "bg-purple-500" },
    "in-game": { label: "In Game", color: "bg-amber-500" },
    idle: { label: "Idle", color: "bg-gray-500" },
    offline: { label: "Offline", color: "bg-gray-400" }
  };
  
  const config = statusConfig[status] || statusConfig.offline;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} text-white`}>
      <span className={`w-2 h-2 rounded-full ${status !== 'offline' ? 'bg-white' : 'bg-gray-200'} mr-1`}></span>
      {config.label}
    </span>
  );
};

// Tavern Notice Board Item
interface NoticeProps {
  title: string;
  author: string;
  description: string;
  tags: string[];
  createdAt: Date;
  urgent?: boolean;
}

const TavernNotice = ({ title, author, description, tags, createdAt, urgent }: NoticeProps) => {
  return (
    <Card className={`mb-4 ${urgent ? 'border-red-500' : 'border-border'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medieval">{title}</CardTitle>
          {urgent && <Badge className="bg-red-500">Urgent</Badge>}
        </div>
        <CardDescription>Posted by {author} • {createdAt.toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm">{description}</p>
      </CardContent>
      <CardFooter className="pt-2 flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
        ))}
      </CardFooter>
    </Card>
  );
};

// Tavern patron representation (users in the tavern)
interface TavernPatronProps {
  user: {
    id: number;
    username: string;
    status: UserStatus;
    level?: number;
    class?: string;
    race?: string;
    lastActive?: Date;
  };
  onInvite?: (userId: number) => void;
  onMessage?: (userId: number) => void;
}

const TavernPatron = ({ user, onInvite, onMessage }: TavernPatronProps) => {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-accent/10 rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{user.username}</div>
          <div className="text-xs text-muted-foreground">
            {user.level && user.class && user.race ? 
              `Level ${user.level} ${user.race} ${user.class}` : 
              `New adventurer`}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <UserStatusBadge status={user.status} />
        <div className="flex">
          {onMessage && (
            <Button variant="ghost" size="icon" onClick={() => onMessage(user.id)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          {onInvite && user.status !== "offline" && (
            <Button variant="ghost" size="icon" onClick={() => onInvite(user.id)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Tavern Lobby component
export default function TavernLobby() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentEvent, setCurrentEvent] = useState<string>(tavernEvents[0]);
  const [lookingForParty, setLookingForParty] = useState(false);
  const [lookingForFriends, setLookingForFriends] = useState(false);
  const [showNewNoticeDialog, setShowNewNoticeDialog] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    description: "",
    tags: "",
    urgent: false
  });
  
  // Query online users and their statuses
  const { data: onlineUsers, isLoading: loadingUsers } = useQuery<UserSession[]>({
    queryKey: ["/api/users/online"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Query users specifically looking for a party
  const { data: usersLookingForParty } = useQuery<UserSession[]>({
    queryKey: ["/api/users/looking-for-party"],
    refetchInterval: 30000,
  });
  
  // Query users looking for friends
  const { data: usersLookingForFriends } = useQuery<UserSession[]>({
    queryKey: ["/api/users/looking-for-friends"],
    refetchInterval: 30000,
  });
  
  // Fetch tavern notices
  const tavernNotices: NoticeProps[] = [
    {
      title: "Seasoned DM seeking players",
      author: "DragonLord42",
      description: "Experienced DM looking for 3-5 players for a long-term campaign. Beginners welcome!",
      tags: ["dm-seeking-players", "beginner-friendly", "long-term"],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      title: "Need replacement player ASAP!",
      author: "CriticalMiss",
      description: "Our rogue had to drop out. Looking for a level 5 replacement for tomorrow's session.",
      tags: ["emergency", "level-5", "replacement"],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      urgent: true
    },
    {
      title: "New players seeking patient DM",
      author: "TotalNewbie",
      description: "Three friends wanting to try D&D for the first time. Looking for a DM who can guide us.",
      tags: ["newbies", "seeking-dm", "learn-to-play"],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      title: "One-shot adventure this weekend",
      author: "WeekendWarrior",
      description: "Running a 4-hour one-shot on Saturday. Level 3 characters, pre-made available.",
      tags: ["one-shot", "weekend", "level-3"],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    }
  ];
  
  // Mutation to update user status
  const updateStatusMutation = useMutation({
    mutationFn: async (updates: { lookingForParty?: boolean, lookingForFriends?: boolean }) => {
      const res = await apiRequest("POST", "/api/users/status", updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/online"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/looking-for-party"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/looking-for-friends"] });
      
      toast({
        title: "Status Updated",
        description: "Your tavern status has been updated successfully.",
      });
    }
  });
  
  // Update status when toggles change
  useEffect(() => {
    if (user) {
      updateStatusMutation.mutate({ 
        lookingForParty, 
        lookingForFriends 
      });
    }
  }, [lookingForParty, lookingForFriends, user]);
  
  // Create random tavern events at intervals
  useEffect(() => {
    const randomEvent = () => {
      const randomIndex = Math.floor(Math.random() * tavernEvents.length);
      setCurrentEvent(tavernEvents[randomIndex]);
    };
    
    // Initial random event
    randomEvent();
    
    // Change event every 30-60 seconds
    const eventInterval = setInterval(() => {
      randomEvent();
    }, Math.floor(Math.random() * 30000) + 30000);
    
    return () => clearInterval(eventInterval);
  }, []);
  
  // Handle invite to campaign/party
  const handleInviteUser = (userId: number) => {
    toast({
      title: "Invitation Sent",
      description: "Your invitation has been sent to the adventurer.",
      variant: "default",
    });
  };
  
  // Handle messaging a user
  const handleMessageUser = (userId: number) => {
    toast({
      title: "Message Feature",
      description: "Direct messaging will be available in a future update.",
      variant: "default",
    });
  };
  
  // Handle creating a new notice
  const handleCreateNotice = () => {
    if (!newNotice.title || !newNotice.description) {
      toast({
        title: "Invalid Notice",
        description: "Please provide both a title and description.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Notice Posted",
      description: "Your notice has been posted to the tavern board.",
      variant: "default",
    });
    
    setShowNewNoticeDialog(false);
    setNewNotice({
      title: "",
      description: "",
      tags: "",
      urgent: false
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      {/* Tavern Header */}
      <div className="bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-amber-950/90">
        <div className="bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik0yMCAyMGgyMHYyMGgtMjB6Ii8+PC9nPjwvc3ZnPg==')] text-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <Beer className="h-16 w-16 mx-auto mb-4 text-amber-300" />
            <h1 className="text-3xl md:text-5xl font-medieval mb-3 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-400">The Inn Between Worlds</h1>
            <p className="text-lg max-w-2xl mx-auto text-amber-100">
              Welcome, adventurer! This is where heroes meet, stories begin, and legends are born.
            </p>
            <div className="mt-6 italic text-amber-300 text-sm max-w-xl mx-auto border-t border-b border-amber-700/50 py-3">
              {currentEvent}
            </div>
          </div>
        </div>
      </div>
      
      {/* User Status Bar */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback>{user?.username?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user?.username}</div>
              <div className="text-sm text-muted-foreground">Inn Traveler</div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="looking-for-party"
                checked={lookingForParty}
                onCheckedChange={setLookingForParty}
              />
              <Label htmlFor="looking-for-party" className="text-sm whitespace-nowrap">
                <Users className="h-4 w-4 inline-block mr-1" />
                Looking for a Party
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="looking-for-friends"
                checked={lookingForFriends}
                onCheckedChange={setLookingForFriends}
              />
              <Label htmlFor="looking-for-friends" className="text-sm whitespace-nowrap">
                <HeartHandshake className="h-4 w-4 inline-block mr-1" />
                Looking for Friends
              </Label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Tavern Content */}
      <div className="flex-grow container mx-auto px-4 py-6">
        <Tabs defaultValue="patrons" className="w-full">
          <TabsList className="w-full justify-start mb-6 overflow-auto">
            <TabsTrigger value="patrons">
              <Users className="h-4 w-4 mr-2" />
              Inn Travelers
            </TabsTrigger>
            <TabsTrigger value="notice-board">
              <Map className="h-4 w-4 mr-2" />
              Notice Board
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="h-4 w-4 mr-2" />
              Inn Games
            </TabsTrigger>
            <TabsTrigger value="learning">
              <BookOpen className="h-4 w-4 mr-2" />
              Learning Corner
            </TabsTrigger>
          </TabsList>
          
          {/* Tavern Patrons Tab */}
          <TabsContent value="patrons" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-medieval">Fellow Adventurers</h2>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search patrons..." 
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Looking for Party Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Looking for Party
                  </CardTitle>
                  <CardDescription>Adventurers ready to join a campaign</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {loadingUsers ? (
                    <div className="text-center p-4">Loading patrons...</div>
                  ) : usersLookingForParty && usersLookingForParty.length > 0 ? (
                    <ScrollArea className="h-[360px]">
                      <div className="space-y-2">
                        {usersLookingForParty.map((session) => (
                          <TavernPatron 
                            key={session.userId} 
                            user={{
                              id: session.userId,
                              username: session.user?.username || "Unknown",
                              status: "looking-for-party",
                              lastActive: session.lastActive || new Date()
                            }}
                            onInvite={handleInviteUser}
                            onMessage={handleMessageUser}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No adventurers currently looking for a party.</p>
                      <p className="text-sm mt-2">Be the first to set your status!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Looking for Friends Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <HeartHandshake className="h-5 w-5 mr-2 text-purple-500" />
                    Looking for Friends
                  </CardTitle>
                  <CardDescription>Players interested in making connections</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {loadingUsers ? (
                    <div className="text-center p-4">Loading patrons...</div>
                  ) : usersLookingForFriends && usersLookingForFriends.length > 0 ? (
                    <ScrollArea className="h-[360px]">
                      <div className="space-y-2">
                        {usersLookingForFriends.map((session) => (
                          <TavernPatron 
                            key={session.userId} 
                            user={{
                              id: session.userId,
                              username: session.user?.username || "Unknown",
                              status: "looking-for-friends",
                              lastActive: session.lastActive || new Date()
                            }}
                            onInvite={handleInviteUser}
                            onMessage={handleMessageUser}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <HeartHandshake className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No adventurers currently looking for friends.</p>
                      <p className="text-sm mt-2">Be the first to set your status!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* All Online Users */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Beer className="h-5 w-5 mr-2 text-amber-500" />
                    All Inn Travelers
                  </CardTitle>
                  <CardDescription>Everyone currently in the inn</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {loadingUsers ? (
                    <div className="text-center p-4">Loading patrons...</div>
                  ) : onlineUsers && onlineUsers.length > 0 ? (
                    <ScrollArea className="h-[360px]">
                      <div className="space-y-2">
                        {onlineUsers.map((session) => (
                          <TavernPatron 
                            key={session.userId} 
                            user={{
                              id: session.userId,
                              username: session.user?.username || "Unknown",
                              status: "online",
                              lastActive: session.lastActive || new Date()
                            }}
                            onInvite={handleInviteUser}
                            onMessage={handleMessageUser}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <Beer className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>The inn seems quiet right now.</p>
                      <p className="text-sm mt-2">Check back later for more travelers!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Notice Board Tab */}
          <TabsContent value="notice-board" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-medieval">Tavern Notice Board</h2>
              <Button onClick={() => setShowNewNoticeDialog(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Post Notice
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medieval border-b pb-2">Recent Notices</h3>
                {tavernNotices
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .slice(0, 3)
                  .map((notice, idx) => (
                    <TavernNotice key={idx} {...notice} />
                  ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medieval border-b pb-2">Urgent Requests</h3>
                {tavernNotices
                  .filter(notice => notice.urgent)
                  .map((notice, idx) => (
                    <TavernNotice key={idx} {...notice} />
                  ))}
                
                <h3 className="text-lg font-medieval border-b pb-2 mt-8">Looking for Players</h3>
                {tavernNotices
                  .filter(notice => notice.tags.some(tag => 
                    tag.includes("dm-seeking") || tag.includes("seeking-players")
                  ))
                  .map((notice, idx) => (
                    <TavernNotice key={idx} {...notice} />
                  ))}
              </div>
            </div>

            {/* New Notice Dialog */}
            <Dialog open={showNewNoticeDialog} onOpenChange={setShowNewNoticeDialog}>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Post a Notice</DialogTitle>
                  <DialogDescription>
                    Share your request with fellow adventurers on the tavern notice board.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="notice-title">Title</Label>
                    <Input
                      id="notice-title"
                      placeholder="e.g., 'Experienced DM seeking players'"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notice-description">Description</Label>
                    <Textarea
                      id="notice-description"
                      placeholder="Provide details about your request..."
                      value={newNotice.description}
                      onChange={(e) => setNewNotice({ ...newNotice, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notice-tags">Tags (comma separated)</Label>
                    <Input
                      id="notice-tags"
                      placeholder="e.g., beginner-friendly, long-term, dm-needed"
                      value={newNotice.tags}
                      onChange={(e) => setNewNotice({ ...newNotice, tags: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notice-urgent"
                      checked={newNotice.urgent}
                      onCheckedChange={(checked) => setNewNotice({ ...newNotice, urgent: checked })}
                    />
                    <Label htmlFor="notice-urgent">Mark as urgent</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewNoticeDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNotice}>Post Notice</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Tavern Games Tab */}
          <TabsContent value="games" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-medieval mb-2">Tavern Games</h2>
              <p className="text-muted-foreground">
                Test your luck and skill with these popular tavern pastimes!
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tavernGames.map(game => (
                <Card key={game.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <div className="mr-2 text-primary">{game.icon}</div>
                      {game.name}
                    </CardTitle>
                    <CardDescription>{game.players} players</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{game.description}</p>
                    <Badge className="mt-2">{game.difficulty}</Badge>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        toast({
                          title: game.name,
                          description: "This game will be available in a future update.",
                          variant: "default",
                        });
                      }}
                    >
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Play Game
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-medieval mb-4">Quick Dice Roll</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="p-4 bg-muted/20 rounded-lg text-center">
                    <DicesIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="text-lg font-medieval">Tavern Dice</h3>
                    <p className="text-sm text-muted-foreground mb-4">Roll some dice and test your luck!</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((diceType) => (
                        <Button 
                          key={diceType} 
                          variant="outline"
                          onClick={() => {
                            const result = Math.floor(Math.random() * parseInt(diceType.substring(1))) + 1;
                            toast({
                              title: `Rolled a ${diceType}`,
                              description: `Result: ${result}`,
                              variant: "default",
                            });
                          }}
                        >
                          {diceType}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Learning Corner Tab */}
          <TabsContent value="learning" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-medieval mb-2">Learning Corner</h2>
              <p className="text-muted-foreground">
                New to D&D? Start your journey with these essential guides.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {learningTopics.map(topic => (
                <Card key={topic.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <div className="mr-2 text-primary">{topic.icon}</div>
                      {topic.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge>{topic.level}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{topic.description}</p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        window.location.href = "/learn";
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Guide
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 bg-muted/30 rounded-lg p-6">
              <h3 className="text-xl font-medieval mb-2">Ask the Barkeep</h3>
              <p className="mb-4">
                Have a specific question about D&D? Our knowledgeable barkeep can help.
              </p>
              <div className="flex gap-2">
                <Input placeholder="Ask anything about D&D gameplay..." className="flex-grow" />
                <Button onClick={() => {
                  toast({
                    title: "The Barkeep Says...",
                    description: "This feature will be available in a future update.",
                    variant: "default",
                  });
                }}>
                  Ask
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Tavern Footer */}
      <footer className="bg-muted/30 border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <Beer className="h-4 w-4 inline-block mr-1" />
              The Quest Tavern — Where adventures begin and legends gather
            </p>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = "/campaigns/create"}
              >
                <Sword className="h-4 w-4 mr-1" />
                Start a Campaign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/characters/create"}
              >
                <UserCog className="h-4 w-4 mr-1" />
                Create Character
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}