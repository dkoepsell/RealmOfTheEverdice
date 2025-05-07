import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bot, 
  User, 
  MessageSquareText, 
  BookOpen, 
  Info, 
  Shield, 
  Sword, 
  Sparkles 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Character } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface BotCompanionProps {
  campaignId: number;
  characterName?: string;
  className?: string;
  compendiumMode?: boolean;
}

interface BotMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  type: 'message' | 'info' | 'rule' | 'lore';
}

// Example bot companions
const BOT_COMPANIONS = [
  {
    id: 1,
    name: "Sage Eldrin",
    role: "Loremaster",
    description: "A wise elven scholar who can share knowledge of D&D lore and history.",
    avatar: "🧙‍♂️",
    specialties: ["D&D History", "World Lore", "Mythology"]
  },
  {
    id: 2,
    name: "Bron Ironfist",
    role: "Combat Advisor",
    description: "A battle-hardened dwarf warrior with deep knowledge of combat tactics.",
    avatar: "⚔️",
    specialties: ["Combat Rules", "Tactics", "Weapons & Armor"]
  },
  {
    id: 3,
    name: "Lily Whisperwind",
    role: "Mechanics Helper",
    description: "A cheerful halfling who explains D&D mechanics in simple, clear terms.",
    avatar: "📖",
    specialties: ["Game Mechanics", "Character Building", "Spell Explanations"]
  }
];

export function BotCompanion({ campaignId, characterName, compendiumMode = false, className = "" }: BotCompanionProps) {
  const [selectedBot, setSelectedBot] = useState(BOT_COMPANIONS[0]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const { toast } = useToast();
  
  // Sample message history
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      content: `Hello! I'm ${BOT_COMPANIONS[0].name}, your D&D ${BOT_COMPANIONS[0].role}. How can I assist you today?`,
      timestamp: new Date(),
      type: "message"
    }
  ]);

  // Fetch bot character data (if exists)
  const { data: botCharacters } = useQuery<Character[]>({
    queryKey: ["/api/campaigns", campaignId, "bot-characters"],
    enabled: !!campaignId,
  });

  // Create bot companion mutation
  const createBotMutation = useMutation({
    mutationFn: async (botInfo: { name: string, role: string, campaignId: number }) => {
      const res = await apiRequest("POST", "/api/bot-companions", botInfo);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "bot-characters"] });
      toast({
        title: "Bot companion created",
        description: "Your new companion is ready to join your adventure!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create bot companion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ask bot question mutation
  const askBotMutation = useMutation({
    mutationFn: async (data: { message: string, botId: number, context: string }) => {
      const res = await apiRequest("POST", "/api/bot-companion/query", {
        query: data.message,
        companionId: data.botId,
        campaignId: campaignId
      });
      return await res.json();
    },
    onSuccess: (response) => {
      const newMessage: BotMessage = {
        id: Date.now().toString(),
        sender: "bot",
        content: response.message || response.response || "I'm not sure how to answer that.",
        timestamp: new Date(),
        type: response.type || "message"
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to get bot response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: BotMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: message,
      timestamp: new Date(),
      type: "message"
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to bot and get response
    askBotMutation.mutate({ 
      message: message, 
      botId: selectedBot.id,
      context: "current_campaign" 
    });
  };

  const handleSelectBot = (bot: typeof BOT_COMPANIONS[0]) => {
    setSelectedBot(bot);
    setMessages([{
      id: "welcome",
      sender: "bot",
      content: `Hello! I'm ${bot.name}, your D&D ${bot.role}. How can I assist you today?`,
      timestamp: new Date(),
      type: "message"
    }]);
  };

  return (
    <Card className={`shadow-md bg-amber-50/40 border-amber-200/60 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medieval text-amber-900">
            <Bot className="h-5 w-5 inline mr-2 text-amber-700" />
            Bot Companion
          </CardTitle>
          <Badge variant="outline" className="bg-amber-100/50 text-amber-800 border-amber-300">
            {activeTab === "chat" ? "Conversation" : "Companions"}
          </Badge>
        </div>
        <CardDescription className="text-amber-700/80">
          Your helpful D&D guide and assistant
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-amber-100/50 text-amber-800">
          <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-amber-200/50">
            <MessageSquareText className="h-4 w-4 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="companions" className="flex-1 data-[state=active]:bg-amber-200/50">
            <User className="h-4 w-4 mr-1" />
            Companions
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex-1 data-[state=active]:bg-amber-200/50">
            <BookOpen className="h-4 w-4 mr-1" />
            Knowledge
          </TabsTrigger>
        </TabsList>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0 border-none p-0">
          <div className="flex items-center p-3 bg-amber-100/30 border-t border-b border-amber-200/40">
            <Avatar className="h-8 w-8 mr-2 border border-amber-300 bg-amber-200">
              <AvatarFallback className="bg-amber-200 text-amber-900">
                {selectedBot.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">{selectedBot.name}</h4>
              <p className="text-xs text-amber-700">{selectedBot.role}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-sm max-w-xs">{selectedBot.description}</p>
                  <div className="mt-1 pt-1 border-t border-border">
                    <span className="text-xs font-semibold">Specialties:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedBot.specialties.map((specialty, i) => (
                        <Badge key={i} variant="secondary" className="text-xs py-0">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <ScrollArea className="h-[320px] p-3">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.sender === 'user' 
                        ? 'bg-amber-200/70 text-amber-900' 
                        : msg.type === 'rule' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : msg.type === 'lore' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : msg.type === 'info'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-white/90 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {msg.type !== 'message' && (
                      <div className="flex items-center mb-1">
                        {msg.type === 'rule' && <Shield className="h-3.5 w-3.5 mr-1 text-blue-600" />}
                        {msg.type === 'lore' && <BookOpen className="h-3.5 w-3.5 mr-1 text-purple-600" />}
                        {msg.type === 'info' && <Info className="h-3.5 w-3.5 mr-1 text-green-600" />}
                        <span className="text-xs font-semibold uppercase">
                          {msg.type === 'rule' ? 'Rule Reference' : msg.type === 'lore' ? 'Lore' : 'Info'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {askBotMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white/90 text-amber-900 border border-amber-200 max-w-[80%] px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <div className="h-2 w-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <CardFooter className="flex p-3 gap-2 border-t border-amber-200/40">
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your companion for help..."
              className="min-h-[60px] resize-none bg-white border border-amber-200 text-amber-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              className="bg-amber-700 hover:bg-amber-800 text-white h-full"
              onClick={handleSendMessage}
              disabled={askBotMutation.isPending}
            >
              Send
            </Button>
          </CardFooter>
        </TabsContent>
        
        {/* Companions Tab */}
        <TabsContent value="companions" className="mt-0 p-0">
          <ScrollArea className="h-[400px]">
            <div className="grid gap-2 p-3">
              {BOT_COMPANIONS.map((bot) => (
                <Card 
                  key={bot.id} 
                  className={`cursor-pointer hover:bg-amber-100/30 transition-colors ${
                    selectedBot.id === bot.id ? 'bg-amber-100/50 border-amber-300' : 'bg-white/80 border-amber-200/50'
                  }`}
                  onClick={() => handleSelectBot(bot)}
                >
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-lg mr-2">
                        {bot.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-900">{bot.name}</h3>
                        <p className="text-xs text-amber-700">{bot.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-sm text-amber-800 mb-2">{bot.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {bot.specialties.map((specialty, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-dashed border-amber-300/50 bg-amber-50/30">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-base text-amber-800">Create Custom Companion</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Companion Name" 
                      className="bg-white/80 border-amber-200"
                    />
                    <Input 
                      placeholder="Role (e.g., Loremaster, Rule Expert)" 
                      className="bg-white/80 border-amber-200"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" disabled={createBotMutation.isPending}>
                        <Sparkles className="h-4 w-4 mr-1" />
                        Create
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="mt-0 p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-3 space-y-3">
              {/* Categories */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 justify-start">
                  <Sword className="h-4 w-4 mr-2" />
                  Combat Rules
                </Button>
                <Button variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 justify-start">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Spells & Magic
                </Button>
                <Button variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Classes & Races
                </Button>
                <Button variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Equipment
                </Button>
              </div>
              
              {/* Recent Questions */}
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-2">Recent Questions</h3>
                <div className="space-y-2">
                  <Card className="bg-white/90 border-amber-200/50">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm text-amber-900">How does initiative work?</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-amber-700">
                        Initiative determines the order of turns during combat. Each participant makes a Dexterity check to determine their place in the initiative order.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/90 border-amber-200/50">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm text-amber-900">What is an attack of opportunity?</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-amber-700">
                        When a creature you can see moves out of your reach, you can use your reaction to make one melee attack against it.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}