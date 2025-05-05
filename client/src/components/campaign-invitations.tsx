import { useState } from "react";
import { useCampaignInvitations } from "@/hooks/use-campaign-invitations";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, ScrollText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const CampaignInvitations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    invitations,
    pendingInvitations,
    isLoadingInvitations,
    acceptInvitationMutation,
    rejectInvitationMutation,
  } = useCampaignInvitations();

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await acceptInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    try {
      await rejectInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      console.error("Failed to reject invitation:", error);
    }
  };

  if (isLoadingInvitations) {
    return <div className="p-4">Loading invitations...</div>;
  }

  if (pendingInvitations.length === 0) {
    return null; // Don't show the component if there are no pending invitations
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ScrollText className="h-5 w-5 mr-2" />
          Campaign Invitations
          <Badge variant="destructive" className="ml-2">
            {pendingInvitations.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          You have {pendingInvitations.length} pending campaign {pendingInvitations.length === 1 ? 'invitation' : 'invitations'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingInvitations.map((invitation) => (
            <div 
              key={invitation.id} 
              className="p-4 border rounded-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">Campaign Invitation</h4>
                  <p className="text-sm text-muted-foreground">
                    From User #{invitation.inviterId}
                  </p>
                </div>
                <Badge>
                  {invitation.role === "player" ? "Player" : "Spectator"}
                </Badge>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleRejectInvitation(invitation.id)}
                  disabled={rejectInvitationMutation.isPending}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={acceptInvitationMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};