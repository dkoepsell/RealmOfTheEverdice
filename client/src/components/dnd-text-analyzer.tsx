import React, { useMemo } from "react";
import { InlineRuleReference, RuleType } from "./dnd-rule-tooltip";

interface DndTextAnalyzerProps {
  text: string;
  showAsPopover?: boolean;
}

interface TermMatch {
  index: number;
  length: number;
  term: string;
  ruleType: RuleType;
}

/**
 * A component that analyzes text for D&D terms and wraps them in tooltips
 */
export function DndTextAnalyzer({ text, showAsPopover = false }: DndTextAnalyzerProps) {
  // List of D&D terms to look for and their associated rule types
  const dndTerms: { term: string | RegExp; ruleType: RuleType }[] = [
    // Ability checks
    { term: /\b(?:strength|dexterity|constitution|intelligence|wisdom|charisma) (?:check|ability check)\b/i, ruleType: "ability-check" },
    { term: /\bability check\b/i, ruleType: "ability-check" },
    { term: /\b(?:athletics|acrobatics|sleight of hand|stealth|arcana|history|investigation|nature|religion|animal handling|insight|medicine|perception|survival|deception|intimidation|performance|persuasion) check\b/i, ruleType: "ability-check" },
    
    // Saving throws
    { term: /\b(?:strength|dexterity|constitution|intelligence|wisdom|charisma) (?:save|saving throw)\b/i, ruleType: "saving-throw" },
    { term: /\bsaving throw\b/i, ruleType: "saving-throw" },
    { term: /\bsave\b/i, ruleType: "saving-throw" },
    
    // Attack rolls
    { term: /\battack roll\b/i, ruleType: "attack-roll" },
    { term: /\bhit\b/i, ruleType: "attack-roll" },
    
    // Initiative
    { term: /\binitiative\b/i, ruleType: "initiative" },
    { term: /\bturn order\b/i, ruleType: "initiative" },
    
    // Combat turns
    { term: /\bcombat turn\b/i, ruleType: "combat-turn" },
    { term: /\byour turn\b/i, ruleType: "combat-turn" },
    { term: /\baction\b/i, ruleType: "combat-turn" },
    { term: /\bbonus action\b/i, ruleType: "combat-turn" },
    { term: /\breaction\b/i, ruleType: "combat-turn" },
    
    // Damage
    { term: /\bdamage roll\b/i, ruleType: "damage" },
    { term: /\broll (?:for )?damage\b/i, ruleType: "damage" },
    
    // Advantage/Disadvantage
    { term: /\badvantage\b/i, ruleType: "advantage" },
    { term: /\bdisadvantage\b/i, ruleType: "disadvantage" },
    
    // Proficiency
    { term: /\bproficiency bonus\b/i, ruleType: "proficiency" },
    { term: /\bproficient\b/i, ruleType: "proficiency" },
    
    // Spellcasting
    { term: /\bspell(?:casting)?\b/i, ruleType: "spell-casting" },
    { term: /\bcantrip\b/i, ruleType: "spell-casting" },
    { term: /\bspell slot\b/i, ruleType: "spell-casting" },
    { term: /\bspell save DC\b/i, ruleType: "spell-casting" },
    
    // Conditions
    { term: /\b(?:blinded|charmed|deafened|frightened|grappled|incapacitated|invisible|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious)\b/i, ruleType: "conditions" },
    
    // Movement
    { term: /\bmovement\b/i, ruleType: "movement" },
    { term: /\bdifficult terrain\b/i, ruleType: "movement" },
    
    // Death saves
    { term: /\bdeath (?:save|saving throw)\b/i, ruleType: "death-saves" },
    
    // Exhaustion
    { term: /\bexhaustion\b/i, ruleType: "exhaustion" }
  ];

  // Find all term matches in the text
  const getMatches = (inputText: string): TermMatch[] => {
    const matches: TermMatch[] = [];

    dndTerms.forEach(({ term, ruleType }) => {
      // Handle both string and RegExp terms
      if (typeof term === "string") {
        let startIndex = inputText.toLowerCase().indexOf(term.toLowerCase());
        while (startIndex >= 0) {
          matches.push({
            index: startIndex,
            length: term.length,
            term: inputText.substring(startIndex, startIndex + term.length),
            ruleType,
          });
          startIndex = inputText.toLowerCase().indexOf(term.toLowerCase(), startIndex + term.length);
        }
      } else {
        // Term is a RegExp
        const regex = new RegExp(term, "g");
        let match;
        while ((match = regex.exec(inputText)) !== null) {
          matches.push({
            index: match.index,
            length: match[0].length,
            term: match[0],
            ruleType,
          });
        }
      }
    });

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Handle overlapping matches by keeping the longest one
    const filteredMatches: TermMatch[] = [];
    let lastEnd = -1;

    for (const match of matches) {
      if (match.index >= lastEnd) {
        // This match doesn't overlap with the previous one
        filteredMatches.push(match);
        lastEnd = match.index + match.length;
      } else if (match.index + match.length > lastEnd) {
        // This match overlaps but extends further, replace the previous one
        const prevMatch = filteredMatches[filteredMatches.length - 1];
        if (match.length > prevMatch.length) {
          filteredMatches[filteredMatches.length - 1] = match;
          lastEnd = match.index + match.length;
        }
      }
      // Ignore completely overlapped matches
    }

    return filteredMatches;
  };

  // Use memoization to avoid recalculating on every render
  const matches = useMemo(() => getMatches(text), [text]);

  // Render the text with tooltips
  const renderTextWithTooltips = () => {
    if (!matches.length) return text;

    const result: JSX.Element[] = [];
    let lastEnd = 0;

    matches.forEach((match, index) => {
      // Add text before the match
      if (match.index > lastEnd) {
        result.push(
          <React.Fragment key={`text-${index}`}>
            {text.substring(lastEnd, match.index)}
          </React.Fragment>
        );
      }

      // Add the match with a tooltip
      result.push(
        <InlineRuleReference 
          key={`term-${index}`} 
          ruleType={match.ruleType}
          showAsPopover={showAsPopover}
        >
          {match.term}
        </InlineRuleReference>
      );

      lastEnd = match.index + match.length;
    });

    // Add any remaining text after the last match
    if (lastEnd < text.length) {
      result.push(
        <React.Fragment key="text-end">
          {text.substring(lastEnd)}
        </React.Fragment>
      );
    }

    return <>{result}</>;
  };

  return <div className="dnd-analyzed-text">{renderTextWithTooltips()}</div>;
}