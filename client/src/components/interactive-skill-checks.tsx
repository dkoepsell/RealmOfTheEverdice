import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DicesIcon, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface SkillCheck {
  id: string;
  skill: string; 
  text: string;
  dc?: number;
}

interface InteractiveSkillChecksProps {
  content: string;
  autoRoll: boolean;
  onRollSkillCheck: (skill: string, roll: number, modifier: number, dc?: number) => void;
  character?: {
    stats: {
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    };
    level?: number;
  };
}

const ABILITY_SCORE_MODIFIERS: Record<string, string> = {
  "strength": "STR",
  "dexterity": "DEX",
  "constitution": "CON", 
  "intelligence": "INT",
  "wisdom": "WIS",
  "charisma": "CHA"
};

const SKILL_TO_ABILITY: Record<string, string> = {
  "athletics": "strength",
  
  "acrobatics": "dexterity",
  "sleight of hand": "dexterity",
  "stealth": "dexterity",
  
  "arcana": "intelligence",
  "history": "intelligence",
  "investigation": "intelligence",
  "nature": "intelligence",
  "religion": "intelligence",
  
  "animal handling": "wisdom",
  "insight": "wisdom",
  "medicine": "wisdom",
  "perception": "wisdom",
  "survival": "wisdom",
  
  "deception": "charisma",
  "intimidation": "charisma",
  "performance": "charisma",
  "persuasion": "charisma"
};

export function InteractiveSkillChecks({ content, autoRoll, onRollSkillCheck, character }: InteractiveSkillChecksProps) {
  const [highlightedContent, setHighlightedContent] = useState<React.ReactNode>(null);
  const [skillChecks, setSkillChecks] = useState<SkillCheck[]>([]);
  const [selectedSkillCheck, setSelectedSkillCheck] = useState<SkillCheck | null>(null);
  const [showDiceDialog, setShowDiceDialog] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [dieResult, setDieResult] = useState<number | null>(null);
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Detect skill checks in content
  useEffect(() => {
    if (!content) {
      setSkillChecks([]);
      setHighlightedContent(null);
      return;
    }
    
    // Pattern to match skill checks like "Persuasion check", "check for Stealth", "Intelligence check", etc.
    // Also detects DCs like "DC 15 Wisdom (Perception) check" 
    // Improved to better capture standalone ability checks like "Intelligence check"
    const skillCheckRegex = /(?:(DC\s*(\d+))?\s*(?:([A-Za-z]+)\s*\()?([A-Za-z]+(?:\s+[A-Za-z]+)*)\)?(?:\s*check|\s*saving\s*throw))/gi;
    
    // Find all skill checks in the content
    const matches: SkillCheck[] = [];
    let match;
    const lowerContent = content.toLowerCase();
    
    while ((match = skillCheckRegex.exec(content)) !== null) {
      const fullText = match[0];
      let skill = match[4]?.toLowerCase();
      const ability = match[3]?.toLowerCase();
      const dc = match[2] ? parseInt(match[2]) : undefined;
      
      // If we have both ability and skill, use skill
      // Otherwise if we have ability only (like Strength check), use that as the skill
      const finalSkill = skill || ability;
      
      // Skip if no valid skill or if the detected text isn't a real skill
      if (!finalSkill || (
        !Object.keys(SKILL_TO_ABILITY).includes(finalSkill) && 
        !Object.keys(ABILITY_SCORE_MODIFIERS).includes(finalSkill)
      )) {
        continue;
      }
      
      // Check if this skill check is mentioned in a meaningful context
      // (not just listing skills in general)
      const snippetStart = Math.max(0, match.index - 50);
      const snippetEnd = Math.min(lowerContent.length, match.index + fullText.length + 50);
      const contextSnippet = lowerContent.substring(snippetStart, snippetEnd);
      
      const contextKeywords = ['could', 'can', 'may', 'might', 'should', 'attempt', 'try', 'roll', 'make', 'perform'];
      const hasContext = contextKeywords.some(keyword => contextSnippet.includes(keyword));
      
      if (hasContext) {
        matches.push({
          id: `skill-check-${matches.length}`,
          skill: finalSkill,
          text: fullText,
          dc
        });
      }
    }
    
    setSkillChecks(matches);
  }, [content]);
  
  // Highlight skill checks in the content
  useEffect(() => {
    if (!content || skillChecks.length === 0) {
      setHighlightedContent(content);
      return;
    }
    
    // Sort skill checks by their position in the text (descending)
    // This ensures we replace from the end of the string first to maintain indices
    const sortedChecks = [...skillChecks].sort((a, b) => {
      const indexA = content.indexOf(a.text);
      const indexB = content.indexOf(b.text);
      return indexB - indexA;
    });
    
    let highlightedText = content;
    
    // Replace each skill check with a highlighted version
    sortedChecks.forEach(check => {
      const index = highlightedText.indexOf(check.text);
      if (index === -1) return;
      
      const before = highlightedText.substring(0, index);
      const after = highlightedText.substring(index + check.text.length);
      
      highlightedText = `${before}<skill-check data-id="${check.id}">${check.text}</skill-check>${after}`;
    });
    
    // Convert the string with HTML tags to React elements
    const parts = highlightedText.split(/<skill-check data-id="([^"]+)">([^<]+)<\/skill-check>/);
    
    const elements: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Regular text
        elements.push(parts[i]);
      } else if (i % 3 === 1) {
        // This is the skill check ID
        const checkId = parts[i];
        const checkText = parts[i + 1];
        const check = skillChecks.find(c => c.id === checkId);
        
        if (check) {
          elements.push(
            <TooltipProvider key={checkId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="inline text-primary font-medium bg-primary/10 px-1 rounded hover:bg-primary/20 cursor-pointer border-b border-dashed border-primary"
                    onClick={() => handleSkillCheckClick(check)}
                  >
                    {checkText}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Click to make a {check.skill} check</p>
                  {check.dc && <p>Target DC: {check.dc}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
          
          // Removed auto-roll trigger - now requires explicit click from player
          // This aligns with the UX decision: players should click on suggested checks
        }
      }
    }
    
    setHighlightedContent(<>{elements}</>);
  }, [skillChecks, content]);
  
  const handleSkillCheckClick = (check: SkillCheck) => {
    setSelectedSkillCheck(check);
    
    // If autoRoll is enabled, perform the skill check immediately
    // Otherwise, show the dialog for manual rolling
    if (autoRoll) {
      performSkillCheck(check);
    } else {
      setShowDiceDialog(true);
    }
  };
  
  const getAbilityModifier = (ability: string): number => {
    if (!character) return 0;
    
    // Get the ability score
    const abilityScore = character.stats[ability as keyof typeof character.stats] || 10;
    
    // Calculate the modifier
    return Math.floor((abilityScore - 10) / 2);
  };
  
  const getSkillModifier = (skill: string): number => {
    if (!character) return 0;
    
    // Check if it's an ability check
    if (Object.keys(ABILITY_SCORE_MODIFIERS).includes(skill)) {
      return getAbilityModifier(skill);
    }
    
    // It's a skill check
    const ability = SKILL_TO_ABILITY[skill] || 'dexterity';
    const abilityMod = getAbilityModifier(ability);
    
    // Add proficiency bonus if the character is proficient (simplified)
    const proficiencyBonus = character.level ? Math.ceil(1 + character.level / 4) : 2;
    
    // Simplified: assume proficiency in all skills for this example
    // In a real app, you'd check character.proficiencies or similar
    return abilityMod + proficiencyBonus;
  };
  
  const performSkillCheck = (check: SkillCheck) => {
    setIsRolling(true);
    setDieResult(null);
    
    // Simulate rolling animation
    const rollDuration = 1000;
    const fps = 12;
    const frameDuration = 1000 / fps;
    const totalFrames = rollDuration / frameDuration;
    let frame = 0;
    
    const rollInterval = setInterval(() => {
      setDieResult(Math.floor(Math.random() * 20) + 1);
      frame++;
      
      if (frame >= totalFrames) {
        clearInterval(rollInterval);
        const finalResult = Math.floor(Math.random() * 20) + 1;
        setDieResult(finalResult);
        
        // Get modifier for this skill
        const modifier = getSkillModifier(check.skill);
        
        // Report the roll
        onRollSkillCheck(check.skill, finalResult, modifier, check.dc);
        
        // Determine success/failure if DC is known
        if (check.dc) {
          const totalRoll = finalResult + modifier;
          const success = totalRoll >= check.dc;
          
          toast({
            title: success ? "Success!" : "Failure",
            description: `${check.skill.charAt(0).toUpperCase() + check.skill.slice(1)} check: ${finalResult} + ${modifier} = ${totalRoll} vs DC ${check.dc}`,
            variant: success ? "default" : "destructive",
          });
        } else {
          toast({
            title: "Skill Check Result",
            description: `${check.skill.charAt(0).toUpperCase() + check.skill.slice(1)} check: ${finalResult} + ${modifier} = ${finalResult + modifier}`,
          });
        }
        
        // Close dialog and reset state
        setTimeout(() => {
          setShowDiceDialog(false);
          setIsRolling(false);
          setSelectedSkillCheck(null);
          
          // If auto-roll is enabled, this means we should automatically
          // advance the narrative after a skill check is completed
          if (autoRoll) {
            // Extract campaign ID from URL path, e.g., "/campaigns/123/adventure"
            const pathParts = location.split('/');
            const campaignIndex = pathParts.findIndex(part => part === 'campaigns');
            
            if (campaignIndex !== -1 && pathParts.length > campaignIndex + 1) {
              const campaignId = pathParts[campaignIndex + 1];
              console.log('Auto-advancing narrative after skill check with auto-roll enabled');
              
              // Submit a special action to advance the narrative
              apiRequest(
                "POST",
                `/api/campaigns/${campaignId}/action`,
                { action: "continue" }
              ).then(() => {
                console.log('Auto-advance successful');
              }).catch(error => {
                console.error('Error auto-advancing narrative:', error);
              });
            } else {
              console.error('Could not extract campaign ID from path for auto-advance');
            }
          }
        }, 1500);
      }
    }, frameDuration);
  };
  
  const handleManualRoll = () => {
    if (selectedSkillCheck) {
      performSkillCheck(selectedSkillCheck);
    }
  };
  
  // Render highlighted content
  return (
    <>
      {highlightedContent}
      
      <Dialog open={showDiceDialog} onOpenChange={setShowDiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSkillCheck && (
                <>
                  Make a {selectedSkillCheck.skill.charAt(0).toUpperCase() + selectedSkillCheck.skill.slice(1)} Check
                  {selectedSkillCheck.dc && ` (DC ${selectedSkillCheck.dc})`}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedSkillCheck && (
                <>
                  <div className="mt-2">
                    {selectedSkillCheck.skill in SKILL_TO_ABILITY && (
                      <p>
                        {selectedSkillCheck.skill.charAt(0).toUpperCase() + selectedSkillCheck.skill.slice(1)} uses your {' '}
                        {SKILL_TO_ABILITY[selectedSkillCheck.skill].toUpperCase()} modifier: +
                        {getSkillModifier(selectedSkillCheck.skill)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center items-center mt-4">
                    <div className="h-32 flex justify-center items-center">
                      {isRolling || dieResult ? (
                        <div className="text-5xl font-bold">
                          {dieResult}
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Click to roll your virtual d20</p>
                          <Button 
                            onClick={handleManualRoll} 
                            className="px-8 py-6 h-auto animate-pulse bg-primary/10 hover:bg-primary/80 hover:text-white transition-all"
                          >
                            <DicesIcon className="mr-2 h-5 w-5" />
                            Roll d20
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {dieResult && (
                      <div className="flex flex-col items-center mt-4 bg-muted/50 p-3 rounded-md w-full">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">
                            {dieResult} + {getSkillModifier(selectedSkillCheck.skill)} =&nbsp;
                            <span className="font-bold text-xl">
                              {dieResult + getSkillModifier(selectedSkillCheck.skill)}
                            </span>
                          </span>
                          {selectedSkillCheck.dc && (
                            <>
                              {dieResult + getSkillModifier(selectedSkillCheck.skill) >= selectedSkillCheck.dc ? (
                                <Check className="text-green-500 h-6 w-6" />
                              ) : (
                                <X className="text-red-500 h-6 w-6" />
                              )}
                            </>
                          )}
                        </div>
                        
                        {selectedSkillCheck.dc && (
                          <p className="text-sm text-muted-foreground">
                            {dieResult + getSkillModifier(selectedSkillCheck.skill) >= selectedSkillCheck.dc ? 
                              "Success! You passed the check." : 
                              `Failed. You didn't meet the DC ${selectedSkillCheck.dc}.`}
                          </p>
                        )}
                        
                        {dieResult && !isRolling && (
                          <Button 
                            onClick={() => {
                              setShowDiceDialog(false);
                              
                              // If auto-roll is enabled, we'll auto-advance after the roll
                              if (autoRoll) {
                                // Extract campaign ID from URL path
                                const pathParts = location.split('/');
                                const campaignIndex = pathParts.findIndex(part => part === 'campaigns');
                                
                                if (campaignIndex !== -1 && pathParts.length > campaignIndex + 1) {
                                  const campaignId = pathParts[campaignIndex + 1];
                                  console.log('Advancing narrative after manual roll with auto-advance enabled');
                                  
                                  // Submit a special action to advance the narrative
                                  apiRequest(
                                    "POST",
                                    `/api/campaigns/${campaignId}/action`,
                                    { action: "continue" }
                                  ).catch(error => {
                                    console.error('Error auto-advancing narrative:', error);
                                  });
                                }
                              }
                            }}
                            className="mt-4 w-full"
                            variant="default"
                          >
                            Continue Adventure
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}