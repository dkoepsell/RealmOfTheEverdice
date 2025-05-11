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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertCircle, 
  ArrowRight, 
  Brain, 
  CheckCircle, 
  Sparkles, 
  ThumbsUp, 
  XCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RelationshipAnalysis = {
  summary: string;
  dynamicFactors: string[];
  potentialConflicts: string[];
  growthOpportunities: string[];
  predictions: {
    event: string;
    outcome: string;
    triggerCondition: string;
    probability: number;
  }[];
};

type Character = {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  avatarUrl?: string;
};

export default function RelationshipAnalysis({
  sourceCharacter,
  targetCharacter,
  relationshipId,
  campaignId,
  onSelectPrediction,
}: {
  sourceCharacter: Character;
  targetCharacter: Character;
  relationshipId: number;
  campaignId?: number;
  onSelectPrediction?: (prediction: any) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<RelationshipAnalysis | null>(null);
  
  // Function to analyze relationship
  const analyzeRelationship = async () => {
    setIsAnalyzing(true);
    
    try {
      const res = await apiRequest(
        "POST", 
        `/api/characters/${sourceCharacter.id}/relationships/${targetCharacter.id}/analyze`, 
        { campaignId }
      );
      
      const data = await res.json();
      setAnalysisData(data);
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the relationship. Please try again.",
        variant: "destructive",
      });
      console.error("Error analyzing relationship:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Create a prediction from analysis
  const createPrediction = async (prediction: any) => {
    if (!campaignId) {
      toast({
        title: "Campaign required",
        description: "A campaign ID is required to create a prediction.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/relationship-predictions`, {
        relationshipId,
        predictedEvent: prediction.event,
        predictedOutcome: prediction.outcome,
        triggerCondition: prediction.triggerCondition,
        probability: prediction.probability,
      });
      
      const data = await res.json();
      toast({
        title: "Prediction created",
        description: "The prediction has been saved to the campaign.",
      });
      
      // Invalidate predictions query
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/relationship-predictions`] });
      
      // Call callback if provided
      if (onSelectPrediction) {
        onSelectPrediction(null);
      }
    } catch (error) {
      toast({
        title: "Error creating prediction",
        description: "Failed to create the prediction. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating prediction:", error);
    }
  };
  
  return (
    <div className="space-y-4">
      {!analysisData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Relationship Analysis
            </CardTitle>
            <CardDescription>
              Use AI to analyze the relationship between {sourceCharacter.name} and {targetCharacter.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            <p className="mb-6">
              Analyze this relationship to get insights about their dynamics, potential conflicts, and future interactions.
            </p>
            <Button 
              onClick={analyzeRelationship} 
              disabled={isAnalyzing}
              className="mx-auto"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Relationship
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    Relationship Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights for {sourceCharacter.name} and {targetCharacter.name}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAnalysisData(null)}
                >
                  New Analysis
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm">{analysisData.summary}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Key Dynamic Factors</h4>
                <ul className="space-y-1">
                  {analysisData.dynamicFactors.map((factor, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Potential Conflicts</h4>
                  <ul className="space-y-1">
                    {analysisData.potentialConflicts.map((conflict, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{conflict}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Growth Opportunities</h4>
                  <ul className="space-y-1">
                    {analysisData.growthOpportunities.map((opportunity, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Predictions */}
          {analysisData.predictions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Predicted Future Interactions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisData.predictions.map((prediction, index) => (
                  <Card key={index} className="overflow-hidden border-t-4 border-primary/60">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">
                          {prediction.probability}% Probability
                        </Badge>
                        {campaignId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => createPrediction(prediction)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        )}
                      </div>
                      <CardTitle className="text-base">Predicted Event</CardTitle>
                      <CardDescription>
                        {prediction.event}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <div className="mb-3">
                        <h4 className="text-sm font-medium">Expected Outcome</h4>
                        <p className="text-sm">{prediction.outcome}</p>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="text-sm font-medium">Trigger Condition</h4>
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
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}