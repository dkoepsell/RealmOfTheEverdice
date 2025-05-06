import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scroll, Trophy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DiceType } from "@/components/dice-roll";

export interface DiceRollResult {
  id: string;
  characterName: string;
  diceType: DiceType;
  result: number;
  modifier?: number;
  total: number;
  timestamp: Date;
  purpose?: string; // what the roll was for (e.g. "Attack", "Saving Throw", etc.)
  isSuccess?: boolean; // whether the roll was successful (for skill checks, etc.)
  threshold?: number; // the threshold for success (for skill checks, etc.)
}

interface DiceRollResultsProps {
  results: DiceRollResult[];
  maxResults?: number; // maximum number of results to display
}

export function DiceRollResults({ 
  results,
  maxResults = 10
}: DiceRollResultsProps) {
  // Sorted results with newest first, limited to maxResults
  const sortedResults = [...results]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxResults);
  
  // Format time as "1m ago", "5s ago", etc.
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  // Get color class based on roll result
  const getResultColor = (result: DiceRollResult) => {
    if (result.isSuccess === true) return "text-success font-bold";
    if (result.isSuccess === false) return "text-destructive font-bold";
    
    // If no explicit success/failure is provided, use dice value
    const diceMax = parseInt(result.diceType.substring(1));
    if (result.result === diceMax) return "text-success font-bold"; // Natural max roll
    if (result.result === 1) return "text-destructive font-bold"; // Natural 1
    if (result.result >= diceMax * 0.7) return "text-primary font-medium"; // High roll
    return "text-muted-foreground"; // Normal roll
  };
  
  // Get appropriate icon based on roll result
  const getResultIcon = (result: DiceRollResult) => {
    if (result.isSuccess === true) return <Trophy className="h-4 w-4 text-success" />;
    if (result.isSuccess === false) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return null;
  };

  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Scroll className="h-5 w-5 mr-2" />
            Dice Rolls
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            {sortedResults.length} rolls
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-56 overflow-y-auto">
          {sortedResults.length > 0 ? (
            <div className="divide-y">
              {sortedResults.map((result) => (
                <div key={result.id} className="p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{result.characterName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.purpose && `${result.purpose} • `}
                        {result.diceType}
                        {result.modifier !== undefined && result.modifier !== 0 && 
                          ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={`text-xl mr-1 ${getResultColor(result)}`}>
                        {result.total}
                      </div>
                      {getResultIcon(result)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      {result.threshold !== undefined && 
                        `Threshold: ${result.threshold} • `}
                      {`Roll: ${result.result}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(result.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No dice rolls yet</p>
              <p className="text-sm">Roll some dice to see results here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DiceRollResults;