import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sword, 
  Shield, 
  SkullIcon, 
  Play, 
  Timer, 
  UserCheck, 
  X, 
  Crosshair,
  Heart,
  Activity,
  UserX,
  AlertCircle,
  ArrowRightCircle,
  Crown,
  UserPlus
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Character } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

export interface CombatParticipant {
  id: string;
  name: string;
  initiative: number;
  isEnemy: boolean;
  isActive: boolean;
  hp: number;
  maxHp: number;
  ac?: number; // Armor Class
  conditions?: string[]; // Conditions like "stunned", "poisoned", etc.
  actions: string[];
  imgUrl?: string;
  race?: string;
  class?: string;
  lastRoll?: {
    type: string;
    result: number;
    total: number;
    success?: boolean;
  };
}

export interface BattleTrackerProps {
  inCombat: boolean;
  combatParticipants: CombatParticipant[];
  combatRound: number;
  combatTurn: number;
  onEndCombat: () => void;
  onNextTurn: () => void;
  onAddParticipant?: (participant: Omit<CombatParticipant, 'id'>) => void;
  onApplyDamage?: (participantId: string, amount: number) => void;
  onApplyHealing?: (participantId: string, amount: number) => void;
  onAddCondition?: (participantId: string, condition: string) => void;
  onRemoveCondition?: (participantId: string, condition: string) => void;
  onDiceRoll?: (participantId: string, type: string, purpose: string) => void;
  partyCharacters?: Character[];
}

export function BattleTracker({
  inCombat = false,
  combatParticipants = [],
  combatRound = 1,
  combatTurn = 0,
  onEndCombat,
  onNextTurn,
  onAddParticipant,
  onApplyDamage,
  onApplyHealing,
  onAddCondition,
  onRemoveCondition,
  onDiceRoll,
  partyCharacters = []
}: BattleTrackerProps) {
  const [expanded, setExpanded] = useState(true);
  const [damageAmount, setDamageAmount] = useState<Record<string, string>>({});
  const [healAmount, setHealAmount] = useState<Record<string, string>>({});
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    initiative: 10,
    isEnemy: true,
    hp: 20,
    maxHp: 20,
    ac: 14,
    actions: ["Attack", "Dodge", "Disengage"]
  });

  // Sort participants by initiative
  const sortedParticipants = [...combatParticipants].sort((a, b) => b.initiative - a.initiative);
  
  // Get the active participant
  const activeParticipant = sortedParticipants.find(p => p.isActive);
  
  // Handle damage application
  const handleApplyDamage = (id: string) => {
    const amount = parseInt(damageAmount[id] || "0");
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid damage amount",
        description: "Please enter a positive number",
        variant: "destructive"
      });
      return;
    }
    
    if (onApplyDamage) {
      onApplyDamage(id, amount);
      // Clear the input
      setDamageAmount(prev => ({ ...prev, [id]: "" }));
    }
  };
  
  // Handle healing application
  const handleApplyHealing = (id: string) => {
    const amount = parseInt(healAmount[id] || "0");
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid healing amount",
        description: "Please enter a positive number",
        variant: "destructive"
      });
      return;
    }
    
    if (onApplyHealing) {
      onApplyHealing(id, amount);
      // Clear the input
      setHealAmount(prev => ({ ...prev, [id]: "" }));
    }
  };
  
  // Handle adding a new participant
  const handleAddParticipant = () => {
    if (!newParticipant.name) {
      toast({
        title: "Missing name",
        description: "Please enter a name for the participant",
        variant: "destructive"
      });
      return;
    }
    
    if (onAddParticipant) {
      onAddParticipant({
        ...newParticipant,
        isActive: false
      });
      
      // Reset the form
      setNewParticipant({
        name: "",
        initiative: 10,
        isEnemy: true,
        hp: 20,
        maxHp: 20,
        ac: 14,
        actions: ["Attack", "Dodge", "Disengage"]
      });
      setShowAddParticipant(false);
    }
  };
  
  // If not in combat, don't render
  if (!inCombat) return null;
  
  return (
    <div className="battle-tracker fixed bottom-0 right-0 z-50 max-w-sm mb-16 mr-4">
      <Card className="border-red-300 shadow-lg">
        <CardHeader className="bg-red-50/80 pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sword className="h-5 w-5 text-red-500" />
              <CardTitle className="text-md font-medieval">Battle Tracker</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-red-100 text-red-800 mr-1">
                Round {combatRound}
              </Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                e.stopPropagation();
                onEndCombat();
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {expanded && (
            <CardDescription className="text-xs mt-1 text-muted-foreground">
              {activeParticipant ? (
                <>Current Turn: <span className="font-semibold">{activeParticipant.name}</span></>
              ) : (
                "Combat initialized. Click Next Turn to begin."
              )}
            </CardDescription>
          )}
        </CardHeader>
        
        {expanded && (
          <>
            <CardContent className="pt-2 px-2">
              <ScrollArea className="h-[40vh] max-h-60 overflow-y-auto pr-2">
                <div className="space-y-2">
                  {sortedParticipants.map((participant) => (
                    <div 
                      key={participant.id}
                      className={`p-2 rounded-md ${
                        participant.isActive 
                          ? 'bg-amber-100 border border-amber-300' 
                          : participant.isEnemy 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            {participant.imgUrl ? (
                              <AvatarImage src={participant.imgUrl} alt={participant.name} />
                            ) : (
                              <AvatarFallback className={participant.isEnemy ? "bg-red-200" : "bg-blue-200"}>
                                {participant.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm flex items-center">
                              {participant.name}
                              {participant.isActive && (
                                <Crown className="h-3 w-3 ml-1 text-amber-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Initiative: {participant.initiative}
                              {participant.ac && <> • AC: {participant.ac}</>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {participant.lastRoll && (
                            <Badge variant="outline" className="mr-1 text-xs">
                              {participant.lastRoll.type}: {participant.lastRoll.total}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center">
                            <Heart className="h-3 w-3 mr-1 text-red-500" />
                            {participant.hp} / {participant.maxHp} HP
                          </span>
                          <span className={participant.hp <= participant.maxHp * 0.25 ? "text-red-500" : ""}>
                            {Math.floor((participant.hp / participant.maxHp) * 100)}%
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full bg-slate-200 overflow-hidden`}>
                          <div 
                            className={`h-full rounded-full ${
                              participant.hp <= participant.maxHp * 0.25 
                                ? 'bg-red-500' 
                                : participant.hp <= participant.maxHp * 0.5 
                                  ? 'bg-amber-500' 
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, (participant.hp / participant.maxHp) * 100))}%` }}
                          />
                        </div>
                      </div>
                      
                      {participant.conditions && participant.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {participant.conditions.map(condition => (
                            <Badge 
                              key={condition} 
                              variant="outline" 
                              className="text-xs bg-purple-50 border-purple-200 text-purple-800"
                            >
                              {condition}
                              {onRemoveCondition && (
                                <X 
                                  className="h-3 w-3 ml-1 cursor-pointer" 
                                  onClick={() => onRemoveCondition(participant.id, condition)}
                                />
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1 mt-2">
                        <div className="flex-1 flex space-x-1">
                          <div className="relative flex-1">
                            <input 
                              type="number"
                              placeholder="Dmg"
                              className="w-full h-6 text-xs rounded border border-red-300 pl-2 pr-6"
                              value={damageAmount[participant.id] || ""}
                              onChange={e => setDamageAmount(prev => ({ 
                                ...prev, 
                                [participant.id]: e.target.value 
                              }))}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 absolute right-0 top-0 text-red-500 hover:text-red-700 p-0"
                              onClick={() => handleApplyDamage(participant.id)}
                            >
                              <Crosshair className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="relative flex-1">
                            <input 
                              type="number"
                              placeholder="Heal"
                              className="w-full h-6 text-xs rounded border border-green-300 pl-2 pr-6"
                              value={healAmount[participant.id] || ""}
                              onChange={e => setHealAmount(prev => ({ 
                                ...prev, 
                                [participant.id]: e.target.value 
                              }))}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 absolute right-0 top-0 text-green-500 hover:text-green-700 p-0"
                              onClick={() => handleApplyHealing(participant.id)}
                            >
                              <Heart className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => onDiceRoll && onDiceRoll(participant.id, 'd20', 'attack')}
                              >
                                <Sword className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Attack Roll</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => onDiceRoll && onDiceRoll(participant.id, 'd20', 'save')}
                              >
                                <Shield className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Saving Throw</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                  
                  {combatParticipants.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p>No participants in battle yet</p>
                      <p className="text-xs">Add participants to begin</p>
                    </div>
                  )}
                  
                  {showAddParticipant && (
                    <div className="p-3 border border-dashed rounded-md mt-2">
                      <h4 className="font-medium text-sm mb-2">Add Participant</h4>
                      <div className="space-y-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Name"
                            className="w-full h-8 text-xs rounded border pl-2"
                            value={newParticipant.name}
                            onChange={e => setNewParticipant(prev => ({ 
                              ...prev, 
                              name: e.target.value 
                            }))}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <label className="text-xs block mb-1">Initiative</label>
                            <input
                              type="number"
                              className="w-full h-7 text-xs rounded border pl-2"
                              value={newParticipant.initiative}
                              onChange={e => setNewParticipant(prev => ({ 
                                ...prev, 
                                initiative: parseInt(e.target.value) || 0
                              }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-1">HP</label>
                            <input
                              type="number"
                              className="w-full h-7 text-xs rounded border pl-2"
                              value={newParticipant.hp}
                              onChange={e => {
                                const hp = parseInt(e.target.value) || 0;
                                setNewParticipant(prev => ({ 
                                  ...prev, 
                                  hp,
                                  maxHp: hp
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-1">AC</label>
                            <input
                              type="number"
                              className="w-full h-7 text-xs rounded border pl-2"
                              value={newParticipant.ac}
                              onChange={e => setNewParticipant(prev => ({ 
                                ...prev, 
                                ac: parseInt(e.target.value) || 0
                              }))}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7"
                            onClick={() => setShowAddParticipant(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="text-xs h-7"
                            onClick={handleAddParticipant}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="flex justify-between pt-2 pb-3 px-3 bg-muted/10">
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {showAddParticipant ? "Cancel" : "Add"}
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs h-7"
                  onClick={onEndCombat}
                >
                  End Combat
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs h-7"
                  onClick={onNextTurn}
                >
                  <ArrowRightCircle className="h-3 w-3 mr-1" />
                  Next Turn
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

export default BattleTracker;