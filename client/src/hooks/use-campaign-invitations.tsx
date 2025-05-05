import { useQuery, useMutation } from "@tanstack/react-query";
import { CampaignInvitation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCampaignInvitations() {
  const { toast } = useToast();
  
  // Get user's campaign invitations
  const { 
    data: invitations = [], 
    isLoading: isLoadingInvitations,
    error: invitationsError
  } = useQuery({
    queryKey: ["/api/invitations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invitations");
      return await res.json() as CampaignInvitation[];
    }
  });

  // Get pending invitations only
  const pendingInvitations = invitations.filter(inv => inv.status === "pending");

  // Send campaign invitation
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ 
      campaignId, 
      inviteeId, 
      role = "player" 
    }: { 
      campaignId: number; 
      inviteeId: number; 
      role?: "player" | "spectator"; 
    }) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/invitations`, {
        inviteeId,
        role
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Campaign invitation has been sent successfully.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept campaign invitation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest("PUT", `/api/invitations/${invitationId}`, {
        status: "accepted"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation accepted",
        description: "You have joined the campaign.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject campaign invitation
  const rejectInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest("PUT", `/api/invitations/${invitationId}`, {
        status: "rejected"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation rejected",
        description: "You have declined the campaign invitation.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel/delete campaign invitation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      await apiRequest("DELETE", `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The campaign invitation has been cancelled.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    invitations,
    pendingInvitations,
    isLoadingInvitations,
    invitationsError,
    sendInvitationMutation,
    acceptInvitationMutation,
    rejectInvitationMutation,
    deleteInvitationMutation
  };
}