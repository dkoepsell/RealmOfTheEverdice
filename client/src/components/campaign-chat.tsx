import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SendHorizontal, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface ChatMessage {
  id: number;
  campaignId: number;
  userId: number;
  content: string;
  timestamp: Date | null;
  username?: string;
}

interface CampaignChatProps {
  campaignId: number;
  usernames: Record<number, string>;
}

export function CampaignChat({ campaignId, usernames }: CampaignChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Fetch chat messages
  const { data: messages, isLoading, refetch } = useQuery<ChatMessage[]>({
    queryKey: [`/api/campaigns/${campaignId}/chat`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/campaigns/${campaignId}/chat`);
      const data = await response.json();
      return data;
    },
    enabled: !!campaignId && !!user,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/chat`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/chat`] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!campaignId || !user) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      setIsConnected(true);
      
      // Join the campaign chat room
      socket.send(JSON.stringify({
        type: 'join',
        campaignId: campaignId,
        userId: user.id
      }));
      
      toast({
        title: "Connected",
        description: "Real-time chat connected",
        variant: "default",
      });
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      setIsConnected(false);
      
      toast({
        title: "Disconnected",
        description: "Chat connection lost. Refresh to reconnect.",
        variant: "destructive",
      });
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle chat messages
        if (data.type === 'chat') {
          setChatMessages(prev => [...prev, {
            id: data.messageId || Date.now(), // Use messageId if available, otherwise use timestamp
            campaignId: data.campaignId,
            userId: data.userId,
            content: data.message,
            timestamp: new Date(data.timestamp),
            username: data.username
          }]);
        }
        
        // Handle join confirmations
        if (data.type === 'join_confirm') {
          console.log('Joined campaign chat:', data.campaignId);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [campaignId, user, toast]);
  
  // Set chat messages when messages from API are loaded
  useEffect(() => {
    if (messages) {
      setChatMessages(messages);
    }
  }, [messages]);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  
  // Handle message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };
  
  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format message based on sender
  const getMessageDisplay = (msg: ChatMessage) => {
    const isCurrentUser = msg.userId === user?.id;
    const username = usernames[msg.userId] || "Unknown";
    
    return (
      <div 
        key={msg.id} 
        className={`mb-2 max-w-[80%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}
      >
        <div 
          className={`px-3 py-2 rounded-lg ${isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'}`}
        >
          {!isCurrentUser && (
            <div className="font-semibold text-xs mb-1">
              {username}
            </div>
          )}
          <div>{msg.content}</div>
        </div>
        <div 
          className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}
        >
          {formatTimestamp(msg.timestamp)}
        </div>
      </div>
    );
  };
  
  if (!user) return null;
  
  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm">
      <div className="p-3 border-b flex justify-between items-center bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Campaign Chat</h3>
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" title="Connected" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
          title="Refresh messages"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea ref={scrollAreaRef} className="flex-grow p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3 ml-auto" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        ) : chatMessages && chatMessages.length > 0 ? (
          <div>
            {chatMessages.map(getMessageDisplay)}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        )}
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow"
          disabled={sendMessageMutation.isPending}
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || sendMessageMutation.isPending}
        >
          <SendHorizontal className="h-4 w-4 mr-2" />
          Send
        </Button>
      </form>
    </div>
  );
}