import React, { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertCircle,
  CheckCircle2,
  Clock, 
  Eye,
  Info,
  RefreshCw,
  Skull,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  relationship?: {
    id: number;
    sourceCharacterId: number;
    targetCharacterId: number;
    relationshipType: string;
    source?: {
      id: number;
      name: string;
    };
    target?: {
      id: number;
      name: string;
    };
  };
};

const triggerPredictionSchema = z.object({
  actualOutcome: z.string().min(1, "Actual outcome is required"),
});

export default function RelationshipPredictions({ 
  campaignId 
}: { 
  campaignId: number;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  
  // Fetch predictions for the campaign
  const { 
    data: predictions = [], 
    isLoading, 
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/relationship-predictions`],
    enabled: !!campaignId,
  });
  
  // Trigger prediction form
  const triggerPredictionForm = useForm<z.infer<typeof triggerPredictionSchema>>({
    resolver: zodResolver(triggerPredictionSchema),
    defaultValues: {
      actualOutcome: "",
    },
  });
  
  // Trigger prediction mutation
  const triggerPredictionMutation = useMutation({
    mutationFn: async (data: { predictionId: number; actualOutcome: string }) => {
      const res = await apiRequest("POST", `/api/relationship-predictions/${data.predictionId}/trigger`, {
        actualOutcome: data.actualOutcome,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/relationship-predictions`] });
      setTriggerDialogOpen(false);
      triggerPredictionForm.reset();
      toast({
        title: "Prediction triggered",
        description: "The prediction has been marked as triggered.",
      });
    },
    onError: (error) => {
      console.error("Error triggering prediction:", error);
      toast({
        title: "Error triggering prediction",
        description: "There was an error triggering the prediction. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for triggering a prediction
  const onTriggerPrediction = (data: z.infer<typeof triggerPredictionSchema>) => {
    if (!selectedPrediction) return;
    
    triggerPredictionMutation.mutate({
      predictionId: selectedPrediction.id,
      actualOutcome: data.actualOutcome,
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get icon for probability level
  const getProbabilityIcon = (probability: number) => {
    if (probability >= 75) return <ThumbsUp className="text-green-500" />;
    if (probability >= 50) return <ThumbsUp className="text-yellow-500" />;
    if (probability >= 25) return <ThumbsDown className="text-orange-500" />;
    return <ThumbsDown className="text-red-500" />;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading predictions: {(error as Error).message}
      </div>
    );
  }
  
  // Filter active (not triggered) and already triggered predictions
  const activePredictions = predictions.filter(pred => !pred.wasTriggered);
  const triggeredPredictions = predictions.filter(pred => pred.wasTriggered);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relationship Predictions</h2>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>
      
      {predictions.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No relationship predictions found for this campaign.</p>
              <p className="text-sm text-muted-foreground">
                Predictions are generated from character relationships. Create more character interactions to enable predictions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Predictions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Active Predictions ({activePredictions.length})
            </h3>
            
            {activePredictions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active predictions.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePredictions.map((prediction) => (
                  <Card key={prediction.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="mb-1">
                          Prediction #{prediction.id}
                        </Badge>
                        <Badge>
                          {prediction.probability}% Probability
                        </Badge>
                      </div>
                      <CardTitle className="text-base">
                        {prediction.relationship?.source?.name} & {prediction.relationship?.target?.name}
                      </CardTitle>
                      <CardDescription>
                        Created on {formatDate(prediction.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mb-4">
                        <div className="text-sm font-medium flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Predicted Event
                        </div>
                        <p className="text-sm">{prediction.predictedEvent}</p>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          Expected Outcome
                        </div>
                        <p className="text-sm">{prediction.predictedOutcome}</p>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-sm font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Trigger Condition
                        </div>
                        <p className="text-sm">{prediction.triggerCondition}</p>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span>Unlikely</span>
                          <span>Probability</span>
                          <span>Likely</span>
                        </div>
                        <Progress value={prediction.probability} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          setSelectedPrediction(prediction);
                          setTriggerDialogOpen(true);
                        }}
                      >
                        Mark as Triggered
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Triggered Predictions */}
          {triggeredPredictions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                Resolved Predictions ({triggeredPredictions.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {triggeredPredictions.map((prediction) => (
                  <Card key={prediction.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="mb-1">
                          Prediction #{prediction.id}
                        </Badge>
                        <Badge variant="secondary">
                          Resolved
                        </Badge>
                      </div>
                      <CardTitle className="text-base">
                        {prediction.relationship?.source?.name} & {prediction.relationship?.target?.name}
                      </CardTitle>
                      <CardDescription>
                        Triggered on {formatDate(prediction.triggeredAt || prediction.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mb-3">
                        <div className="text-sm font-medium flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Predicted Event
                        </div>
                        <p className="text-sm">{prediction.predictedEvent}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            Expected Outcome
                          </div>
                          <p className="text-sm">{prediction.predictedOutcome}</p>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium flex items-center">
                            <Skull className="h-4 w-4 mr-1" />
                            Actual Outcome
                          </div>
                          <p className="text-sm">{prediction.actualOutcome}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span>Original Probability: {prediction.probability}%</span>
                        </div>
                        <Progress value={prediction.probability} className="h-2 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Trigger Prediction Dialog */}
      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trigger Prediction</DialogTitle>
            <DialogDescription>
              {selectedPrediction && (
                <span>
                  Record what actually happened when the predicted event occurred between
                  {' '}{selectedPrediction.relationship?.source?.name} and {selectedPrediction.relationship?.target?.name}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrediction && (
            <>
              <div className="bg-muted p-4 rounded-md mb-4">
                <h4 className="font-medium mb-1">Original Prediction</h4>
                <p className="text-sm mb-2">{selectedPrediction.predictedEvent}</p>
                <h4 className="font-medium mb-1">Expected Outcome</h4>
                <p className="text-sm">{selectedPrediction.predictedOutcome}</p>
              </div>
              
              <Form {...triggerPredictionForm}>
                <form onSubmit={triggerPredictionForm.handleSubmit(onTriggerPrediction)} className="space-y-4">
                  <FormField
                    control={triggerPredictionForm.control}
                    name="actualOutcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What actually happened?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the actual outcome of this predicted event"
                            className="resize-none min-h-24"
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
                      onClick={() => setTriggerDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={triggerPredictionMutation.isPending}
                    >
                      {triggerPredictionMutation.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>Save Outcome</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}