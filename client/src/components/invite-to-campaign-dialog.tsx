import { useState } from "react";
import { useFriendships } from "@/hooks/use-friendships";
import { useCampaignInvitations } from "@/hooks/use-campaign-invitations";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OnlineStatusBadge } from "@/components/online-status-selector";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, Search, UserPlus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface InviteToCampaignDialogProps {
  campaignId: number;
  campaignName: string;
}

export const InviteToCampaignDialog = ({ 
  campaignId,
  campaignName
}: InviteToCampaignDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [inviteRole, setInviteRole] = useState<"player" | "spectator">("player");
  
  const { acceptedFriendships } = useFriendships();
  const { getUserStatus } = useOnlineStatus();
  const { sendInvitationMutation } = useCampaignInvitations();

  // Filter the friends based on search text
  const filteredFriends = searchText.trim() === "" 
    ? acceptedFriendships 
    : acceptedFriendships.filter(f => 
        f.userId.toString().includes(searchText) || 
        f.friendId.toString().includes(searchText)
      );

  const handleSendInvitation = async () => {
    if (!selectedFriendId) {
      toast({
        title: "Error",
        description: "Please select a friend to invite",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendInvitationMutation.mutateAsync({
        campaignId,
        inviteeId: selectedFriendId,
        role: inviteRole
      });
      
      setOpen(false);
      setSelectedFriendId(null);
      setInviteRole("player");
    } catch (error) {
      console.error("Failed to send invitation:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Invite to Campaign</DialogTitle>
          <DialogDescription>
            Invite your friends to join "{campaignName}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search friends..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="border rounded-md">
            {acceptedFriendships.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No friends to invite</p>
                <p className="text-sm">Add friends to invite them to your campaign</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Friend</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFriends.map((friendship) => {
                    // Get the friend ID (not the current user's ID)
                    const currentUserId = (window as any).__INITIAL_STATE__?.user?.id;
                    const friendId = friendship.userId === currentUserId 
                      ? friendship.friendId 
                      : friendship.userId;
                    
                    return (
                      <TableRow 
                        key={friendship.id}
                        className={`cursor-pointer ${selectedFriendId === friendId ? 'bg-accent' : ''}`}
                        onClick={() => setSelectedFriendId(friendId)}
                      >
                        <TableCell>
                          {selectedFriendId === friendId && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </TableCell>
                        <TableCell>User #{friendId}</TableCell>
                        <TableCell>
                          <OnlineStatusBadge userId={friendId} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Invite as:</h4>
            <RadioGroup 
              value={inviteRole} 
              onValueChange={(value) => setInviteRole(value as "player" | "spectator")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="player" id="player" />
                <Label htmlFor="player">Player</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spectator" id="spectator" />
                <Label htmlFor="spectator">Spectator</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Players can participate in the game with a character. Spectators can only watch.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSendInvitation} 
            disabled={!selectedFriendId || sendInvitationMutation.isPending}
          >
            {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};