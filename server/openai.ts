import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing_key" });

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

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating adventure:", error);
    throw new Error("Failed to generate adventure");
  }
}

export async function generateGameNarration(context: string, playerAction: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Dungeon Master narrating a D&D game. Provide vivid, engaging descriptions and narrative responses to player actions. Keep responses concise but immersive, focusing on the consequences of actions and maintaining the fantasy atmosphere."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nPlayer Action: ${playerAction}\n\nProvide a narrative response as the DM, describing what happens next. Include any checks or rolls that might be required.`
        }
      ]
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

    return JSON.parse(response.choices[0].message.content);
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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a D&D character creator specializing in generating detailed player characters."
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
          - alignment: Character alignment
          - appearance: Physical description
          - personality: Personality traits
          - backstory: Brief character history
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
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
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

export async function generateCampaign(options: CampaignGenerationOptions = {}) {
  const {
    genre = "fantasy",
    theme = "adventure",
    tone = "heroic"
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Dungeons & Dragons Dungeon Master. Create a detailed and unique D&D campaign setting with creative worldbuilding elements."
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
          - setting: The official D&D setting this is most similar to (Forgotten Realms, Eberron, etc.) or "Homebrew" if it's totally unique`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.8,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating campaign:", error);
    throw new Error("Failed to generate campaign");
  }
}
