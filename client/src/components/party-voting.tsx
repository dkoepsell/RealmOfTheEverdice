import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Clock,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Users,
  Vote,
  Send,
  Timer
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Types for the component
interface PartyVotingProps {
  campaignId: number;
  onVoteComplete?: (result: boolean) => void;
}

type VoteOption = 'yes' | 'no' | 'abstain';

interface VoteData {
  id: number;
  campaignId: number;
  title: string;
  description: string; 
  createdById: number;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  result: boolean | null;
  expiresAt: Date | null;
}

interface VoteResponse {
  id: number;
  voteId: number;
  userId: number;
  username?: string;
  response: VoteOption;
  votedAt: Date;
}

// Form schema
const createVoteSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  expiresInMinutes: z.number().min(1).max(60).default(10)
});

export function PartyVoting({ campaignId, onVoteComplete }: PartyVotingProps) {
  const { toast } = useToast();
  const [activeVoteId, setActiveVoteId] = useState<number | null>(null);
  const [createVoteOpen, setCreateVoteOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [myVote, setMyVote] = useState<VoteOption | null>(null);
  
  // Create form
  const form = useForm<z.infer<typeof createVoteSchema>>({
    resolver: zodResolver(createVoteSchema),
    defaultValues: {
      title: "",
      description: "",
      expiresInMinutes: 10
    }
  });
  
  // Mock data - in a real implementation this would come from the API
  const mockActiveVote: VoteData = {
    id: 1,
    campaignId,
    title: "Split the party to investigate both caves?",
    description: "The party has encountered two cave entrances. Should we split up to investigate both simultaneously, or stay together and check them one at a time?",
    createdById: 1,
    createdAt: new Date(),
    status: 'active',
    result: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  };
  
  const mockVoteResponses: VoteResponse[] = [
    { id: 1, voteId: 1, userId: 1, username: "Elrond", response: 'yes', votedAt: new Date() },
    { id: 2, voteId: 1, userId: 2, username: "Gandalf", response: 'no', votedAt: new Date() },
    { id: 3, voteId: 1, userId: 3, username: "Gimli", response: 'yes', votedAt: new Date() }
  ];
  
  const mockCompletedVotes: VoteData[] = [
    {
      id: 2,
      campaignId,
      title: "Rest for the night at the tavern?",
      description: "The party is low on health and spell slots. Should we rest at the tavern before proceeding to the dungeon?",
      createdById: 2,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed',
      result: true,
      expiresAt: null
    },
    {
      id: 3,
      campaignId,
      title: "Accept the merchant's quest?",
      description: "A merchant has offered us 500 gold to recover his stolen goods from bandits. Should we accept?",
      createdById: 3,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'completed',
      result: false,
      expiresAt: null
    }
  ];
  
  // In a real implementation, we'd fetch active votes and vote history
  const { 
    data: activeVote = mockActiveVote, 
    isLoading: activeVoteLoading 
  } = useQuery({
    queryKey: ['/api/mock/active-vote'],
    enabled: false // Disabled for mock implementation
  });
  
  const {
    data: voteResponses = mockVoteResponses,
    isLoading: responsesLoading
  } = useQuery({
    queryKey: ['/api/mock/vote-responses'],
    enabled: false // Disabled for mock implementation
  });
  
  const {
    data: completedVotes = mockCompletedVotes,
    isLoading: historyLoading
  } = useQuery({
    queryKey: ['/api/mock/vote-history'],
    enabled: false // Disabled for mock implementation
  });
  
  // Get vote results
  const getVoteResults = (responses: VoteResponse[]) => {
    const counts = {
      yes: responses.filter(r => r.response === 'yes').length,
      no: responses.filter(r => r.response === 'no').length,
      abstain: responses.filter(r => r.response === 'abstain').length,
      total: responses.length
    };
    
    return counts;
  };
  
  const formatTimeRemaining = (expiresAt: Date | null) => {
    if (!expiresAt) return "No time limit";
    
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };
  
  // Submit vote (mock implementation)
  const handleVote = (vote: VoteOption) => {
    // In a real implementation, this would be a mutation
    setMyVote(vote);
    
    toast({
      title: "Vote Submitted",
      description: `You voted ${vote} on "${activeVote.title}"`,
    });
    
    // For demo purposes, show results after voting
    setShowResults(true);
    
    // In a real implementation, this would refetch the responses
  };
  
  // Create new vote (mock implementation)
  const onSubmit = (data: z.infer<typeof createVoteSchema>) => {
    // In a real implementation, this would be a mutation
    toast({
      title: "Vote Created",
      description: `Your vote "${data.title}" has been created`,
    });
    
    setCreateVoteOpen(false);
    form.reset();
    
    // In a real implementation, this would refetch the active vote
  };
  
  // Get the percentage for a given vote option
  const getPercentage = (option: VoteOption) => {
    const results = getVoteResults(voteResponses);
    if (results.total === 0) return 0;
    
    switch (option) {
      case 'yes':
        return Math.round((results.yes / results.total) * 100);
      case 'no':
        return Math.round((results.no / results.total) * 100);
      case 'abstain':
        return Math.round((results.abstain / results.total) * 100);
    }
  };
  
  // Check if there's a majority vote
  const hasMajority = (option: VoteOption) => {
    const results = getVoteResults(voteResponses);
    return option === 'yes' && results.yes > results.total / 2;
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            <Vote className="mr-2 h-4 w-4" /> Active Votes
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" /> Vote History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4 pt-4">
          {activeVoteLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-5 bg-accent/20 rounded w-3/4"></div>
              <div className="h-20 bg-accent/10 rounded"></div>
              <div className="h-10 bg-accent/20 rounded w-full"></div>
            </div>
          ) : activeVote ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{activeVote.title}</CardTitle>
                    <CardDescription>
                      Created {new Date(activeVote.createdAt).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center text-sm bg-primary/10 text-primary rounded-full px-3 py-1">
                    <Timer className="h-4 w-4 mr-1" />
                    {formatTimeRemaining(activeVote.expiresAt)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="mb-4">{activeVote.description}</p>
                
                {showResults ? (
                  <div className="space-y-4">
                    <h4 className="font-medieval text-lg">Current Results</h4>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`rounded-lg p-3 ${
                        hasMajority('yes') ? 'bg-success/20 border border-success' : 'bg-accent/10'
                      }`}>
                        <ThumbsUp className="h-6 w-6 mx-auto mb-1 text-success" />
                        <div className="text-xl font-bold">{getPercentage('yes')}%</div>
                        <div className="text-xs text-muted-foreground">
                          {voteResponses.filter(r => r.response === 'yes').length} votes
                        </div>
                      </div>
                      
                      <div className="rounded-lg p-3 bg-accent/10">
                        <ThumbsDown className="h-6 w-6 mx-auto mb-1 text-destructive" />
                        <div className="text-xl font-bold">{getPercentage('no')}%</div>
                        <div className="text-xs text-muted-foreground">
                          {voteResponses.filter(r => r.response === 'no').length} votes
                        </div>
                      </div>
                      
                      <div className="rounded-lg p-3 bg-accent/10">
                        <HelpCircle className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xl font-bold">{getPercentage('abstain')}%</div>
                        <div className="text-xs text-muted-foreground">
                          {voteResponses.filter(r => r.response === 'abstain').length} votes
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medieval text-lg mb-2">Individual Votes</h4>
                      <div className="space-y-1 border rounded-md p-2">
                        {voteResponses.map(response => (
                          <div key={response.id} className="flex justify-between items-center text-sm">
                            <span>{response.username}</span>
                            <span>
                              {response.response === 'yes' && <ThumbsUp className="h-4 w-4 text-success inline-block" />}
                              {response.response === 'no' && <ThumbsDown className="h-4 w-4 text-destructive inline-block" />}
                              {response.response === 'abstain' && <HelpCircle className="h-4 w-4 text-muted-foreground inline-block" />}
                              <span className="ml-1">{response.response}</span>
                            </span>
                          </div>
                        ))}
                        
                        {voteResponses.length === 0 && (
                          <div className="text-center text-muted-foreground py-2">
                            No votes yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-medieval text-lg">Cast Your Vote</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        className="bg-success/20 hover:bg-success/30 text-success border border-success"
                        size="lg"
                        onClick={() => handleVote('yes')}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" /> Yes
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleVote('no')}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" /> No
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="lg"
                        onClick={() => handleVote('abstain')}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" /> Abstain
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {voteResponses.length} vote{voteResponses.length !== 1 && 's'}
                </div>
                
                <div>
                  {showResults ? (
                    <Button variant="outline" onClick={() => setShowResults(false)}>
                      Hide Results
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setShowResults(true)}>
                      View Results
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-medieval">No Active Votes</CardTitle>
                <CardDescription>
                  There are no decisions currently being voted on by the party
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <Vote className="h-16 w-16 mx-auto mb-4 text-accent/50" />
                <p className="text-muted-foreground mb-4">
                  When facing important decisions, create a vote to let the party decide collectively
                </p>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-center mt-6">
            <Dialog open={createVoteOpen} onOpenChange={setCreateVoteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Vote className="mr-2 h-4 w-4" /> Create New Vote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Party Vote</DialogTitle>
                  <DialogDescription>
                    Let your party vote on an important decision
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vote Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Should we explore the northern cave?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Provide details about the decision..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expiresInMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              max={60}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            How long should voting remain open?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Create Vote</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 pt-4">
          {historyLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-accent/10 rounded"></div>
              <div className="h-20 bg-accent/10 rounded"></div>
            </div>
          ) : completedVotes && completedVotes.length > 0 ? (
            <div className="space-y-3">
              {completedVotes.map(vote => (
                <Card key={vote.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          {vote.title}
                          {vote.result !== null && (
                            vote.result ? (
                              <CheckCircle2 className="ml-2 h-5 w-5 text-success" />
                            ) : (
                              <CircleX className="ml-2 h-5 w-5 text-destructive" />
                            )
                          )}
                        </CardTitle>
                        <CardDescription>
                          {new Date(vote.createdAt).toLocaleDateString()} at {new Date(vote.createdAt).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <div className="text-sm font-medium rounded-full px-3 py-1 bg-muted">
                        Result: {vote.result === true ? 'Passed' : vote.result === false ? 'Failed' : 'No result'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{vote.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Vote History</CardTitle>
                <CardDescription>
                  Your party hasn't completed any votes yet
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <Clock className="h-16 w-16 mx-auto mb-4 text-accent/50" />
                <p className="text-muted-foreground">
                  Past votes will appear here once they're completed
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PartyVoting;