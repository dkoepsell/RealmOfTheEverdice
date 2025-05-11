import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, BookOpen, Footprints, History, ChevronLeft, ChevronRight } from "lucide-react";

// Types for the backstory generation system
export interface BackstoryNode {
  id: string;
  text: string;
  choices?: BackstoryChoice[];
  ending?: boolean;
  tags?: string[];
}

export interface BackstoryChoice {
  text: string;
  nextNodeId: string;
  impact?: {
    alignment?: "lawful" | "chaotic" | "good" | "evil" | "neutral";
    personality?: Record<string, number>;
    background?: string[];
  };
}

export interface BackstoryState {
  currentNodeId: string;
  history: {
    nodeId: string;
    choiceText: string | null;
  }[];
  visitedNodes: Set<string>;
  personalityTraits: Record<string, number>;
  backgroundElements: string[];
  alignmentTendencies: {
    lawChaos: number; // -10 to 10, -10 is lawful, 10 is chaotic
    goodEvil: number; // -10 to 10, -10 is good, 10 is evil
  };
}

interface BackstoryGeneratorProps {
  race: string;
  characterClass: string;
  initialBackstory?: string;
  onBackstoryGenerated: (backstory: string, traits: Record<string, number>) => void;
}

export default function BackstoryGenerator({
  race,
  characterClass,
  initialBackstory,
  onBackstoryGenerated
}: BackstoryGeneratorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [backstoryTree, setBackstoryTree] = useState<Record<string, BackstoryNode>>({});
  const [state, setState] = useState<BackstoryState>({
    currentNodeId: "start",
    history: [],
    visitedNodes: new Set<string>(),
    personalityTraits: {},
    backgroundElements: [],
    alignmentTendencies: {
      lawChaos: 0,
      goodEvil: 0
    }
  });
  const [generatedBackstory, setGeneratedBackstory] = useState<string>("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Handle a choice selection
  const handleChoiceSelection = (choice: BackstoryChoice) => {
    if (!choice || !choice.nextNodeId || !backstoryTree[choice.nextNodeId]) {
      console.error("Invalid choice or next node");
      return;
    }

    // Update personality traits
    const updatedTraits = { ...state.personalityTraits };
    if (choice.impact?.personality) {
      Object.entries(choice.impact.personality).forEach(([trait, value]) => {
        updatedTraits[trait] = (updatedTraits[trait] || 0) + value;
      });
    }

    // Update background elements
    const updatedElements = [...state.backgroundElements];
    if (choice.impact?.background) {
      choice.impact.background.forEach(element => {
        if (!updatedElements.includes(element)) {
          updatedElements.push(element);
        }
      });
    }

    // Update alignment tendencies
    const updatedAlignment = { ...state.alignmentTendencies };
    if (choice.impact?.alignment) {
      switch (choice.impact.alignment) {
        case "lawful":
          updatedAlignment.lawChaos = Math.max(-10, updatedAlignment.lawChaos - 2);
          break;
        case "chaotic":
          updatedAlignment.lawChaos = Math.min(10, updatedAlignment.lawChaos + 2);
          break;
        case "good":
          updatedAlignment.goodEvil = Math.max(-10, updatedAlignment.goodEvil - 2);
          break;
        case "evil":
          updatedAlignment.goodEvil = Math.min(10, updatedAlignment.goodEvil + 2);
          break;
        case "neutral":
          // Nudge toward center
          updatedAlignment.lawChaos = updatedAlignment.lawChaos > 0 
            ? Math.max(0, updatedAlignment.lawChaos - 1) 
            : Math.min(0, updatedAlignment.lawChaos + 1);
          updatedAlignment.goodEvil = updatedAlignment.goodEvil > 0 
            ? Math.max(0, updatedAlignment.goodEvil - 1) 
            : Math.min(0, updatedAlignment.goodEvil + 1);
          break;
      }
    }

    // Add current node and choice to history
    const updatedHistory = [
      ...state.history,
      {
        nodeId: state.currentNodeId,
        choiceText: choice.text
      }
    ];

    // Update visited nodes
    const updatedVisited = new Set(state.visitedNodes);
    updatedVisited.add(choice.nextNodeId);

    // Update state
    setState({
      currentNodeId: choice.nextNodeId,
      history: updatedHistory,
      visitedNodes: updatedVisited,
      personalityTraits: updatedTraits,
      backgroundElements: updatedElements,
      alignmentTendencies: updatedAlignment
    });
  };

  // Go back to a previous node
  const goBack = () => {
    if (state.history.length === 0) return;

    const updatedHistory = [...state.history];
    const prevStep = updatedHistory.pop();
    
    if (!prevStep) return;

    setState({
      ...state,
      currentNodeId: prevStep.nodeId,
      history: updatedHistory
    });
  };

  // Get the current node
  const currentNode = backstoryTree[state.currentNodeId];

  // Finalize the backstory
  const finalizeBackstory = async () => {
    setIsFinalizing(true);
    try {
      // Get the narrative path from history
      const narrativePath = state.history.map(step => {
        const node = backstoryTree[step.nodeId];
        return {
          nodeText: node?.text || "",
          choiceText: step.choiceText
        };
      });
      
      // Include the current (final) node
      const currentNode = backstoryTree[state.currentNodeId];
      narrativePath.push({
        nodeText: currentNode?.text || "",
        choiceText: null
      });
      
      // Generate the final backstory
      const response = await apiRequest("POST", "/api/characters/finalize-backstory", {
        race,
        class: characterClass,
        narrativePath,
        personalityTraits: state.personalityTraits,
        backgroundElements: state.backgroundElements,
        alignmentTendencies: state.alignmentTendencies
      });
      
      if (!response.ok) {
        throw new Error("Failed to finalize backstory");
      }
      
      const data = await response.json();
      setGeneratedBackstory(data.backstory);
      
      // Call the parent callback
      onBackstoryGenerated(data.backstory, state.personalityTraits);
      
      toast({
        title: "Backstory Generated",
        description: "Your character's backstory has been created!",
      });
    } catch (error) {
      console.error("Error finalizing backstory:", error);
      toast({
        title: "Error",
        description: "Failed to generate your backstory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  // Initialize or reset the backstory generator
  const initializeBackstoryGenerator = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/characters/generate-backstory-tree", {
        race,
        class: characterClass
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate backstory tree");
      }
      
      const data = await response.json();
      setBackstoryTree(data.nodes);
      setState({
        currentNodeId: data.startNodeId || "start",
        history: [],
        visitedNodes: new Set<string>([data.startNodeId || "start"]),
        personalityTraits: {},
        backgroundElements: [],
        alignmentTendencies: {
          lawChaos: 0,
          goodEvil: 0
        }
      });
      setGeneratedBackstory("");
    } catch (error) {
      console.error("Error initializing backstory generator:", error);
      toast({
        title: "Error",
        description: "Failed to generate backstory tree. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the generator
  const resetGenerator = () => {
    setGeneratedBackstory("");
    initializeBackstoryGenerator();
  };

  // Initialize on component mount
  useEffect(() => {
    if (!initialBackstory || initialBackstory.trim() === "") {
      initializeBackstoryGenerator();
    } else {
      setGeneratedBackstory(initialBackstory);
    }
  }, [race, characterClass]);

  // If we have a generated backstory, show it
  if (generatedBackstory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Character Backstory
          </CardTitle>
          <CardDescription>
            Your character's unique narrative journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] rounded-md border p-4 bg-parchment">
            <div className="whitespace-pre-line">
              {generatedBackstory}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={resetGenerator}
          >
            <History className="mr-2 h-4 w-4" />
            Create New Backstory
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Crafting your backstory options...</p>
        </CardContent>
      </Card>
    );
  }

  // Show the interactive backstory generator
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Footprints className="h-5 w-5 mr-2" />
          Craft Your Story
        </CardTitle>
        <CardDescription>
          Follow a path through key moments in your character's history
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {currentNode && (
          <div className="space-y-6">
            <div className="rounded-md border p-4 bg-parchment min-h-[120px] whitespace-pre-line">
              {currentNode.text}
            </div>
            
            {currentNode.choices ? (
              <div className="space-y-3">
                {currentNode.choices.map((choice) => (
                  <Button
                    key={choice.nextNodeId}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                    onClick={() => handleChoiceSelection(choice)}
                  >
                    <span className="line-clamp-2">{choice.text}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="rounded-md bg-accent/10 p-4 text-center">
                <p className="font-medieval text-lg mb-2">End of Path</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You've reached a key moment in your character's history. Ready to finalize your story?
                </p>
                <Button 
                  onClick={finalizeBackstory}
                  disabled={isFinalizing}
                  className="w-40"
                >
                  {isFinalizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    "Complete Story"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          disabled={state.history.length === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous Step
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={resetGenerator}
        >
          <History className="mr-1 h-4 w-4" />
          Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}