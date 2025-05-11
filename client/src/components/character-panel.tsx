import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Swords, 
  Sparkles, 
  Package, 
  Shield
} from "lucide-react";
import { Character } from "@shared/schema";
import DiceRoller from "./dice-roll";
import { calculateModifier } from "@/lib/utils";
import { InventoryManagerWithApparel } from "./inventory-management-with-apparel";

interface CharacterPanelProps {
  character: Character;
  campaignId?: number;
  campaignCharacters?: Character[];
}

export const CharacterPanel = ({ 
  character,
  campaignId = 0, 
  campaignCharacters = []
}: CharacterPanelProps) => {
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [inventoryUpdated, setInventoryUpdated] = useState(false);
  
  const handleItemUpdate = () => {
    setInventoryUpdated(!inventoryUpdated);
  };
  
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
    <div className="w-full h-full overflow-y-auto bg-background border-r border-border">
      <div className="p-4">
        {/* Character Sheet Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Character Sheet</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="p-1 rounded hover:bg-accent/10 transition-colors"
          >
            {sheetExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Character Info */}
        {sheetExpanded && (
          <Card className="mb-6 bg-accent/5 border border-border">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <svg 
                    className="h-6 w-6 text-primary"
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
                  <h3 className="text-lg font-bold">{character.name}</h3>
                  <p className="text-xs text-muted-foreground">Level {character.level} {character.race} {character.class}</p>
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
                  <div key={stat} className="text-center border border-border rounded-lg p-2 bg-card">
                    <div className="text-xs text-muted-foreground">{stat}</div>
                    <div className="text-xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{modifiers[stat as keyof typeof modifiers] >= 0 ? '+' : ''}{modifiers[stat as keyof typeof modifiers]}</div>
                  </div>
                ))}
              </div>
              
              {/* Health & Resources */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Health</span>
                  <span className="text-sm font-bold">{character.hp} / {character.maxHp}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`rounded-full h-2 ${healthPercentage > 50 ? 'bg-green-500' : healthPercentage > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${healthPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm" className="flex-1">
                  <Swords className="mr-1 h-4 w-4" />
                  Attack
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <Sparkles className="mr-1 h-4 w-4" />
                  Spells
                </Button>
                <div className="flex items-center justify-center flex-1">
                  <InventoryManagerWithApparel
                    characterId={character.id}
                    campaignId={campaignId}
                    character={character}
                    campaignCharacters={campaignCharacters}
                    onItemUpdate={handleItemUpdate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Dice Roller */}
        <DiceRoller 
          characterName={character.name}
          characterModifiers={modifiers} 
        />
      </div>
    </div>
  );
};

export default CharacterPanel;
