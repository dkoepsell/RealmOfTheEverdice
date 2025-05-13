import { Npc } from "@shared/schema";
import { db } from "./db";
import { openai } from "./openai";
import { v4 as uuidv4 } from "uuid";

export interface NPCAction {
  type: string;  // 'combat', 'dialogue', 'movement', 'interact', etc.
  description: string;
  target?: string; // Character ID, location, or object
  outcome?: string;
  diceRoll?: {
    type: string;
    result: number;
    dc?: number;
    success?: boolean;
  };
}

/**
 * Determines whether an NPC should take an action based on campaign context
 * @param npc The NPC object
 * @param campaignContext Current campaign state/context
 * @returns boolean indicating if the NPC should act
 */
export function shouldNPCTakeAction(
  npc: Npc, 
  campaignContext: any
): boolean {
  // Skip if NPC is inactive or incapacitated
  if (campaignContext.inactiveNPCIds?.includes(npc.id)) {
    return false;
  }

  // Check if NPC is in current scene/location
  const npcInCurrentScene = campaignContext.currentLocationNPCs?.includes(npc.id) ?? true;
  if (!npcInCurrentScene) {
    return false;
  }

  // For hostile NPCs, they should act more frequently in combat situations
  if (npc.isHostile && campaignContext.inCombat) {
    return true;
  }

  // For non-hostile NPCs, act less frequently but still participate
  // Use random chance based on context
  const actionProbability = campaignContext.inCombat 
    ? 0.3  // 30% chance to act during combat for non-hostile NPCs
    : 0.2; // 20% chance to act during normal gameplay
  
  return Math.random() < actionProbability;
}

/**
 * Generates an appropriate action for an NPC based on their attributes and campaign context
 * @param npc The NPC object
 * @param campaignContext Current state of the campaign including characters, environment, etc.
 * @returns An action object describing what the NPC does
 */
export async function generateNPCAction(
  npc: Npc,
  campaignContext: any
): Promise<NPCAction> {
  try {
    const requestId = uuidv4().slice(0, 8);
    console.log(`[${requestId}] Generating NPC action for ${npc.name}`);

    // Handle the case where stats are missing
    const npcStats = npc.stats || { 
      strength: 10, 
      dexterity: 10, 
      constitution: 10, 
      intelligence: 10, 
      wisdom: 10, 
      charisma: 10 
    };

    // Construct prompt for OpenAI to generate an appropriate action
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are a D&D Game Master AI that generates realistic NPC actions based on their attributes and the current campaign context. Generate only ONE action that the NPC would take in this situation.`
        },
        {
          role: "user",
          content: `Generate a realistic, context-appropriate action for this NPC based on their attributes and campaign context:
          
NPC Information:
- Name: ${npc.name}
- Race: ${npc.race || 'Unknown'}
- Class/Role: ${npc.class || 'Unknown'}
- Description: ${npc.description || 'No description available'}
- Is Hostile: ${npc.isHostile ? 'Yes' : 'No'}
- Stats: ${JSON.stringify(npcStats)}

Current Campaign Context:
${campaignContext.summary || 'The campaign is in progress.'}
${campaignContext.inCombat ? 'Currently in combat.' : 'Not currently in combat.'}
${campaignContext.currentLocation ? `Current location: ${campaignContext.currentLocation}` : ''}
${campaignContext.recentEvents ? `Recent events: ${campaignContext.recentEvents}` : ''}
${campaignContext.partyDescription ? `The party consists of: ${campaignContext.partyDescription}` : ''}

Format the response as a JSON object with these fields:
{
  "type": "combat|dialogue|movement|interact|skill|other",
  "description": "Detailed description of the action",
  "target": "Optional - target of the action (character name, object, location)",
  "outcome": "Optional - the result or effect of the action",
  "diceRoll": {
    "type": "Optional - what type of roll (attack, ability check, etc.)",
    "result": "Optional - numerical result of roll",
    "dc": "Optional - difficulty class if applicable",
    "success": "Optional - whether the roll succeeded"
  }
}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7
    });

    // Parse the response
    const content = response.choices[0].message.content || "";
    
    if (content.length === 0) {
      console.log(`[${requestId}] Empty response from OpenAI`);
      return {
        type: "other",
        description: `${npc.name} stands quietly, observing the situation.`
      };
    }
    
    console.log(`[${requestId}] Generated NPC action, content length: ${content.length}`);
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error(`[${requestId}] Error parsing JSON response:`, error);
      return {
        type: "other",
        description: `${npc.name} seems uncertain about what to do next.`
      };
    }
  } catch (error) {
    console.error("Error generating NPC action:", error);
    
    // Return a fallback action
    return {
      type: "other",
      description: `${npc.name} observes the situation carefully.`
    };
  }
}

/**
 * Processes and applies an NPC action to the campaign
 * @param npc The NPC performing the action
 * @param action The action being performed
 * @param campaignId The ID of the campaign
 * @returns A formatted narrative description of the action for game logs
 */
export async function processNPCAction(
  npc: Npc,
  action: NPCAction,
  campaignId: number
): Promise<string> {
  // Create a narrative description of the action
  let narrativeText = `**${npc.name}** `;
  
  // Add different formatting based on action type
  switch (action.type) {
    case 'combat':
      narrativeText += `attacks ${action.target || 'a target'}. ${action.description}`;
      if (action.diceRoll) {
        const successText = action.diceRoll.success 
          ? 'succeeds' 
          : 'fails';
        narrativeText += ` [${action.diceRoll.type} roll: ${action.diceRoll.result}] ${successText}`;
      }
      break;
      
    case 'dialogue':
      narrativeText += `says: "${action.description}"`;
      break;
      
    case 'movement':
      narrativeText += `moves ${action.description}`;
      break;
      
    case 'interact':
      narrativeText += `interacts with ${action.target || 'something'}: ${action.description}`;
      break;
      
    case 'skill':
      narrativeText += `attempts to ${action.description}`;
      if (action.diceRoll) {
        const successText = action.diceRoll.success 
          ? 'succeeds' 
          : 'fails';
        narrativeText += ` [${action.diceRoll.type} roll: ${action.diceRoll.result}] ${successText}`;
      }
      break;
      
    default:
      narrativeText += action.description;
  }
  
  // Add outcome if available
  if (action.outcome) {
    narrativeText += ` ${action.outcome}`;
  }
  
  return narrativeText;
}

/**
 * Takes turns for all eligible NPCs in a campaign
 * @param campaignId The ID of the campaign
 * @param context The current campaign context
 * @returns An array of narrative descriptions for all NPC actions taken
 */
export async function processNPCTurns(
  campaignId: number,
  context: any
): Promise<string[]> {
  try {
    // Get all NPCs for this campaign
    const npcs = await db.query.npcs.findMany({
      where: (npcs, { eq }) => eq(npcs.campaignId, campaignId)
    });
    
    const narratives: string[] = [];
    
    // Filter which NPCs should take action
    const eligibleNPCs = npcs.filter(npc => shouldNPCTakeAction(npc, context));
    
    // Generate and process actions for each eligible NPC
    for (const npc of eligibleNPCs) {
      const action = await generateNPCAction(npc, context);
      const narrative = await processNPCAction(npc, action, campaignId);
      narratives.push(narrative);
      
      // Optional: Add a slight delay between NPCs to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return narratives;
  } catch (error) {
    console.error("Error processing NPC turns:", error);
    return [];
  }
}