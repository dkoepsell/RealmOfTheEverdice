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
  UserPlus,
  Zap
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Character } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { 
  calculateActionResult, 
  calculateWeaponDamage, 
  calculateSpellDamage,
  COMMON_WEAPONS,
  COMMON_SPELLS
} from "@/lib/combat-utils";
import { v4 as uuidv4 } from 'uuid';

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
  level?: number;
  stats?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  equipment?: {
    items: Array<{
      name: string;
      type: string;
      isEquipped: boolean;
    }>;
  };
  lastRoll?: {
    type: string;
    result: number;
    modifier?: number;
    total: number;
    success?: boolean;
    damage?: number;
    damageRolls?: number[];
    damageBonus?: number;
    damageType?: string;
    damageDesc?: string;
    criticalHit?: boolean;
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
    ac: 12,
    actions: ["attack", "dodge"]
  });
  const [showConditionInput, setShowConditionInput] = useState<string | null>(null);
  const [conditionInput, setConditionInput] = useState("");
  const [showUsePcSelector, setShowUsePcSelector] = useState(false);

  // Sort participants by initiative order
  const sortedParticipants = [...combatParticipants].sort((a, b) => b.initiative - a.initiative);
  
  // Find the currently active participant
  const activeParticipant = sortedParticipants.find(p => p.isActive);
  
  // Handle form submission for adding a participant
  const handleAddParticipant = () => {
    if (!newParticipant.name) {
      toast({
        title: "Name required",
        description: "Please provide a name for the participant.",
        variant: "destructive"
      });
      return;
    }
    
    onAddParticipant?.({
      ...newParticipant,
      isActive: false,
      conditions: []
    });
    
    // Reset form
    setNewParticipant({
      name: "",
      initiative: 10,
      isEnemy: true,
      hp: 20,
      maxHp: 20,
      ac: 12,
      actions: ["attack", "dodge"]
    });
    setShowAddParticipant(false);
  };
  
  // Handle applying damage to a participant
  const handleApplyDamage = (participantId: string) => {
    const amount = parseInt(damageAmount[participantId] || "0");
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid damage amount.",
        variant: "destructive"
      });
      return;
    }
    
    onApplyDamage?.(participantId, amount);
    
    // Clear the input
    setDamageAmount(prev => {
      const newDamageAmount = { ...prev };
      delete newDamageAmount[participantId];
      return newDamageAmount;
    });
  };
  
  // Handle applying healing to a participant
  const handleApplyHealing = (participantId: string) => {
    const amount = parseInt(healAmount[participantId] || "0");
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid healing amount.",
        variant: "destructive"
      });
      return;
    }
    
    onApplyHealing?.(participantId, amount);
    
    // Clear the input
    setHealAmount(prev => {
      const newHealAmount = { ...prev };
      delete newHealAmount[participantId];
      return newHealAmount;
    });
  };
  
  // Handle adding a condition to a participant
  const handleAddCondition = (participantId: string) => {
    if (!conditionInput) {
      toast({
        title: "Condition required",
        description: "Please provide a condition name.",
        variant: "destructive"
      });
      return;
    }
    
    onAddCondition?.(participantId, conditionInput);
    
    // Clear the input and hide the form
    setConditionInput("");
    setShowConditionInput(null);
  };
  
  // Handle using a PC from the party as a combat participant
  const handleUsePC = (character: Character) => {
    if (!character) return;
    
    // Extract stats
    const stats = character.stats || {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    };
    
    // Calculate HP based on class and level if not set
    let hp = 0;
    const level = character.level || 1;
    const conModifier = Math.floor((stats.constitution - 10) / 2);
    
    // Simplified HP calculation based on class
    switch (character.class?.toLowerCase()) {
      case 'barbarian':
        hp = 12 + conModifier + (7 + conModifier) * (level - 1);
        break;
      case 'fighter': 
      case 'paladin':
      case 'ranger':
        hp = 10 + conModifier + (6 + conModifier) * (level - 1);
        break;
      case 'bard':
      case 'cleric':
      case 'druid':
      case 'monk':
      case 'rogue':
      case 'warlock':
        hp = 8 + conModifier + (5 + conModifier) * (level - 1);
        break;
      case 'sorcerer':
      case 'wizard':
        hp = 6 + conModifier + (4 + conModifier) * (level - 1);
        break;
      default:
        hp = 8 + conModifier + (5 + conModifier) * (level - 1);
    }
    
    // Calculate initiative modifier based on Dexterity
    const initModifier = Math.floor((stats.dexterity - 10) / 2);
    
    // Roll initiative (1d20 + DEX modifier)
    const initiativeRoll = Math.floor(Math.random() * 20) + 1 + initModifier;
    
    // Calculate armor class based on DEX and equipment
    let ac = 10 + Math.floor((stats.dexterity - 10) / 2); // Base AC + DEX modifier
    
    // Add PC to combat
    onAddParticipant?.({
      name: character.name,
      initiative: initiativeRoll,
      isEnemy: false,
      isActive: false,
      hp: Math.max(1, hp),
      maxHp: Math.max(1, hp),
      ac,
      conditions: [],
      actions: ["attack", "cast spell", "dodge", "help", "disengage"],
      race: character.race,
      class: character.class,
      level: character.level,
      stats,
      equipment: character.equipment
    });
    
    setShowUsePcSelector(false);
  };
  
  // Handle dice roll for a participant
  const handleDiceRoll = (participantId: string, diceType: string, purpose: string) => {
    // Get the participant
    const participant = combatParticipants.find(p => p.id === participantId);
    if (!participant) return;
    
    // Basic dice roll
    const dieSize = parseInt(diceType.substring(1));
    const result = Math.floor(Math.random() * dieSize) + 1;
    
    // Calculate modifier based on purpose and participant stats
    let modifier = 0;
    let total = result;
    
    if (participant.stats) {
      // Add appropriate modifier based on the roll purpose
      switch (purpose.toLowerCase()) {
        case 'attack':
          // For attack rolls, use STR for melee, DEX for ranged
          modifier = Math.floor((participant.stats.strength - 10) / 2);
          // Some participants might prefer DEX for attacks (finesse weapons)
          const dexMod = Math.floor((participant.stats.dexterity - 10) / 2);
          if (dexMod > modifier) {
            modifier = dexMod;
          }
          break;
        case 'save':
          // Default to DEX for saves, which is common in combat
          modifier = Math.floor((participant.stats.dexterity - 10) / 2);
          break;
        case 'damage':
          // Default to STR for damage
          modifier = Math.floor((participant.stats.strength - 10) / 2);
          break;
        case 'initiative':
          // Initiative uses DEX
          modifier = Math.floor((participant.stats.dexterity - 10) / 2);
          break;
        default:
          // No modifier
          break;
      }
      
      total = result + modifier;
    }
    
    // Consider proficiency bonus for PCs (non-enemies)
    if (!participant.isEnemy && purpose.toLowerCase() === 'attack') {
      // Calculate proficiency bonus based on level or CR
      // Basic formula: 2 + (level - 1) / 4, rounded down
      const level = participant.level || 1;
      const proficiencyBonus = 2 + Math.floor((level - 1) / 4);
      total += proficiencyBonus;
      // Note that we're adding to total but not to modifier for display clarity
    }
    
    if (onDiceRoll) {
      onDiceRoll(participantId, diceType, purpose);
    }
    
    // Update the participant's roll information
    const updatedParticipants = combatParticipants.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          lastRoll: {
            type: purpose,
            result,
            modifier,
            total,
            success: undefined
          }
        };
      }
      return p;
    });
    
    // If this is an attack roll, follow up with damage roll on high rolls (15+)
    if (purpose.toLowerCase() === 'attack' && total >= 15) {
      setTimeout(() => {
        handleDamageRoll(participantId);
      }, 1000);
    }
  };
  
  // Handle damage roll based on character's weapon or abilities
  const handleDamageRoll = (participantId: string) => {
    const participant = combatParticipants.find(p => p.id === participantId);
    if (!participant) return;
    
    // Default damage calculation for simple attacks
    let damageDice = '1d4'; // Default damage die
    let damageBonus = 0;
    let damageType = 'bludgeoning';
    let rolls = [];
    let totalDamage = 0;
    let criticalHit = false;
    
    // Check if the participant has stats for proper calculation
    if (participant.stats) {
      // Find equipped weapon if available
      let weaponName = 'Unarmed Strike';
      
      if (participant.equipment?.items) {
        const equippedWeapons = participant.equipment.items.filter(item => 
          item.type === 'weapon' && item.isEquipped
        );
        
        if (equippedWeapons.length > 0) {
          weaponName = equippedWeapons[0].name;
        }
      }
      
      // Use combat utils to calculate damage based on weapon
      const weaponDamage = calculateWeaponDamage(
        weaponName,
        participant.stats,
        2 + Math.floor(((participant.level || 1) - 1) / 4) // Calculate proficiency bonus
      );
      
      totalDamage = weaponDamage.damage;
      rolls = weaponDamage.damageRolls;
      damageBonus = weaponDamage.damageBonus;
      damageType = weaponDamage.damageType;
      criticalHit = weaponDamage.criticalHit || false;
    } else {
      // Simple damage roll for participants without stats
      const roll = Math.floor(Math.random() * 6) + 1; // 1d6
      rolls = [roll];
      totalDamage = roll;
    }
    
    // Create a descriptive roll result
    const rollDescription = `${rolls.join(' + ')}${damageBonus !== 0 ? ` + ${damageBonus}` : ''} = ${totalDamage}`;
    
    // Update the participant's last roll information
    const updatedParticipants = combatParticipants.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          lastRoll: {
            ...(p.lastRoll || {}),
            damage: totalDamage,
            damageRolls: rolls,
            damageBonus,
            damageType,
            damageDesc: rollDescription,
            criticalHit
          }
        };
      }
      return p;
    });
    
    // If target's AC is known, determine hit/miss
    if (participant.lastRoll && activeParticipant && activeParticipant.ac) {
      const isHit = participant.lastRoll.total >= activeParticipant.ac;
      
      if (isHit && onApplyDamage) {
        // Automatically apply damage to the target
        setTimeout(() => {
          onApplyDamage(activeParticipant.id, totalDamage);
          
          // Show toast notification
          toast({
            title: criticalHit ? "Critical Hit!" : "Hit!",
            description: `${participant.name} deals ${totalDamage} ${damageType} damage to ${activeParticipant.name}`,
            variant: criticalHit ? "destructive" : "default"
          });
        }, 500);
      } else if (!isHit) {
        // Show miss notification
        toast({
          title: "Miss!",
          description: `${participant.name}'s attack missed ${activeParticipant.name}`,
          variant: "secondary"
        });
      }
    }
  };

  // Handle weapon or spell attack for a participant
  const handleActionAttack = (participantId: string, actionType: 'weapon' | 'spell' = 'weapon') => {
    const participant = combatParticipants.find(p => p.id === participantId);
    if (!participant) return;
    
    if (actionType === 'weapon') {
      // Determine weapon from equipped items or default
      let weaponName = 'Unarmed Strike';
      
      if (participant.equipment?.items) {
        const equippedWeapons = participant.equipment.items.filter(item => 
          item.type === 'weapon' && item.isEquipped
        );
        
        if (equippedWeapons.length > 0) {
          weaponName = equippedWeapons[0].name;
        }
      }
      
      // Calculate attack and damage
      if (participant.stats) {
        const actionResult = calculateActionResult(
          `attack with ${weaponName}`,
          participant,
          2 + Math.floor(((participant.level || 1) - 1) / 4) // Calculate proficiency bonus
        );
        
        // Update participant with roll results
        const updatedParticipants = combatParticipants.map(p => {
          if (p.id === participantId) {
            return {
              ...p,
              lastRoll: {
                type: 'attack',
                result: actionResult.dieRoll || actionResult.attackRoll,
                modifier: actionResult.attackBonus,
                total: actionResult.attackRoll,
                damage: actionResult.damage,
                damageRolls: actionResult.damageRolls,
                damageBonus: actionResult.damageBonus,
                damageType: actionResult.damageType,
                criticalHit: actionResult.criticalHit
              }
            };
          }
          return p;
        });
        
        // If target's AC is known, determine hit/miss
        if (activeParticipant && activeParticipant.ac) {
          const isHit = actionResult.attackRoll >= activeParticipant.ac;
          
          if (isHit && onApplyDamage && actionResult.damage) {
            // Automatically apply damage to the target
            setTimeout(() => {
              onApplyDamage(activeParticipant.id, actionResult.damage as number);
              
              // Show toast notification
              toast({
                title: actionResult.criticalHit ? "Critical Hit!" : "Hit!",
                description: `${participant.name} deals ${actionResult.damage} ${actionResult.damageType} damage to ${activeParticipant.name}`,
                variant: actionResult.criticalHit ? "destructive" : "default"
              });
            }, 500);
          } else if (!isHit) {
            // Show miss notification
            toast({
              title: "Miss!",
              description: `${participant.name}'s attack missed ${activeParticipant.name}`,
              variant: "secondary"
            });
          }
        }
      } else {
        // Fallback to simple dice roll if no stats
        handleDiceRoll(participantId, 'd20', 'attack');
      }
    } else if (actionType === 'spell') {
      // TODO: Implement spell casting with spell selection
      handleDiceRoll(participantId, 'd20', 'spellcasting');
    }
  };
  
  if (!inCombat) return null;
  
  return (
    <div className="fixed bottom-0 right-0 mb-4 mr-4 z-40 w-72">
      <Card className="border-red-200 shadow-lg">
        <CardHeader className="py-3 px-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center" onClick={() => setExpanded(!expanded)}>
                <Sword className="h-4 w-4 mr-2 text-red-500" />
                Battle Tracker
                <Badge variant="outline" className="ml-2 text-xs">
                  Round {combatRound}
                </Badge>
              </CardTitle>
            </div>
            <div className="flex">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 mr-1" 
                onClick={() => setExpanded(!expanded)}>
                {expanded ? <X className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0 text-red-500" 
                onClick={(e) => {
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
                            <Badge 
                              variant="outline" 
                              className={`mr-1 text-xs ${participant.lastRoll.criticalHit ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : ''}`}
                            >
                              {participant.lastRoll.type}: {participant.lastRoll.total}
                              {participant.lastRoll.damage && (
                                <> → {participant.lastRoll.damage}</>
                              )}
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
                                <button 
                                  className="ml-1 text-purple-800 opacity-70 hover:opacity-100"
                                  onClick={() => onRemoveCondition(participant.id, condition)}
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleActionAttack(participant.id, 'weapon')}
                              >
                                <Sword className="h-3 w-3 mr-1" />
                                Attack
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Make a weapon attack</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleActionAttack(participant.id, 'spell')}
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Spell
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Cast a spell</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDiceRoll(participant.id, 'd20', 'save')}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Make a saving throw</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex items-center flex-1">
                          <input
                            type="number"
                            className="w-full h-6 text-xs rounded border pl-2"
                            placeholder="DMG"
                            value={damageAmount[participant.id] || ""}
                            onChange={e => setDamageAmount({
                              ...damageAmount,
                              [participant.id]: e.target.value
                            })}
                          />
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-6 px-2 text-xs ml-1"
                            onClick={() => handleApplyDamage(participant.id)}
                          >
                            Dmg
                          </Button>
                        </div>
                        
                        <div className="flex items-center flex-1">
                          <input
                            type="number"
                            className="w-full h-6 text-xs rounded border pl-2"
                            placeholder="HEAL"
                            value={healAmount[participant.id] || ""}
                            onChange={e => setHealAmount({
                              ...healAmount,
                              [participant.id]: e.target.value
                            })}
                          />
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-6 px-2 text-xs ml-1 bg-green-500 hover:bg-green-600"
                            onClick={() => handleApplyHealing(participant.id)}
                          >
                            Heal
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1">
                        {showConditionInput === participant.id ? (
                          <div className="flex items-center w-full">
                            <input
                              type="text"
                              className="w-full h-6 text-xs rounded border pl-2"
                              placeholder="Condition name"
                              value={conditionInput}
                              onChange={e => setConditionInput(e.target.value)}
                            />
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="h-6 px-2 text-xs ml-1"
                              onClick={() => handleAddCondition(participant.id)}
                            >
                              Add
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 text-xs w-full"
                            onClick={() => setShowConditionInput(participant.id)}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Add Condition
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
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
                  
                  {showUsePcSelector && (
                    <div className="p-3 border border-dashed rounded-md mt-2">
                      <h4 className="font-medium text-sm mb-2">Select Party Character</h4>
                      {partyCharacters.length > 0 ? (
                        <div className="space-y-2">
                          {partyCharacters.map(character => (
                            <Button
                              key={character.id}
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 w-full justify-start"
                              onClick={() => handleUsePC(character)}
                            >
                              {character.name} ({character.race} {character.class})
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-7 w-full"
                            onClick={() => setShowUsePcSelector(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          No party characters available
                        </div>
                      )}
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
                  onClick={() => {
                    if (showAddParticipant) {
                      setShowAddParticipant(false);
                    } else if (showUsePcSelector) {
                      setShowUsePcSelector(false);
                    } else {
                      setShowAddParticipant(true);
                    }
                  }}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {showAddParticipant ? "Cancel" : "Add"}
                </Button>
                
                {partyCharacters.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => setShowUsePcSelector(!showUsePcSelector)}
                    disabled={showAddParticipant}
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    {showUsePcSelector ? "Cancel" : "Use PC"}
                  </Button>
                )}
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