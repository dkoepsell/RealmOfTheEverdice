import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing_key" });

// Helper function to safely parse JSON from OpenAI response
function safeJsonParse(content: string | null | undefined) {
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing JSON from OpenAI response:", error);
    return {};
  }
}

export interface AdventureGenerationOptions {
  theme?: string;
  setting?: string;
  difficulty?: string;
  partyLevel?: number;
  partySize?: number;
  includeElements?: string[];
}

export interface CharacterGenerationOptions {
  race?: string;
  class?: string;
  level?: number;
  alignment?: string;
}

export interface NPCGenerationOptions {
  race?: string;
  role?: string;
  alignment?: string;
  isHostile?: boolean;
}

export async function generateAdventure(options: AdventureGenerationOptions = {}) {
  const {
    theme = "fantasy",
    setting = "medieval",
    difficulty = "medium",
    partyLevel = 1,
    partySize = 4,
    includeElements = []
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Dungeon Master's assistant, skilled in creating engaging D&D adventures. Generate detailed adventures with a title, description, setting, NPCs, and quest objectives."
        },
        {
          role: "user",
          content: `Create a D&D adventure with the following parameters:
          - Theme: ${theme}
          - Setting: ${setting}
          - Difficulty: ${difficulty}
          - Party Level: ${partyLevel}
          - Party Size: ${partySize}
          - Elements to Include: ${includeElements.join(", ")}
          
          Format the response as a JSON object with these fields:
          - title: Adventure title
          - description: Brief adventure overview
          - setting: Detailed setting description
          - hooks: Ways to introduce the adventure to players
          - mainQuest: Object with title and description
          - sideQuests: Array of objects with title and description
          - npcs: Array of important NPCs with name, description, and role
          - locations: Array of key locations with name and description
          - encounters: Array of potential encounters with description and challenge rating
          - treasures: Array of treasures and rewards
          - conclusion: Possible ending scenarios`
        }
      ],
      response_format: { type: "json_object" }
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating adventure:", error);
    throw new Error("Failed to generate adventure");
  }
}

export async function generateGameNarration(context: string, playerAction: string, isAutoAdvance: boolean = false) {
  try {
    let systemPrompt = `You are an expert Dungeon Master narrating a D&D game, creating a truly open-world experience. You adapt fluidly to ANY player action or decision, no matter how unexpected.
    
As the Auto-DM, your role is to:
1. Create a dynamic world that reacts realistically to player choices
2. Balance different types of encounters (puzzles, combat, social interactions, exploration)
3. Present meaningful moral choices that could affect character alignment
4. Introduce surprising but coherent plot developments based on player decisions
5. Remember details from earlier in the adventure and weave them into ongoing narrative
6. Allow player freedom while maintaining narrative cohesion
7. When you see dice roll results in the context or player action, use these results to drive the narrative consequences

IMPORTANT: When you identify a dice roll in the context (look for phrases like "rolled X for Y" or "rolls X against DC Y"), narrate the exact consequences of that roll - success or failure should meaningfully impact the story! If a roll was critical (natural 20 or natural 1), make the outcome especially dramatic. Be specific and vivid about what exactly happens as a result of the roll.

Your narration should be vivid and concise, focusing on immersion and meaningful player agency. When appropriate, suggest new checks or rolls that would be required for further actions, but don't force specific choices on the player.`;

    // Check if playerAction contains a dice roll
    const containsDiceRoll = playerAction.match(/roll(ed|s)\s+\d+|result\s+\d+|DC\s+\d+|success|failure|critical/i);
    
    let userPrompt = "";
    
    if (isAutoAdvance) {
      userPrompt = `Context: ${context}

The player wants to advance the story. Create a compelling narrative that progresses the adventure by introducing a new element, encounter, or development. Consider including one of the following (choose what makes most sense given the context):
- A moral dilemma that might affect character alignment
- A puzzle or mystery that requires creative thinking
- A potential combat encounter with appropriate challenge
- A social interaction that reveals important information
- An environmental challenge or exploration opportunity
- A surprising twist that builds on previous story elements

Describe what happens next in vivid detail as the Dungeon Master, moving the story forward in an open-ended way that gives the player genuine agency in how to respond.`;
    } else if (containsDiceRoll) {
      // Special handling for dice roll actions
      userPrompt = `Context: ${context}

Dice Roll: ${playerAction}

This is a dice roll result. Narrate the SPECIFIC CONSEQUENCES of this roll result in vivid detail. Don't just acknowledge the roll - show exactly what happens because of this roll result. 

If it was a:
- Critical success (natural 20): Describe an exceptionally positive outcome with additional benefits
- Success: Describe how the character accomplishes their goal
- Failure: Describe complications, partial success with a cost, or interesting failure
- Critical failure (natural 1): Describe a dramatic setback, complication, or twist

Your narrative should directly respond to the roll, making it clear that the character's success or failure has meaningful impact on the story.`;
    } else {
      userPrompt = `Context: ${context}

Player Action: ${playerAction}

Provide a narrative response as the DM, describing what happens next based on this specific player action. Allow this action to meaningfully impact the world and story direction. If this action could have alignment implications, subtly note this. If checks or rolls would be required, mention them but don't resolve them yourself.

Your response should open up new possibilities rather than constrain them, adapting to the player's approach whether it's combat-focused, diplomacy, stealth, creative problem-solving, or something unexpected.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: containsDiceRoll ? 0.7 : 0.8 // Slightly lower temperature for dice outcomes
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating narration:", error);
    throw new Error("Failed to generate game narration");
  }
}

export async function generateNPC(options: NPCGenerationOptions = {}) {
  const {
    race = "random",
    role = "random",
    alignment = "random",
    isHostile = false
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a D&D character creator specializing in generating detailed NPCs for campaigns."
        },
        {
          role: "user",
          content: `Create a D&D NPC with the following parameters:
          - Race: ${race === "random" ? "Choose an appropriate race" : race}
          - Role: ${role === "random" ? "Choose an appropriate role" : role}
          - Alignment: ${alignment === "random" ? "Choose an appropriate alignment" : alignment}
          - Disposition: ${isHostile ? "Hostile to players" : "Neutral or friendly"}
          
          Format the response as a JSON object with these fields:
          - name: NPC's full name
          - race: NPC's race
          - class: NPC's class or profession
          - description: Physical appearance
          - personality: Personality traits and behaviors
          - motivation: What drives this NPC
          - background: Brief history
          - stats: Basic D&D stats (strength, dexterity, etc.)
          - abilities: Special abilities or skills
          - items: Notable items they possess
          - hooks: How they might interact with players`
        }
      ],
      response_format: { type: "json_object" }
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating NPC:", error);
    throw new Error("Failed to generate NPC");
  }
}

export async function generateCharacter(options: CharacterGenerationOptions = {}) {
  const {
    race = "random",
    class: characterClass = "random",
    level = 1,
    alignment = "random"
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a D&D character creator specializing in generating detailed player characters with nuanced moral alignments. 
          
Characters should have rich, evolving moral compasses that can shift over time based on their choices, not static alignments. Characters should start with tendencies or inclinations that can evolve along two axes:
- The Law-Chaos axis (respect for order vs. freedom)
- The Good-Evil axis (altruism vs. selfishness)

These alignments should be presented as nuanced positions, not just simple labels.`
        },
        {
          role: "user",
          content: `Create a D&D character with the following parameters:
          - Race: ${race === "random" ? "Choose an appropriate race" : race}
          - Class: ${characterClass === "random" ? "Choose an appropriate class" : characterClass}
          - Level: ${level}
          - Alignment: ${alignment === "random" ? "Choose an appropriate alignment" : alignment}
          
          Format the response as a JSON object with these fields:
          - name: Character's full name
          - race: Character's race
          - class: Character's class
          - background: Character's background
          - level: Character level
          - alignment: Character alignment (e.g. "Chaotic Good")
          - alignmentDescription: A paragraph explaining the character's moral compass, personal ethics, and how their alignment might evolve based on different choices
          - lawChaosValue: A number from 0-100 representing where they fall on Law (0) to Chaos (100) axis
          - goodEvilValue: A number from 0-100 representing where they fall on Good (0) to Evil (100) axis
          - appearance: Physical description
          - personality: Personality traits
          - backstory: Brief character history
          - moralChoices: Array of 3 past moral decisions that helped shape their current alignment
          - stats: Object with strength, dexterity, constitution, intelligence, wisdom, charisma values
          - hp: Hit points value
          - maxHp: Maximum hit points
          - proficiencies: Array of proficiencies
          - equipment: Object with weapons, armor, and items arrays
          - spells: Array of spells if applicable
          - abilities: Array of special abilities
          - traits: Character traits`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8 // Add more creative variation
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating character:", error);
    throw new Error("Failed to generate character");
  }
}

export async function generateDialogue(npcInfo: string, context: string, playerPrompt?: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert RPG dialogue writer creating authentic D&D NPC responses. Create dialogue that matches the NPC's personality and background while responding to the player's actions or questions."
        },
        {
          role: "user",
          content: `NPC Information: ${npcInfo}\n\nContext: ${context}\n\n${playerPrompt ? `Player says: ${playerPrompt}` : "Generate an initial NPC greeting or reaction based on the context."}\n\nProvide only the NPC's dialogue response. Make it feel authentic to the character and setting.`
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating dialogue:", error);
    throw new Error("Failed to generate NPC dialogue");
  }
}

export interface CampaignGenerationOptions {
  genre?: string;
  theme?: string;
  tone?: string;
}

export interface ItemGenerationOptions {
  itemType?: string;
  rarity?: string;
  category?: string;
  characterLevel?: number;
}

export async function generateRandomItem(options: ItemGenerationOptions = {}) {
  const {
    itemType = "random",
    rarity = "common",
    category = "any",
    characterLevel = 1
  } = options;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a magical artificer who crafts unique Dungeons & Dragons items. 
          Generate a ${rarity} ${itemType === "random" ? "random" : itemType} item suitable for level ${characterLevel} characters.
          ${category !== "any" ? `The item should be from the ${category} category.` : ''}
          
          Follow D&D 5e rules and balance considerations.`
        },
        {
          role: "user",
          content: `Create a detailed D&D 5e item with these parameters:
          - Item Type: ${itemType === "random" ? "any type" : itemType}
          - Rarity: ${rarity}
          - Category: ${category}
          - Character Level: ${characterLevel}
          
          Format your response as a JSON object with these fields:
          - name: A distinctive name for the item
          - description: A detailed description of the item's appearance and effects
          - type: One of "weapon", "armor", "potion", "scroll", "tool", "trinket", "quest", or "miscellaneous"
          - rarity: One of "common", "uncommon", "rare", "very rare", "legendary", "artifact"
          - weight: The weight in pounds (can be decimal)
          - value: The value in gold pieces
          - properties: Array of special properties like "magical", "cursed", etc.
          - attunement: Boolean, whether it requires attunement
          - quantity: How many of this item (usually 1)
          - isEquipped: false (default unequipped state)
          - slot: 0 (will be assigned when added to inventory)`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.7,
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating random item:", error);
    throw new Error("Failed to generate random item");
  }
}

export async function generateWorldMap(campaignId: number, campaignInfo: any) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3", 
      prompt: `Create a stylized fantasy map for a D&D campaign called "${campaignInfo.name}" set in a ${campaignInfo.setting || "fantasy world"}. 
      This should look like an old-style hand-drawn map on aged parchment with labeled regions, mountains, forests, cities, and bodies of water. 
      Include decorative elements like a compass rose, sea monsters in water areas, and ornate borders. 
      The map should have a high contrast style that works well as a game reference. 
      Design it in a top-down view with a color palette of browns, faded blues, and muted greens to mimic an antique map.
      Do not include any text that labels this as "Dungeons and Dragons", "D&D" or any trademarked terms.
      Make sure map features are clearly labeled with invented fantasy place names.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url"
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error("No image URL returned from OpenAI");
    }

    return { url: response.data[0].url, campaignId };
  } catch (error: any) {
    console.error("Error generating world map:", error);
    throw new Error(`Failed to generate world map: ${error.message || "Unknown error"}`);
  }
}

export async function generateCampaign(options: CampaignGenerationOptions = {}) {
  const {
    genre = "fantasy",
    theme = "adventure",
    tone = "heroic"
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert Dungeons & Dragons Dungeon Master specializing in creating open-world sandbox campaigns. 
          
Your campaigns should:
1. Provide rich, explorable worlds with multiple paths and possibilities
2. Allow for true player agency and unpredictable choices
3. Include diverse encounter types (combat, exploration, social, puzzles, moral dilemmas)
4. Present interesting factions with complex motivations and relationships
5. Feature opportunities for character growth and alignment evolution
6. Balance structure with freedom to improvise

Create a detailed and unique D&D campaign setting that supports this open-world play style.`
        },
        {
          role: "user",
          content: `Create a D&D campaign setting with the following parameters:
          - Genre: ${genre}
          - Theme: ${theme}
          - Tone: ${tone}
          
          Format your response as a JSON object with these fields:
          - name: A distinctive campaign name that evokes the world and its themes
          - description: A detailed description (300-400 words) covering geography, notable locations, major factions or kingdoms, current political situation or conflicts, unique magical elements, and potential adventure hooks.
          - setting: The official D&D setting this is most similar to (Forgotten Realms, Eberron, etc.) or "Homebrew" if it's totally unique
          - openWorldElements: Array of 5-7 elements that make this campaign suitable for open-world play (faction conflicts, mysterious locations, rumors, etc.)
          - moralDilemmas: Array of 3-5 potential moral choices players might face that could affect their character alignments
          - adaptabilityNotes: Brief notes on how the campaign can adapt to unexpected player choices`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.8,
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating campaign:", error);
    throw new Error("Failed to generate campaign");
  }
}
