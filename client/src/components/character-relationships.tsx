import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  HeartCrack, 
  Plus, 
  Shield, 
  Sword, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  Binary,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Character = {
  id: number;
  name: string;
  class: string;
  race: string;
  level: number;
  avatarUrl?: string;
};

type Relationship = {
  id: number;
  sourceCharacterId: number;
  targetCharacterId: number;
  relationshipType: string;
  relationshipStrength: number;
  interactionHistory: Array<{
    date: string;
    description: string;
    impact: number;
    context: string;
  }>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  direction: 'outgoing' | 'incoming';
  otherCharacter: Character | null;
};

type Prediction = {
  id: number;
  relationshipId: number;
  campaignId: number;
  predictedEvent: string;
  predictedOutcome: string;
  triggerCondition: string;
  probability: number;
  wasTriggered: boolean;
  actualOutcome?: string;
  createdAt: string;
  triggeredAt?: string;
};

// Create relationship form schema
const createRelationshipSchema = z.object({
  targetCharacterId: z.string().min(1, "Please select a character"),
  relationshipType: z.string().min(1, "Please select a relationship type"),
  relationshipStrength: z.number().min(-10).max(10),
  notes: z.string().optional(),
});

// Add interaction form schema
const addInteractionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  impact: z.number().min(-5).max(5),
  context: z.string().min(1, "Context is required"),
});

// Create prediction form schema
const createPredictionSchema = z.object({
  predictedEvent: z.string().min(1, "Predicted event is required"),
  predictedOutcome: z.string().min(1, "Predicted outcome is required"),
  triggerCondition: z.string().min(1, "Trigger condition is required"),
  probability: z.number().min(0).max(100),
});

const relationshipTypes = [
  { value: "ally", label: "Ally" },
  { value: "friend", label: "Friend" },
  { value: "rival", label: "Rival" },
  { value: "enemy", label: "Enemy" },
  { value: "family", label: "Family" },
  { value: "mentor", label: "Mentor" },
  { value: "student", label: "Student" },
  { value: "romantic", label: "Romantic" },
  { value: "business", label: "Business" },
  { value: "unknown", label: "Unknown" },
];

export default function CharacterRelationships({ 
  characterId, 
  campaignId,
  campaignCharacters = [] 
}: { 
  characterId: number;
  campaignId?: number;
  campaignCharacters?: Character[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [predictionDialogOpen, setPredictionDialogOpen] = useState(false);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<number | null>(null);
  
  // Fetch character relationships
  const { 
    data: relationships = [], 
    isLoading: isLoadingRelationships,
    error: relationshipsError,
  } = useQuery({
    queryKey: [`/api/characters/${characterId}/relationships`],
    enabled: !!characterId,
  });
  
  // Create relationship form
  const createRelationshipForm = useForm<z.infer<typeof createRelationshipSchema>>({
    resolver: zodResolver(createRelationshipSchema),
    defaultValues: {
      targetCharacterId: "",
      relationshipType: "",
      relationshipStrength: 0,
      notes: "",
    },
  });
  
  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createRelationshipSchema>) => {
      const res = await apiRequest("POST", "/api/characters/relationships", {
        sourceCharacterId: characterId,
        targetCharacterId: parseInt(data.targetCharacterId),
        relationshipType: data.relationshipType,
        relationshipStrength: data.relationshipStrength,
        notes: data.notes || null,
        interactionHistory: [],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/relationships`] });
      setCreateDialogOpen(false);
      createRelationshipForm.reset();
      toast({
        title: "Relationship created",
        description: "The relationship has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating relationship:", error);
      toast({
        title: "Error creating relationship",
        description: "There was an error creating the relationship. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Add interaction form
  const addInteractionForm = useForm<z.infer<typeof addInteractionSchema>>({
    resolver: zodResolver(addInteractionSchema),
    defaultValues: {
      description: "",
      impact: 0,
      context: "",
    },
  });
  
  // Add interaction mutation
  const addInteractionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addInteractionSchema>) => {
      if (!selectedRelationshipId) return null;
      
      const res = await apiRequest("POST", `/api/characters/relationships/${selectedRelationshipId}/interactions`, {
        date: new Date().toISOString(),
        description: data.description,
        impact: data.impact,
        context: data.context,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/relationships`] });
      setInteractionDialogOpen(false);
      addInteractionForm.reset();
      toast({
        title: "Interaction added",
        description: "The interaction has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding interaction:", error);
      toast({
        title: "Error adding interaction",
        description: "There was an error adding the interaction. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Create prediction form
  const createPredictionForm = useForm<z.infer<typeof createPredictionSchema>>({
    resolver: zodResolver(createPredictionSchema),
    defaultValues: {
      predictedEvent: "",
      predictedOutcome: "",
      triggerCondition: "",
      probability: 50,
    },
  });
  
  // Create prediction mutation
  const createPredictionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPredictionSchema>) => {
      if (!selectedRelationshipId || !campaignId) return null;
      
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/relationship-predictions`, {
        relationshipId: selectedRelationshipId,
        predictedEvent: data.predictedEvent,
        predictedOutcome: data.predictedOutcome,
        triggerCondition: data.triggerCondition,
        probability: data.probability,
      });
      return res.json();
    },
    onSuccess: () => {
      setPredictionDialogOpen(false);
      createPredictionForm.reset();
      toast({
        title: "Prediction created",
        description: "The prediction has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating prediction:", error);
      toast({
        title: "Error creating prediction",
        description: "There was an error creating the prediction. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for creating a relationship
  const onCreateRelationship = (data: z.infer<typeof createRelationshipSchema>) => {
    createRelationshipMutation.mutate(data);
  };
  
  // Handler for adding an interaction
  const onAddInteraction = (data: z.infer<typeof addInteractionSchema>) => {
    addInteractionMutation.mutate(data);
  };
  
  // Handler for creating a prediction
  const onCreatePrediction = (data: z.infer<typeof createPredictionSchema>) => {
    createPredictionMutation.mutate(data);
  };
  
  // Get relationship icon based on type and strength
  const getRelationshipIcon = (type: string, strength: number) => {
    switch (type) {
      case "ally":
        return <Shield className={strength > 0 ? "text-green-500" : "text-yellow-500"} />;
      case "friend":
        return <Heart className={strength > 0 ? "text-pink-500" : "text-gray-500"} />;
      case "rival":
        return <Sword className={strength < 0 ? "text-red-500" : "text-yellow-500"} />;
      case "enemy":
        return <HeartCrack className="text-red-500" />;
      case "family":
        return <Heart className={strength > 0 ? "text-purple-500" : "text-gray-500"} />;
      case "mentor":
        return <ArrowDownRight className="text-blue-500" />;
      case "student":
        return <ArrowUpRight className="text-green-500" />;
      case "romantic":
        return <Heart className={strength > 0 ? "text-red-500" : "text-gray-500"} />;
      case "business":
        return <Binary className="text-blue-500" />;
      default:
        return <Eye className="text-gray-500" />;
    }
  };
  
  // Get relationship status label based on strength
  const getRelationshipStatus = (strength: number) => {
    if (strength <= -8) return "Hateful";
    if (strength <= -5) return "Hostile";
    if (strength <= -2) return "Unfriendly";
    if (strength <= 2) return "Neutral";
    if (strength <= 5) return "Friendly";
    if (strength <= 8) return "Close";
    return "Devoted";
  };
  
  // Filter out the character's own relationships to avoid self-relationship
  const availableCharacters = campaignCharacters.filter(
    (char) => char.id !== characterId &&
      !relationships.some(
        (rel) => 
          (rel.sourceCharacterId === characterId && rel.targetCharacterId === char.id) ||
          (rel.targetCharacterId === characterId && rel.sourceCharacterId === char.id)
      )
  );
  
  // Generate AI prediction (simulated)
  const generateAIPrediction = async (relationshipId: number) => {
    setSelectedRelationshipId(relationshipId);
    
    // Find the relationship to get context for AI
    const relationship = relationships.find(r => r.id === relationshipId);
    if (!relationship) return;
    
    // Set default values with AI-generated examples
    createPredictionForm.setValue("predictedEvent", `${relationship.otherCharacter?.name} will face a personal challenge`);
    createPredictionForm.setValue("predictedOutcome", `Character relationship will ${relationship.relationshipStrength > 0 ? "strengthen" : "weaken"} depending on how they respond`);
    createPredictionForm.setValue("triggerCondition", "Next time the party faces a moral dilemma or dangerous situation");
    createPredictionForm.setValue("probability", Math.min(90, Math.max(30, 50 + relationship.relationshipStrength * 4)));
    
    setPredictionDialogOpen(true);
    
    toast({
      title: "AI Prediction Generated",
      description: "A prediction has been generated based on relationship data. Review and save if it looks good.",
    });
  };
  
  if (isLoadingRelationships) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (relationshipsError) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading relationships: {(relationshipsError as Error).message}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Character Relationships</h2>
        <Button 
          onClick={() => setCreateDialogOpen(true)} 
          disabled={availableCharacters.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" /> New Relationship
        </Button>
      </div>
      
      {relationships.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground mb-4">No relationships found for this character.</p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              disabled={availableCharacters.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Relationship
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationships.map((relationship) => (
            <Card key={relationship.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant={relationship.direction === 'outgoing' ? "default" : "outline"}>
                    {relationship.direction === 'outgoing' ? 'Outgoing' : 'Incoming'}
                  </Badge>
                  <div className="flex items-center">
                    {getRelationshipIcon(relationship.relationshipType, relationship.relationshipStrength)}
                    <span className="ml-2 capitalize">{relationship.relationshipType}</span>
                  </div>
                </div>
                <CardTitle className="flex items-center">
                  {relationship.otherCharacter?.avatarUrl && (
                    <div 
                      className="h-8 w-8 rounded-full bg-cover bg-center mr-2" 
                      style={{ backgroundImage: `url(${relationship.otherCharacter.avatarUrl})` }}
                    />
                  )}
                  {relationship.otherCharacter?.name || "Unknown Character"}
                </CardTitle>
                <CardDescription>
                  {relationship.otherCharacter?.race} {relationship.otherCharacter?.class} (Level {relationship.otherCharacter?.level})
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hostile</span>
                    <span>{getRelationshipStatus(relationship.relationshipStrength)}</span>
                    <span>Friendly</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${relationship.relationshipStrength > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ 
                        width: `${Math.abs(relationship.relationshipStrength) * 10}%`,
                        marginLeft: relationship.relationshipStrength < 0 ? '0' : '50%',
                        marginRight: relationship.relationshipStrength > 0 ? '0' : '50%',
                      }}
                    />
                  </div>
                </div>
                
                {relationship.notes && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground">{relationship.notes}</p>
                  </div>
                )}
                
                {relationship.interactionHistory && relationship.interactionHistory.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Recent Interactions</h4>
                    <div className="max-h-24 overflow-y-auto">
                      {relationship.interactionHistory.slice(-2).map((interaction, idx) => (
                        <div key={idx} className="text-xs mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              {new Date(interaction.date).toLocaleDateString()}
                            </span>
                            <Badge variant={interaction.impact > 0 ? "default" : "destructive"}>
                              {interaction.impact > 0 ? '+' : ''}{interaction.impact}
                            </Badge>
                          </div>
                          <p>{interaction.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRelationshipId(relationship.id);
                    setInteractionDialogOpen(true);
                  }}
                >
                  <Clock className="h-3 w-3 mr-1" /> Add Interaction
                </Button>
                
                {campaignId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => generateAIPrediction(relationship.id)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> AI Predict
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Relationship Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Relationship</DialogTitle>
            <DialogDescription>
              Define how your character relates to another character in the campaign.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createRelationshipForm}>
            <form onSubmit={createRelationshipForm.handleSubmit(onCreateRelationship)} className="space-y-4">
              <FormField
                control={createRelationshipForm.control}
                name="targetCharacterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a character" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCharacters.map((character) => (
                          <SelectItem key={character.id} value={character.id.toString()}>
                            {character.name} ({character.race} {character.class})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createRelationshipForm.control}
                name="relationshipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a relationship type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createRelationshipForm.control}
                name="relationshipStrength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Relationship Strength ({field.value})</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider
                          min={-10}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>Hostile (-10)</span>
                          <span>Neutral (0)</span>
                          <span>Friendly (+10)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createRelationshipForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes about this relationship"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createRelationshipMutation.isPending}
                >
                  {createRelationshipMutation.isPending ? (
                    <>Creating...</>
                  ) : (
                    <>Create Relationship</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Interaction Dialog */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Interaction</DialogTitle>
            <DialogDescription>
              Record a meaningful interaction between these characters.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addInteractionForm}>
            <form onSubmit={addInteractionForm.handleSubmit(onAddInteraction)} className="space-y-4">
              <FormField
                control={addInteractionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what happened in this interaction"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addInteractionForm.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact on Relationship ({field.value})</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider
                          min={-5}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>Negative (-5)</span>
                          <span>Neutral (0)</span>
                          <span>Positive (+5)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addInteractionForm.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="The situation or setting where this interaction occurred"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInteractionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addInteractionMutation.isPending}
                >
                  {addInteractionMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>Add Interaction</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Prediction Dialog */}
      <Dialog open={predictionDialogOpen} onOpenChange={setPredictionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Relationship Prediction</DialogTitle>
            <DialogDescription className="flex items-center mt-1">
              <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
              AI-powered prediction based on relationship data
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createPredictionForm}>
            <form onSubmit={createPredictionForm.handleSubmit(onCreatePrediction)} className="space-y-4">
              <FormField
                control={createPredictionForm.control}
                name="predictedEvent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Predicted Event</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What might happen?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createPredictionForm.control}
                name="predictedOutcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Predicted Outcome</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="How would this affect the relationship?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createPredictionForm.control}
                name="triggerCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Condition</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="When would this event occur?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createPredictionForm.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability ({field.value}%)</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>Unlikely</span>
                          <span>Possible</span>
                          <span>Likely</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">AI-Generated Prediction</p>
                  <p>This prediction is based on character relationship patterns and may not always be accurate. You can edit any fields before saving.</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPredictionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPredictionMutation.isPending || !campaignId}
                >
                  {createPredictionMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>Save Prediction</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}