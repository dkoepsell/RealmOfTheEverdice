import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndRuleButton, RuleType } from "./dnd-rule-tooltip";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, DicesIcon, Swords, Shield, Brain, Target, ArrowUpDown, Timer } from "lucide-react";

// Group D&D rules by category
const RULE_CATEGORIES = {
  "Checks & Saves": ["ability-check", "saving-throw", "advantage", "disadvantage", "proficiency"] as RuleType[],
  "Combat": ["attack-roll", "damage", "initiative", "combat-turn"] as RuleType[],
  "Health & Conditions": ["death-saves", "exhaustion", "conditions"] as RuleType[],
  "Movement & Actions": ["movement", "spell-casting"] as RuleType[]
};

interface DndQuickReferenceProps {
  children?: React.ReactNode;
  buttonText?: string;
  defaultOpen?: boolean;
  side?: "left" | "right" | "top" | "bottom";
}

export function DndQuickReference({ 
  children, 
  buttonText = "D&D Rules",
  defaultOpen = false,
  side = "right"
}: DndQuickReferenceProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filter rules by search query
  const filterRules = (rules: RuleType[]): RuleType[] => {
    if (!searchQuery) return rules;
    
    return rules.filter(rule => 
      rule.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const totalRules = Object.values(RULE_CATEGORIES).flat();
  const filteredAllRules = filterRules(totalRules);
  
  // Get the icon for each category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "Checks & Saves":
        return <Brain className="h-4 w-4" />;
      case "Combat":
        return <Swords className="h-4 w-4" />;
      case "Health & Conditions":
        return <Shield className="h-4 w-4" />; 
      case "Movement & Actions":
        return <Target className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side={side} className="w-[320px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            D&D Quick Reference
          </SheetTitle>
          <SheetDescription>
            Hover over or tap on a rule to learn more.
          </SheetDescription>
        </SheetHeader>
        
        <div className="my-4 px-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="px-1">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="all" className="flex-1">All Rules</TabsTrigger>
            <TabsTrigger value="category" className="flex-1">Categories</TabsTrigger>
            <TabsTrigger value="basic" className="flex-1">The Basics</TabsTrigger>
          </TabsList>
          
          {/* All Rules Tab */}
          <TabsContent value="all" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 gap-3">
                {filteredAllRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No rules found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredAllRules.map((rule) => (
                    <DndRuleButton key={rule} ruleType={rule} variant="outline" size="default" />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="category">
            <ScrollArea className="h-[400px] pr-4">
              <Accordion type="multiple" defaultValue={Object.keys(RULE_CATEGORIES)} className="w-full">
                {Object.entries(RULE_CATEGORIES).map(([category, rules]) => {
                  const filteredRules = filterRules(rules);
                  if (searchQuery && filteredRules.length === 0) return null;
                  
                  return (
                    <AccordionItem value={category} key={category}>
                      <AccordionTrigger className="flex items-center">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span>{category}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          {filteredRules.map((rule) => (
                            <DndRuleButton key={rule} ruleType={rule} variant="outline" size="default" />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </TabsContent>
          
          {/* The Basics Tab */}
          <TabsContent value="basic">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <DicesIcon className="h-4 w-4 text-primary" />
                  Core Mechanic
                </h3>
                <p className="text-sm mb-2">
                  In D&D, you roll a d20 (20-sided die), add modifiers, and compare to a target number. 
                  Equal or higher means success.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <DndRuleButton ruleType="ability-check" />
                  <DndRuleButton ruleType="saving-throw" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Swords className="h-4 w-4 text-primary" />
                  Combat Essentials 
                </h3>
                <p className="text-sm mb-2">
                  Combat happens in turns. Each turn consists of movement, an action, and possibly a 
                  bonus action and reaction.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <DndRuleButton ruleType="initiative" />
                  <DndRuleButton ruleType="attack-roll" />
                  <DndRuleButton ruleType="damage" />
                  <DndRuleButton ruleType="combat-turn" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-primary" />
                  Advantage & Disadvantage
                </h3>
                <p className="text-sm mb-2">
                  When you have advantage, roll two d20s and take the higher result. 
                  With disadvantage, take the lower result.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <DndRuleButton ruleType="advantage" />
                  <DndRuleButton ruleType="disadvantage" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <SheetFooter className="mt-6">
          <div className="w-full flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Hover over any rule for quick info or click for details
            </div>
            <SheetClose asChild>
              <Button variant="secondary" size="sm">
                Close
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}