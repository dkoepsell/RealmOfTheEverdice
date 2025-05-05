import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Character, CharacterStats, CharacterEquipment, CharacterSpell, CharacterAbility } from "@shared/schema";
import { calculateModifier } from "@/lib/utils";

interface CharacterSheetProps {
  character: Character;
  onUpdateCharacter?: (updates: Partial<Character>) => void;
}

export const CharacterSheet = ({ character, onUpdateCharacter }: CharacterSheetProps) => {
  const stats = character.stats as CharacterStats;
  const equipment = character.equipment as CharacterEquipment;
  const spells = character.spells as CharacterSpell[];
  const abilities = character.abilities as CharacterAbility[];
  
  const getStatModifier = (statValue: number) => {
    return calculateModifier(statValue);
  };
  
  // Calculate health percentage
  const healthPercentage = (character.hp / character.maxHp) * 100;
  
  return (
    <Card className="bg-parchment border-accent">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-2xl font-medieval text-primary">{character.name}</CardTitle>
            <CardDescription>Level {character.level} {character.race} {character.class}</CardDescription>
          </div>
          <div className="text-sm mt-2 md:mt-0">
            <span className="font-bold">Background:</span> {character.background || "None"}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList className="bg-accent/20">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
          </TabsList>
          
          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Health */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <h3 className="font-medieval">Health</h3>
                <span>{character.hp} / {character.maxHp}</span>
              </div>
              <Progress value={healthPercentage} className="h-3" />
            </div>
            
            <Separator />
            
            {/* Ability Scores */}
            <div className="space-y-2">
              <h3 className="font-medieval text-lg">Ability Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="border rounded p-3 text-center">
                    <div className="uppercase font-medieval">{key}</div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">
                      {getStatModifier(value) >= 0 ? "+" : ""}{getStatModifier(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Combat Tab */}
          <TabsContent value="combat" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <div className="font-medieval">Armor Class</div>
                <div className="text-2xl font-bold">
                  {/* This is a simplified AC calculation */}
                  {10 + getStatModifier(stats.dexterity)}
                </div>
              </div>
              <div className="border rounded p-3">
                <div className="font-medieval">Initiative</div>
                <div className="text-2xl font-bold">
                  {getStatModifier(stats.dexterity) >= 0 ? "+" : ""}
                  {getStatModifier(stats.dexterity)}
                </div>
              </div>
              <div className="border rounded p-3">
                <div className="font-medieval">Speed</div>
                <div className="text-2xl font-bold">30 ft</div>
              </div>
              <div className="border rounded p-3">
                <div className="font-medieval">Hit Dice</div>
                <div className="text-2xl font-bold">
                  {character.level}d{
                    character.class === "Wizard" || character.class === "Sorcerer" ? "6" :
                    character.class === "Barbarian" ? "12" :
                    character.class === "Fighter" || character.class === "Paladin" || character.class === "Ranger" ? "10" : "8"
                  }
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Abilities Section */}
            <div className="space-y-2">
              <h3 className="font-medieval text-lg">Abilities</h3>
              <div className="space-y-2">
                {abilities?.map((ability, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-bold">{ability.name}</div>
                    <div className="text-sm">{ability.description}</div>
                  </div>
                ))}
                {(!abilities || abilities.length === 0) && (
                  <div className="text-muted-foreground text-center py-2">No abilities</div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medieval text-lg mb-2">Weapons</h3>
                <div className="space-y-2">
                  {equipment?.weapons?.map((weapon, index) => (
                    <div key={index} className="border rounded p-3 flex justify-between">
                      <span>{weapon}</span>
                      <span className="text-muted-foreground">
                        +{getStatModifier(stats.strength)} to hit
                      </span>
                    </div>
                  ))}
                  {(!equipment?.weapons || equipment.weapons.length === 0) && (
                    <div className="text-muted-foreground text-center py-2">No weapons</div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medieval text-lg mb-2">Armor</h3>
                <div className="border rounded p-3">
                  {equipment?.armor || "None"}
                </div>
              </div>
              
              <div>
                <h3 className="font-medieval text-lg mb-2">Items</h3>
                <div className="space-y-2">
                  {equipment?.items?.map((item, index) => (
                    <div key={index} className="border rounded p-3">
                      {item}
                    </div>
                  ))}
                  {(!equipment?.items || equipment.items.length === 0) && (
                    <div className="text-muted-foreground text-center py-2">No items</div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Spells Tab */}
          <TabsContent value="spells" className="space-y-4">
            {["Wizard", "Sorcerer", "Warlock", "Cleric", "Druid", "Bard", "Paladin"].includes(character.class) ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <div className="font-medieval">Spellcasting Ability</div>
                    <div className="text-xl font-bold">
                      {
                        character.class === "Wizard" ? "Intelligence" :
                        character.class === "Cleric" || character.class === "Druid" ? "Wisdom" : "Charisma"
                      }
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="font-medieval">Spell Save DC</div>
                    <div className="text-xl font-bold">
                      {8 + 2 + getStatModifier(
                        character.class === "Wizard" ? stats.intelligence :
                        character.class === "Cleric" || character.class === "Druid" ? stats.wisdom : stats.charisma
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medieval text-lg">Spells</h3>
                  <div className="space-y-2">
                    {spells?.map((spell, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{spell.name}</span>
                          <span className="text-muted-foreground">Level {spell.level}</span>
                        </div>
                        <div className="text-sm mt-1">{spell.description}</div>
                      </div>
                    ))}
                    {(!spells || spells.length === 0) && (
                      <div className="text-muted-foreground text-center py-2">No spells</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-lg font-medieval mb-2">No Spellcasting</div>
                <p className="text-muted-foreground">This character class doesn't use spells.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Background Tab */}
          <TabsContent value="background" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medieval text-lg mb-2">Appearance</h3>
                <div className="border rounded p-3 min-h-24">
                  {character.appearance || "No appearance details."}
                </div>
              </div>
              
              <div>
                <h3 className="font-medieval text-lg mb-2">Backstory</h3>
                <div className="border rounded p-3 min-h-32">
                  {character.backstory || "No backstory details."}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CharacterSheet;
