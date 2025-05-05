import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Swords, 
  Sparkles, 
  Package 
} from "lucide-react";
import { Character } from "@shared/schema";
import DiceRoller from "./dice-roll";
import { calculateModifier } from "@/lib/utils";

interface CharacterPanelProps {
  character: Character;
}

export const CharacterPanel = ({ character }: CharacterPanelProps) => {
  const [sheetExpanded, setSheetExpanded] = useState(true);
  
  const stats = character.stats as {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  const getStatModifier = (statValue: number) => {
    return calculateModifier(statValue);
  };
  
  const modifiers = {
    STR: getStatModifier(stats.strength),
    DEX: getStatModifier(stats.dexterity),
    CON: getStatModifier(stats.constitution),
    INT: getStatModifier(stats.intelligence),
    WIS: getStatModifier(stats.wisdom),
    CHA: getStatModifier(stats.charisma)
  };
  
  // Calculate health percentage for the progress bar
  const healthPercentage = (character.hp / character.maxHp) * 100;

  return (
    <div className="w-full lg:w-1/4 bg-parchment border-r border-accent overflow-y-auto">
      <div className="p-4">
        {/* Character Sheet Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medieval text-primary">Character Sheet</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="p-2 rounded hover:bg-accent/20 transition-colors"
          >
            {sheetExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>

        {/* Character Info */}
        {sheetExpanded && (
          <Card className="medieval-border rounded-lg p-4 mb-6 bg-parchment">
            <CardContent className="p-0">
              <div className="flex items-center mb-3">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mr-3">
                  <svg 
                    className="h-8 w-8 text-secondary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{character.name}</h3>
                  <p className="text-sm italic">Level {character.level} {character.race} {character.class}</p>
                </div>
              </div>
              
              {/* Main Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries({
                  STR: stats.strength,
                  DEX: stats.dexterity,
                  CON: stats.constitution,
                  INT: stats.intelligence,
                  WIS: stats.wisdom,
                  CHA: stats.charisma
                }).map(([stat, value]) => (
                  <div key={stat} className="text-center border border-accent/50 rounded-lg p-2 bg-parchment/80">
                    <div className="font-medieval text-lg">{stat}</div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm">{modifiers[stat as keyof typeof modifiers] >= 0 ? '+' : ''}{modifiers[stat as keyof typeof modifiers]}</div>
                  </div>
                ))}
              </div>
              
              {/* Health & Resources */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-medieval">Health</span>
                  <span className="font-bold">{character.hp} / {character.maxHp}</span>
                </div>
                <div className="w-full bg-darkBrown/20 rounded-full h-4">
                  <div 
                    className={`rounded-full h-4 ${healthPercentage > 50 ? 'bg-success' : healthPercentage > 20 ? 'bg-accent' : 'bg-destructive'}`}
                    style={{ width: `${healthPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="default" className="flex-1 bg-primary text-white hover:bg-primary/80">
                  <Swords className="mr-1 h-4 w-4" />
                  Attack
                </Button>
                <Button variant="default" className="flex-1 bg-secondary text-white hover:bg-secondary/80">
                  <Sparkles className="mr-1 h-4 w-4" />
                  Spells
                </Button>
                <Button variant="default" className="flex-1 bg-accent text-darkBrown hover:bg-accent/80">
                  <Package className="mr-1 h-4 w-4" />
                  Items
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Dice Roller */}
        <DiceRoller characterModifiers={modifiers} />
      </div>
    </div>
  );
};

export default CharacterPanel;
