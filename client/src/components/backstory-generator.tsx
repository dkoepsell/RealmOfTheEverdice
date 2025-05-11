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

  // Handle choice selection
  const handleChoiceSelection = (choice: BackstoryChoice) => {
    const currentNode = backstoryTree[state.currentNodeId];
    
    // Update state with new node and track history
    setState(prev => {
      // Process impact of choice
      const newPersonalityTraits = { ...prev.personalityTraits };
      const newBackgroundElements = [...prev.backgroundElements];
      const newAlignmentTendencies = { ...prev.alignmentTendencies };
      
      if (choice.impact) {
        // Update personality traits
        if (choice.impact.personality) {
          Object.entries(choice.impact.personality).forEach(([trait, value]) => {
            newPersonalityTraits[trait] = (newPersonalityTraits[trait] || 0) + value;
          });
        }
        
        // Add background elements
        if (choice.impact.background) {
          newBackgroundElements.push(...choice.impact.background);
        }
        
        // Update alignment tendencies
        if (choice.impact.alignment) {
          switch (choice.impact.alignment) {
            case "lawful":
              newAlignmentTendencies.lawChaos = Math.max(-10, newAlignmentTendencies.lawChaos - 2);
              break;
            case "chaotic":
              newAlignmentTendencies.lawChaos = Math.min(10, newAlignmentTendencies.lawChaos + 2);
              break;
            case "good":
              newAlignmentTendencies.goodEvil = Math.max(-10, newAlignmentTendencies.goodEvil - 2);
              break;
            case "evil":
              newAlignmentTendencies.goodEvil = Math.min(10, newAlignmentTendencies.goodEvil + 2);
              break;
            case "neutral":
              // Nudge slightly toward neutrality (0)
              newAlignmentTendencies.lawChaos = newAlignmentTendencies.lawChaos > 0 
                ? Math.max(0, newAlignmentTendencies.lawChaos - 1)
                : Math.min(0, newAlignmentTendencies.lawChaos + 1);
              newAlignmentTendencies.goodEvil = newAlignmentTendencies.goodEvil > 0
                ? Math.max(0, newAlignmentTendencies.goodEvil - 1)
                : Math.min(0, newAlignmentTendencies.goodEvil + 1);
              break;
          }
        }
      }
      
      // Mark the next node as visited
      const newVisitedNodes = new Set(prev.visitedNodes);
      newVisitedNodes.add(choice.nextNodeId);
      
      return {
        currentNodeId: choice.nextNodeId,
        history: [
          ...prev.history, 
          { nodeId: prev.currentNodeId, choiceText: choice.text }
        ],
        visitedNodes: newVisitedNodes,
        personalityTraits: newPersonalityTraits,
        backgroundElements: newBackgroundElements,
        alignmentTendencies: newAlignmentTendencies
      };
    });
  };

  // Go back to the previous node
  const handleGoBack = () => {
    if (state.history.length === 0) return;
    
    setState(prev => {
      const newHistory = [...prev.history];
      const lastNode = newHistory.pop();
      
      return {
        ...prev,
        currentNodeId: lastNode?.nodeId || "start",
        history: newHistory
      };
    });
  };

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
        description: "Failed to generate final backstory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
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
  }, [race, characterClass, initialBackstory]);

  // Render current node and choices
  const renderCurrentNode = () => {
    const currentNode = backstoryTree[state.currentNodeId];
    if (!currentNode) return null;
    
    return (
      <div className="space-y-4">
        <div className="bg-parchment p-4 rounded-md border border-accent/30 shadow-sm">
          <p className="text-lg font-medium">{currentNode.text}</p>
        </div>
        
        {currentNode.choices && currentNode.choices.length > 0 ? (
          <div className="space-y-3 mt-4">
            <h3 className="text-md font-semibold">How do you respond?</h3>
            {currentNode.choices.map((choice, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleChoiceSelection(choice)}
              >
                {choice.text}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <Button 
              className="w-full" 
              onClick={finalizeBackstory}
              disabled={isFinalizing}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing Backstory...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Complete Your Backstory
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render the journey steps
  const renderJourneySteps = () => {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center">
          <Footprints className="mr-2 h-4 w-4" />
          Your Journey So Far
        </h3>
        <ScrollArea className="h-32 rounded-md border p-2">
          <div className="space-y-2">
            {state.history.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Your journey is just beginning...</p>
            ) : (
              state.history.map((step, index) => {
                const node = backstoryTree[step.nodeId];
                return (
                  <div key={index} className="text-sm">
                    <span className="font-medium">Chapter {index + 1}:</span> {node?.text.slice(0, 50)}...
                    {step.choiceText && (
                      <p className="ml-4 text-accent-foreground/80 italic">
                        → {step.choiceText}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

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

  // Show the backstory generator
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Backstory Generator
        </CardTitle>
        <CardDescription>
          Create your character's history through choices and narrative
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Crafting your story possibilities...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderJourneySteps()}
            <Separator />
            {renderCurrentNode()}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          disabled={state.history.length === 0 || isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Go Back
        </Button>
        <Button
          variant="outline"
          onClick={resetGenerator}
          disabled={isLoading}
        >
          Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}