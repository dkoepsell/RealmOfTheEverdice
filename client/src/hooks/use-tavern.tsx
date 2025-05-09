import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

export function useTavern() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get all notices
  const {
    data: notices = [],
    isLoading: isLoadingNotices,
    error: noticesError,
  } = useQuery({
    queryKey: ["/api/tavern/notices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tavern/notices");
      return await res.json();
    },
    enabled: !!user,
  });

  // Get notice replies
  const getNoticeReplies = (noticeId: number) => {
    return useQuery({
      queryKey: [`/api/tavern/notices/${noticeId}/replies`],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/tavern/notices/${noticeId}/replies`);
        return await res.json();
      },
      enabled: !!user && !!noticeId,
    });
  };

  // Create notice
  const createNoticeMutation = useMutation({
    mutationFn: async (notice: {
      title: string;
      content: string;
      type: string;
      expiresAt?: string;
    }) => {
      const res = await apiRequest("POST", "/api/tavern/notices", notice);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tavern/notices"] });
      toast({
        title: "Notice created",
        description: "Your notice has been posted to the tavern board.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create notice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reply to notice
  const replyToNoticeMutation = useMutation({
    mutationFn: async ({
      noticeId,
      content,
    }: {
      noticeId: number;
      content: string;
    }) => {
      const res = await apiRequest("POST", `/api/tavern/notices/${noticeId}/replies`, {
        content,
      });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tavern/notices/${variables.noticeId}/replies`],
      });
      toast({
        title: "Reply posted",
        description: "Your reply has been posted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    notices,
    isLoadingNotices,
    noticesError,
    getNoticeReplies,
    createNotice: createNoticeMutation.mutate,
    createNoticeLoading: createNoticeMutation.isPending,
    replyToNotice: replyToNoticeMutation.mutate,
    replyToNoticeLoading: replyToNoticeMutation.isPending,
  };
}