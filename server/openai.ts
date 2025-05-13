import OpenAI from "openai";

// Check for OpenAI API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ WARNING: OPENAI_API_KEY environment variable is not set. AI features will be unavailable.");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_key",
  timeout: 60000, // 60 second timeout for all requests
  maxRetries: 3   // Allow up to 3 retries for transient errors
});

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

export interface BackstoryNodeGenerationOptions {
  race?: string;
  class?: string;
  alignment?: string;
  theme?: string;
}

export interface BackstoryPathOptions {
  race?: string;
  class?: string;
  narrativePath: Array<{
    nodeText: string;
    choiceText: string | null;
  }>;
  personalityTraits: Record<string, number>;
  backgroundElements: string[];
  alignmentTendencies: {
    lawChaos: number;
    goodEvil: number;
  };
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
    let systemPrompt = `You are an expert Dungeon Master narrating a D&D game, creating an educational and immersive open-world experience. You adapt fluidly to ANY player action while teaching real D&D mechanics.
    
As the Educational Auto-DM, your role is to:
1. Create a dynamic world that reacts realistically to player choices
2. Balance different types of encounters (puzzles, combat, social interactions, exploration)
3. Present meaningful moral choices that could affect character alignment
4. Introduce surprising but coherent plot developments based on player decisions
5. Remember details from earlier in the adventure and weave them into ongoing narrative
6. Allow player freedom while maintaining narrative cohesion
7. EXPLAIN the actual D&D rules, dice mechanics, and tabletop elements as part of the narrative
8. When you see dice roll results in the context or player action, use these results to drive the narrative consequences
9. Make D&D's tabletop elements visible and accessible within the digital experience

VARIETY AND CREATIVITY: 
- CRITICALLY IMPORTANT: Avoid repetitive narrative structures, phrases, and scenarios
- Never repeat the same type of encounter or scenario twice in succession
- Alternate between different types of challenges (puzzles, combat, social, exploration)
- Introduce unique NPCs with distinct personalities and motivations
- Use different environments and settings in consecutive narrative segments
- Vary the sensory descriptions (visual, auditory, olfactory, tactile) between scenes
- Create contrasting emotional tones between consecutive narrative segments
- Vary sentence structures, vocabulary choices, and paragraph lengths
- If you described a dark, enclosed environment previously, next choose an open, bright one
- If the previous scene was action-oriented, shift to introspection, mystery, or social dynamics
- Never use the same adjectives to describe locations, NPCs, or actions in consecutive prompts
- Interrupt predictable narrative flow with unexpected but coherent developments
- Create varied and imaginative settings, not generic fantasy locations
- Invent unexpected twists that change the direction of the adventure
- Incorporate diverse fantasy elements from different D&D settings and traditions
- Develop the ongoing narrative with clear story progression - don't present static scenarios
- Make serious efforts to remember previous events and build upon them
- Ensure each narrative response meaningfully advances the story in some way

EDUCATIONAL ELEMENTS: In each response, include a specific reference to at least one actual D&D game mechanic (ability checks, saving throws, attack rolls, etc.) and explain it naturally within the narrative. When appropriate, suggest specific dice rolls with the format: "[Roll: d20+modifier vs DC X for Y]" to clearly show the tabletop elements.

IMPORTANT: When you identify a dice roll in the context (look for phrases like "rolled X for Y" or "rolls X against DC Y"), narrate the exact consequences of that roll - success or failure should meaningfully impact the story! If a roll was critical (natural 20 or natural 1), make the outcome especially dramatic. Be specific and vivid about what exactly happens as a result of the roll, and explain briefly what the roll represents in D&D mechanics.

COMBAT GUIDANCE: During combat, clearly explain initiative order, attack rolls, damage calculation, and special abilities. Frame these as educational elements that help players learn real D&D 5e mechanics.

Your narration should be vivid and educational, focusing on immersion while teaching real D&D mechanics. When appropriate, suggest new checks or rolls that would be required for further actions using the [Roll: X] format, but don't force specific choices on the player.`;

    // Check if playerAction contains a dice roll
    const containsDiceRoll = playerAction.match(/roll(ed|s)\s+\d+|result\s+\d+|DC\s+\d+|success|failure|critical/i);
    
    let userPrompt = "";
    
    if (isAutoAdvance) {
      userPrompt = `Context: ${context}

The player wants to advance the story. Create a compelling narrative that progresses the adventure in a CREATIVE, IMAGINATIVE way that is DIFFERENT from your previous responses. Carefully read the context to identify what type of scene was MOST RECENTLY presented, then DELIBERATELY CHOOSE A DIFFERENT TYPE of scene or encounter to avoid repetition.

VARIETY IS CRITICAL - analyze the context to determine:
1. What types of challenges have been presented most recently (puzzle, combat, social, exploration)
2. What environments or settings have been used recently (indoor, outdoor, urban, wilderness, underground)
3. What NPCs or factions have been featured recently
4. What tone has dominated recent interactions (serious, humorous, mysterious, action-oriented)

THEN CHOOSE CONTRASTING ELEMENTS to create a distinctive and fresh experience. If the story has been in a:
- Dungeon → Move to wilderness, settlement, or planar location
- Combat sequence → Shift to puzzle solving, diplomacy, or exploration
- Social interaction → Introduce environmental challenges or action
- Linear path → Open up multiple interesting choices and paths
- Known location → Discover something unexpected or previously hidden
- Familiar tone → Shift to a contrasting emotional atmosphere

Consider including one of the following advanced D&D elements (choose something you haven't used recently):
- A moral dilemma that might affect character alignment, explaining alignment mechanics
- A puzzle or mystery that requires an Intelligence or Wisdom check with an explanation of the ability score system
- A potential combat encounter with appropriate challenge rating, explaining initiative and turn order
- A social interaction that reveals important information, suggesting Charisma-based skill checks
- An environmental challenge requiring specific saving throws, explaining the mechanic
- A surprising twist that builds on previous story elements, tying to D&D's worldbuilding approaches
- An encounter with a strange magical effect requiring arcana knowledge
- An opportunity to use a specific class feature or specialized skill
- A chance to interact with an unusual creature from the Monster Manual

EDUCATIONAL ELEMENTS: Include at least one suggestion for a specific dice roll in the format [Roll: d20+modifier vs DC X for Y], explaining what the DC represents in D&D terms and how modifiers are calculated. Make sure to teach actual D&D 5e rules in a natural way through the narrative.

Describe what happens next in vivid detail as the Dungeon Master, moving the story forward in an educational and open-ended way that gives the player genuine agency in how to respond.`;
    } else if (containsDiceRoll) {
      // Special handling for dice roll actions with educational elements
      userPrompt = `Context: ${context}

Dice Roll: ${playerAction}

This is a dice roll result. Narrate the SPECIFIC CONSEQUENCES of this roll result in vivid detail while educating the player about D&D mechanics. Don't just acknowledge the roll - show exactly what happens because of this roll result and explain the game mechanics involved.

EDUCATIONAL ELEMENT: Clearly explain what type of roll this is (attack roll, ability check, saving throw, etc.), what the numbers mean in D&D terms, and how the result affects gameplay according to actual D&D 5e rules. Include a brief explanation of how modifiers, advantage/disadvantage, or proficiency might affect similar rolls in the future.

If it was a:
- Critical success (natural 20): Describe an exceptionally positive outcome with additional benefits, explaining critical hit mechanics
- Success: Describe how the character accomplishes their goal, explaining the mechanical benefits
- Failure: Describe complications, partial success with a cost, or interesting failure, explaining what happens mechanically
- Critical failure (natural 1): Describe a dramatic setback, complication, or twist, explaining critical failure mechanics

STAT IMPACT: If applicable, mention how this roll might impact the character's stats, alignment, or condition (exhaustion, poisoned, etc.) according to real D&D rules.

Your narrative should directly respond to the roll, making it clear that the character's success or failure has meaningful impact on the story while teaching D&D mechanics.`;
    } else {
      userPrompt = `Context: ${context}

Player Action: ${playerAction}

Provide a narrative response as the DM, describing what happens next based on this specific player action. CAREFULLY ANALYZE the context and ensure your response is DIFFERENT in style, tone, and content from your previous responses.

VARIETY AND CREATIVITY REQUIREMENTS:
1. Review the recent narrative history to avoid repeating similar scenarios
2. If recent responses featured combat, focus on exploration, puzzles, or social interaction
3. If recent responses were dialogue-heavy, introduce environmental challenges or action
4. If recent responses were static, dramatically move the plot or scene forward
5. Introduce a surprising element that changes the trajectory of the current scene
6. Create memorable details and sensory descriptions that weren't present before
7. Ensure this response meaningfully advances the narrative in a fresh direction

EDUCATIONAL ELEMENTS: 
1. Explain at least one real D&D 5e game mechanic that applies to this situation (ability checks, saving throws, attack rolls, etc.)
2. If this action could have alignment implications, explain how alignment works in D&D and how it might shift
3. If checks or rolls would be required, explicitly suggest them in the [Roll: d20+modifier vs DC X for Y] format and explain what the DC represents and how modifiers work
4. If applicable, teach about a relevant class feature, spell, or combat maneuver that could apply to this situation 
5. Relate any relevant mechanics to the rules as written in the Player's Handbook

Your response should be both narrative and educational, opening up new possibilities while teaching D&D mechanics. Adapt to the player's approach whether it's combat-focused, diplomacy, stealth, creative problem-solving, or something unexpected, and use this as an opportunity to teach relevant game mechanics.`;
    }
    
    console.log("DEBUG: Calling OpenAI in generateGameNarration", {
      model: "gpt-4o",
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      containsDiceRoll
    });
    
    try {
      // Use the proper system and user prompts
      console.log("DEBUG: Sending full request to OpenAI");
      
      // Use a more aggressive timeout for this specific request
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 45000); // 45 second timeout
      
      try {
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
          temperature: containsDiceRoll ? 0.7 : 1.0, // Higher temperature for standard responses to maximize variety
          top_p: 0.9, // Use nucleus sampling to increase creative diversity
          max_tokens: 250, // Even more reduced for better performance (from 350 to 250)
          frequency_penalty: 0.5, // Reduce repetition of same tokens
          presence_penalty: 0.5,  // Encourages model to introduce new concepts
        }, {
          signal: abortController.signal
        });
        
        clearTimeout(timeoutId); // Clear the timeout if request completes
        
        console.log("DEBUG: OpenAI response received in generateGameNarration", {
          responseLength: response.choices[0].message.content?.length || 0
        });
        
        return response.choices[0].message.content;
      } catch (err) {
        clearTimeout(timeoutId); // Make sure to clear the timeout
        throw err; // Re-throw to be handled by the outer catch block
      }
    } catch (openaiError) {
      console.error("DEBUG: OpenAI API error in generateGameNarration:", openaiError);
      throw openaiError;
    }
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
  // Check for API key first
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "missing_key") {
    console.error("OpenAI API key is missing. Cannot generate dialogue.");
    throw new Error("API key is missing. Please configure OpenAI API key.");
  }

  // Create a unique ID for this request for tracking
  const requestId = Date.now().toString().substring(6);
  console.log(`[${requestId}] Generating dialogue for NPC with prompt:`, playerPrompt ? playerPrompt.substring(0, 50) + "..." : "[initial greeting]");
  
  try {
    // Sanitize inputs to avoid undefined or null values
    const sanitizedNpcInfo = npcInfo || "A helpful D&D companion";
    const sanitizedContext = context || "A fantasy world";
    const sanitizedPrompt = playerPrompt || "";
    
    // Construct the messages array with proper error handling
    const messages = [
      {
        role: "system" as const,
        content: "You are an expert RPG dialogue writer creating authentic D&D NPC responses. Create dialogue that matches the NPC's personality and background while responding to the player's actions or questions. Keep responses concise (under 200 words) to make it feel like authentic dialogue."
      },
      {
        role: "user" as const,
        content: `NPC Information: ${sanitizedNpcInfo}\n\nContext: ${sanitizedContext}\n\n${sanitizedPrompt ? `Player says: ${sanitizedPrompt}` : "Generate an initial NPC greeting or reaction based on the context."}\n\nProvide only the NPC's dialogue response. Make it feel authentic to the character and setting.`
      }
    ];
    
    // Log essential parameters for debugging
    console.log(`[${requestId}] Request parameters:`, {
      model: "gpt-4o",
      messagesCount: messages.length,
      promptLength: sanitizedPrompt.length,
      contextLength: sanitizedContext.length,
      npcInfoLength: sanitizedNpcInfo.length
    });
    
    // Make the API request
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: messages,
      max_tokens: 300, // Limit token output for faster responses
      temperature: 0.7 // Slightly lower temperature for more consistent responses
    });

    // Verify we got a valid response
    if (!response.choices || !response.choices.length || !response.choices[0].message.content) {
      console.error(`[${requestId}] Invalid or empty response from OpenAI`, response);
      throw new Error("AI generated an empty response. Please try again.");
    }

    const responseContent = response.choices[0].message.content.trim();
    console.log(`[${requestId}] Received valid response from OpenAI (${responseContent.length} chars)`);
    
    return responseContent;
  } catch (error: any) {
    // Enhanced error logging with more details
    console.error(`[${requestId}] Error generating dialogue:`, {
      errorMessage: error.message,
      errorName: error.name,
      errorCode: error.code,
      errorStatus: error.status,
      npcInfoLength: npcInfo?.length,
      contextLength: context?.length,
      promptLength: playerPrompt?.length
    });
    
    // Create a fallback response in case of severe API errors
    const tryFallbackResponse = () => {
      // Only use fallback in production environments to avoid masking errors during development
      if (process.env.NODE_ENV === 'production') {
        try {
          // Very simple predefined responses as an absolute last resort
          const fallbackResponses = [
            "I'm sorry, I seem to be having trouble understanding right now. Could you try asking me again?",
            "My apologies, adventurer. The magical connection seems unstable. Please try again in a moment.",
            "Hmm, something is interfering with our conversation. Let's try again shortly."
          ];
          
          // Choose a random fallback
          const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
          console.log(`[${requestId}] Using fallback response`);
          return fallback;
        } catch (fallbackError) {
          // Even the fallback failed, log and continue with the error
          console.error(`[${requestId}] Fallback response generation failed:`, fallbackError);
        }
      }
      return null;
    };
    
    // Provide more specific error messages based on type
    if (error.status === 401) {
      throw new Error("Authentication error: Invalid API key");
    } else if (error.status === 429) {
      const fallback = tryFallbackResponse();
      if (fallback) return fallback;
      throw new Error("Rate limit exceeded: Too many requests to AI service");
    } else if (error.status === 500) {
      const fallback = tryFallbackResponse();
      if (fallback) return fallback;
      throw new Error("AI service error: Please try again later");
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const fallback = tryFallbackResponse();
      if (fallback) return fallback;
      throw new Error("Request timed out: AI service is taking too long to respond");
    } else {
      const fallback = tryFallbackResponse();
      if (fallback) return fallback;
      throw new Error(`Failed to generate NPC dialogue: ${error.message}`);
    }
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
  context?: string;
  enemyType?: string;
}

export async function generateRandomItem(options: ItemGenerationOptions = {}) {
  const {
    itemType = "random",
    rarity = "common",
    category = "any",
    characterLevel = 1,
    context = "",
    enemyType = ""
  } = options;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert Dungeons & Dragons narrative designer who creates immersive, context-appropriate items based on the current game story and environment.
          
          Instead of randomly generating items, you carefully craft items that:
          1. Match the narrative context provided
          2. Feel like natural discoveries within the game world
          3. Have a plausible origin story or connection to the environment
          4. Follow D&D 5e rules and balance considerations
          5. Are appropriate for level ${characterLevel} characters
          
          ${enemyType ? `This item is being dropped from a defeated ${enemyType}. Consider what such a creature might realistically possess.` : ''}
          ${context ? `The current narrative context is: "${context}"` : ''}`
        },
        {
          role: "user",
          content: `Create a narrative-appropriate ${rarity} item for this D&D adventure:
          
          ${context ? `Story Context: ${context}` : 'No specific context provided'}
          ${enemyType ? `Dropped by: ${enemyType}` : 'Found within the environment'}
          ${itemType !== "random" ? `Preferred Item Type: ${itemType}` : ''}
          ${category !== "any" ? `Category: ${category}` : ''}
          Character Level: ${characterLevel}
          
          Format your response as a JSON object with these fields:
          - name: A distinctive name for the item
          - description: A concise description of the item's appearance and function
          - backstory: A detailed narrative history of the item's origin, previous owners, and how it came to be in this location (8-10 sentences)
          - type: One of "weapon", "armor", "apparel", "potion", "scroll", "tool", "trinket", "quest", or "miscellaneous"
          - apparelSlot: If type is "apparel", include one of "head", "chest", "legs", "feet", "hands", "back", "neck", "finger", "waist"
          - rarity: One of "common", "uncommon", "rare", "very rare", "legendary", "artifact"
          - weight: The weight in pounds (can be decimal)
          - value: The value in gold pieces
          - properties: Array of special properties like "magical", "cursed", etc.
          - attunement: Boolean, whether it requires attunement
          - quantity: How many of this item (usually 1)
          - isEquipped: false (default unequipped state)
          - slot: 0 (will be assigned when added to inventory)
          - source: One of "loot", "crafted", "quest", "purchased", "starting"`
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

export async function generateWorldMap(campaignId: number, campaignInfo: any, everdiceWorld = null) {
  try {
    // Define default continents in the Everdice world if none provided
    const defaultEverdiceWorldContinents = [
      {
        name: "The Northern Reaches",
        terrainTypes: ["tundra", "taiga", "mountains", "fjords"],
        cultures: ["norse-inspired", "tribal", "isolationist"]
      },
      {
        name: "Mystara",
        terrainTypes: ["forests", "plains", "hills", "lakes"],
        cultures: ["feudal", "elven", "mixed humanoid races"]
      },
      {
        name: "The Solaran Peninsula",
        terrainTypes: ["mediterranean coast", "islands", "olive groves", "rocky hills"],
        cultures: ["city-states", "merchants", "philosophers"]
      },
      {
        name: "Eldramir",
        terrainTypes: ["ancient forests", "misty valleys", "enchanted lakes", "crystalline mountains"],
        cultures: ["magical academies", "elven kingdoms", "fey-touched"]
      },
      {
        name: "The Burning Sands",
        terrainTypes: ["vast deserts", "oases", "canyons", "salt flats"],
        cultures: ["nomadic tribes", "trade caravans", "ancient buried kingdoms"]
      },
      {
        name: "The Shattered Isles",
        terrainTypes: ["archipelagos", "volcanic islands", "coral reefs", "deep trenches"],
        cultures: ["seafarers", "pirates", "isolated island kingdoms"]
      },
      {
        name: "The Jade Expanse",
        terrainTypes: ["bamboo forests", "terraced mountains", "misty rivers", "cherry groves"],
        cultures: ["honor-bound clans", "monastic orders", "imperial court"]
      }
    ];
    
    // Extract the Everdice continents information
    const everdiceDetails = everdiceWorld ? 
      (everdiceWorld.continents || defaultEverdiceWorldContinents) :
      defaultEverdiceWorldContinents;
      
    // First, extract key geographical features from the campaign description while ensuring it fits into the Everdice world
    const geographyAnalysis = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert geographical analyzer specializing in extracting landforms, terrain features, and spatial relationships from fantasy world descriptions. 
          Your task is to carefully analyze campaign descriptions and identify ALL explicit and implied geographical features that should be represented on a map.
          
          This campaign takes place in the greater world of Everdice - a vast realm containing numerous continents, nations, and regions. Each campaign exists within a specific region of Everdice, and you must determine which continent would be most appropriate based on the campaign's theme and description.`
        },
        {
          role: "user",
          content: `Analyze this D&D campaign description and extract all geographical features that should be reflected on a map. This campaign takes place in a region of the Everdice world.
          
          Campaign Name: "${campaignInfo.name}"
          Setting Type: ${campaignInfo.setting || "fantasy world"}
          Campaign Description: ${campaignInfo.description || "An epic adventure in a fantasy realm."}
          
          Here are the continents of Everdice, select the most appropriate one for this campaign:
          ${JSON.stringify(everdiceDetails, null, 2)}
          
          Format your response as a JSON object with these fields:
          - everdiceContinent: Which continent of Everdice this region would logically belong to (must be one of the existing continents)
          - regionName: A name for this specific region within the continent
          - regionType: The type of region (e.g., "island chain", "mountain valley", "coastal kingdom", "desert emirate", etc.)
          - primaryLandforms: Array of the dominant geographical features (e.g., "peninsula", "mountain range", "archipelago", "desert", etc.)
          - secondaryFeatures: Array of additional geographical elements mentioned or implied
          - terrainDistribution: Object describing roughly what percentage of the map should be different terrain types
          - coastalFeatures: Any specific coastal elements mentioned (bays, gulfs, etc.)
          - waterBodies: Any oceans, seas, lakes, or rivers mentioned
          - settlements: Major cities, towns, or other settlements mentioned
          - regionLayout: Brief description of how regions are arranged relative to each other
          - connectionToEverdice: How this region connects to or relates to the broader world of Everdice
          - position: [latitude, longitude] approximate position coordinates within Everdice (latitude: -90 to 90, longitude: -180 to 180)
          - bounds: [[minLat, minLong], [maxLat, maxLong]] the approximate boundaries of this region`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.3, // Lower temperature for more precise analysis
    });
    
    const geographyData = safeJsonParse(geographyAnalysis.choices[0].message.content);
    
    // Now, generate more detailed world information informed by the geographical analysis
    // making sure it aligns with Everdice's existing lore
    const worldDetails = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert fantasy cartographer and worldbuilder specializing in D&D campaign worlds.
          Generate rich geographical and cultural details for a unique campaign region that fits seamlessly within the existing world of Everdice.
          You MUST ensure the region you create:
          1. Accurately reflects ALL geographical features identified in the analysis
          2. Is consistent with the terrain and cultural expectations of its parent continent in Everdice
          3. Has connections and references to the broader Everdice world
          4. Maintains internal consistency in climate, cultures, and geography`
        },
        {
          role: "user",
          content: `Create a detailed fantasy region within the Everdice world for this D&D campaign, ensuring it precisely matches the geographical analysis and fits within its assigned continent:
          
          Campaign Name: "${campaignInfo.name}"
          Setting Type: ${campaignInfo.setting || "fantasy world"}
          Campaign Description: ${campaignInfo.description || "An epic adventure in a fantasy realm."}
          
          Geographical Analysis:
          ${JSON.stringify(geographyData, null, 2)}
          
          This region exists within the continent of "${geographyData.everdiceContinent}" in the world of Everdice.
          
          Format your response as a JSON object with these fields:
          - geographicalFeatures: Array of unique landforms, bodies of water, and natural landmarks THAT MATCH the geography analysis
          - majorKingdoms: Array of 3-5 realms/nations with their characteristics and geographical positions
          - pointsOfInterest: Array of 6-8 specific notable locations (cities, dungeons, ruins, magical sites)
          - magicalElements: Unique magical aspects of this region that might appear on a map
          - regionalHistory: Brief history of how this region developed within the Everdice world
          - continentalConnections: How this region interacts with other regions in its continent
          - majorRaces: The predominant intelligent species that inhabit this region
          - aestheticTheme: The visual style/theme that should inform the map's appearance`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.7,
    });
    
    const worldData = safeJsonParse(worldDetails.choices[0].message.content);
    
    // Use the combined geographical analysis and world details to create a precise prompt for DALL-E
    const mapPrompt = `Create a highly detailed, accurate fantasy map for a D&D campaign called "${campaignInfo.name}" set in ${campaignInfo.setting || "a fantasy world"}. 

This map MUST accurately represent the following geographical features exactly as described:
${geographyData.primaryLandforms.map((feature: string) => `- ${feature}`).join('\n')}

The terrain distribution should be: 
${Object.entries(geographyData.terrainDistribution).map(([terrain, percentage]) => `- ${terrain}: ${percentage}`).join('\n')}

The map should include these specific bodies of water:
${geographyData.waterBodies.map((water: string) => `- ${water}`).join('\n')}

The map should show these major kingdoms and realms in their proper geographical positions:
${worldData.majorKingdoms.map((k: any) => `- ${typeof k === 'string' ? k : k.name}`).join('\n')}

Include these specific points of interest, clearly labeled:
${worldData.pointsOfInterest.map((p: any) => `- ${typeof p === 'string' ? p : p.name}`).join('\n')}

The map should incorporate these unique magical elements:
${worldData.magicalElements.join(', ')}

Style the map with this aesthetic: ${worldData.aestheticTheme}. Design it as an old-style hand-drawn map on aged parchment with ornate borders, a compass rose, and decorative elements. Create a high-contrast style with a color palette of rich browns, deep blues, and vibrant greens for good readability as a game reference.

Do not include any text that says "Dungeons and Dragons", "D&D", or any trademarked terms. Make sure all map features have clear fantasy names that are unique to this world.`;

    const response = await openai.images.generate({
      model: "dall-e-3", 
      prompt: mapPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "url"
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error("No image URL returned from OpenAI");
    }

    // Combine the geographical data with the Everdice world information
    return { 
      url: response.data[0].url, 
      campaignId,
      worldData: worldData,
      everdiceData: {
        continent: geographyData.everdiceContinent || "Unknown Continent",
        regionName: geographyData.regionName || campaignInfo.name,
        regionType: geographyData.regionType || "region",
        connectionToEverdice: geographyData.connectionToEverdice || "This region exists within the world of Everdice."
      }
    };
  } catch (error: any) {
    console.error("Error generating world map:", error);
    throw new Error(`Failed to generate world map: ${error.message || "Unknown error"}`);
  }
}

export async function generateCampaign(options: CampaignGenerationOptions = {}) {
  // Randomize genre, theme and tone for more variety if not specifically provided
  const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  // Define diverse genre options
  const genreOptions = [
    "high fantasy", "dark fantasy", "sword and sorcery", "epic fantasy", 
    "steampunk fantasy", "urban fantasy", "gothic horror", "cosmic horror", 
    "swashbuckling adventure", "political intrigue", "frontier fantasy",
    "magical realism", "mythic fantasy", "planar adventure", "prehistoric fantasy"
  ];
  
  // Define diverse theme options
  const themeOptions = [
    "redemption", "corruption", "survival", "discovery", "revolution", 
    "justice", "vengeance", "ascension", "fall from grace", "rebirth",
    "ancient awakening", "eldritch mystery", "planar convergence", "prophecy", 
    "invasion", "conspiracy", "exploration", "colonization", "technological revolution"
  ];
  
  // Define diverse tone options
  const toneOptions = [
    "heroic", "grim", "whimsical", "mysterious", "tragic", "hopeful", 
    "comical", "suspenseful", "horrific", "morally ambiguous", "epic",
    "intimate", "philosophical", "gritty", "dreamlike", "surreal"
  ];

  const {
    genre = getRandomElement(genreOptions),
    theme = getRandomElement(themeOptions),
    tone = getRandomElement(toneOptions)
  } = options;

  try {
    // Generate a random world archetype as a starting point
    const worldArchetypes = [
      "shattered world of floating islands", "archipelago of island nations", 
      "underground civilization beneath a wasteland", "isolated valley surrounded by impassable mountains",
      "massive ancient forest with tree cities", "sprawling desert with oasis city-states",
      "frozen tundra with nomadic tribes", "volcanic island chain with diverse microclimates",
      "planar crossroads where multiple dimensions overlap", "coastal region with many peninsulas and bays",
      "endless steppes roamed by mounted clans", "jungle-covered ruins of an ancient empire",
      "massive city-state that spans an entire mountain", "foggy wetlands with isolated settlements",
      "frozen north with warring jarldoms", "dual world with mirrored light and shadow realms"
    ];
    
    const worldArchetype = getRandomElement(worldArchetypes);
    
    // Generate some unique magical elements for variety
    const magicalElementIdeas = [
      "sentient storms that can be bargained with", "crystallized memories that can be traded and experienced",
      "magical metals that respond to emotions", "dream-harvesting as a primary industry",
      "wild magic zones that constantly shift location", "ancient machines powered by starlight",
      "magical tattoos that grant temporary powers", "song-based magic that causes physical changes",
      "living architecture that grows and responds", "ancestral spirits bound to bloodlines",
      "color-based magic where pigments determine power", "runic language where written words manifest physically",
      "weather controlled by ritual dancing", "magical beasts that bond with compatible humans",
      "spellcasting that requires synchronized group effort", "enchantments bound to constellations"
    ];
    
    const magicalElement = getRandomElement(magicalElementIdeas);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an innovative Dungeons & Dragons Dungeon Master renowned for creating imaginative, unconventional campaign worlds that break from standard fantasy tropes. You excel at worldbuilding that surprises and inspires both new and veteran players.
          
Your campaigns must:
1. Provide truly original concepts not commonly seen in typical D&D settings
2. Feature genuinely creative societies, magic systems, and ecological elements
3. Present complex, morally nuanced factions with unexpected motivations
4. Include distinctive geographical features that affect gameplay and story
5. Offer multiple paths, mysteries, and interconnected plot threads
6. Challenge standard fantasy assumptions with fresh takes on classic elements

IMPORTANT: Avoid generic medieval European fantasy tropes and standard Tolkien-inspired worlds. Create something that will genuinely surprise and delight experienced players.`
        },
        {
          role: "user",
          content: `Create a highly original D&D campaign setting with these parameters:
          - Genre: ${genre}
          - Theme: ${theme}
          - Tone: ${tone}
          - World Archetype: Consider a world that involves a "${worldArchetype}"
          - Unique Magical Element: Consider incorporating "${magicalElement}"
          
          Format your response as a JSON object with these fields:
          - name: A truly distinctive and evocative campaign name
          - description: A detailed description (300-400 words) of this unique world, emphasizing its most original elements. Include geography, societies, conflicts, magical systems, and potential adventure hooks.
          - setting: Indicate "Homebrew" and add some brief notes on what makes this setting distinctive from standard D&D worlds
          - worldQuirks: Array of 4-6 unusual features of this world that make it memorable and different
          - factions: Array of 4-5 groups with unconventional motivations and methods
          - keyLocations: Array of 5-7 distinctive locations that showcase the world's uniqueness
          - moralDilemmas: Array of 3-5 ethically complex situations players might face
          - secretThreats: Array of 2-4 hidden dangers or long-term threats players might gradually discover
          - introNarrative: A compelling campaign introduction narrative (300-400 words) that sets the scene and mood for players starting their adventure in this world. Written in second person ("you") perspective.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.9,
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating campaign:", error);
    throw new Error("Failed to generate campaign");
  }
}

export async function generateGlobalMapImage() {
  try {
    console.log("Generating Everdice global world map...");
    
    // Generate comprehensive continents and world information
    const worldBuildingPrompt = `Create a detailed fantasy world called "Everdice" with diverse continents, seas, and regions.
    
    Format your response as a JSON object with these fields:
    - continents: Array of 7-9 major continents with these properties:
        - id: String (unique identifier)
        - name: String (the name of the continent)
        - terrainTypes: Array of strings (the primary terrain features)
        - cultures: Array of strings (the major cultural groups)
        - description: String (brief description of the continent)
        - position: [latitude, longitude] (approximate center coordinates, latitude: -90 to 90, longitude: -180 to 180)
        - bounds: [[minLat, minLong], [maxLat, maxLong]] (approximate boundary coordinates for the continent)
        - majorLandmarks: Array of strings (notable landmarks or features)
    - oceans: Array of major oceans and seas with names and characteristics
    - magicalFeatures: Array of unique magical elements that define this world
    - majorConflicts: Array of current world-scale conflicts or tensions
    - cosmology: Brief description of how the planes/cosmos work in this world
    - uniqueElements: What makes this fantasy world distinct from others
    - worldHistory: Brief history of the world's major events
    `;
    
    const worldBuildingResponse = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a master fantasy world builder for D&D campaigns, specializing in creating detailed, diverse, and geographically realistic worlds with precisely defined continents and regions."
        },
        {
          role: "user",
          content: worldBuildingPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });
    
    if (!worldBuildingResponse.choices || !worldBuildingResponse.choices.length || !worldBuildingResponse.choices[0].message.content) {
      console.error("Invalid response from OpenAI for world building data");
      throw new Error("Invalid response format from OpenAI");
    }
    
    const worldDataJson = worldBuildingResponse.choices[0].message.content;
    let worldData;
    
    try {
      worldData = safeJsonParse(worldDataJson);
      
      // Validate the worldData has expected structure
      if (!worldData || !worldData.continents || !Array.isArray(worldData.continents)) {
        throw new Error("Missing required world data fields");
      }
    } catch (parseError) {
      console.error("Could not parse or validate world data:", parseError);
      throw new Error("Failed to parse world data from OpenAI");
    }
    
    // Process continents to ensure they have all required properties
    worldData.continents = worldData.continents.map((continent: any, index: number) => {
      // Ensure ID
      continent.id = continent.id || `continent-${index + 1}`;
      
      // Generate position if missing
      if (!continent.position || !Array.isArray(continent.position) || continent.position.length !== 2) {
        // Generate positions in a roughly circular pattern around the center of the map
        const angle = (index / worldData.continents.length) * 2 * Math.PI;
        const radius = 45; // Distance from center
        const latitude = 25 * Math.sin(angle);
        const longitude = 50 * Math.cos(angle);
        continent.position = [latitude, longitude];
      }
      
      // Generate bounds if missing
      if (!continent.bounds || !Array.isArray(continent.bounds) || continent.bounds.length !== 2) {
        const centerLat = continent.position[0];
        const centerLong = continent.position[1];
        const size = 20 + Math.random() * 15; // Random size between 20 and 35 degrees
        continent.bounds = [
          [Math.max(-90, centerLat - size/2), Math.max(-180, centerLong - size/2)],
          [Math.min(90, centerLat + size/2), Math.min(180, centerLong + size/2)]
        ];
      }
      
      // Ensure other required properties
      continent.description = continent.description || `A land of ${(continent.terrainTypes || ['diverse terrain']).join(' and ')}.`;
      continent.terrainTypes = continent.terrainTypes || ['varied terrain'];
      continent.cultures = continent.cultures || ['diverse peoples'];
      continent.majorLandmarks = continent.majorLandmarks || [`The ${continent.name} Capital`];
      
      return continent;
    });
    
    // Create a detailed prompt for DALL-E based on the continents information
    let continentDescriptions = '';
    
    // Add each continent to the prompt
    if (worldData.continents && worldData.continents.length > 0) {
      continentDescriptions = worldData.continents.map((c: any) => {
        const name = c?.name || "Unnamed Continent";
        const terrainTypes = Array.isArray(c?.terrainTypes) ? c.terrainTypes.join(', ') : "varied terrain";
        
        // Add landmarks if available
        let landmarkText = '';
        if (c.majorLandmarks && c.majorLandmarks.length > 0) {
          landmarkText = ` with landmarks like ${c.majorLandmarks.slice(0, 2).join(' and ')}`;
        }
        
        return `- ${name}: ${terrainTypes}${landmarkText}`;
      }).join('\n');
    } else {
      continentDescriptions = "- Mystara: forests, plains, hills\n- The Northern Reaches: tundra, mountains";
    }
    
    const oceanDescriptions = Array.isArray(worldData.oceans)
      ? worldData.oceans.map((o: any) => {
          return `- ${typeof o === 'string' ? o : (o?.name || "Unnamed Ocean")}`;
        }).join('\n')
      : "- The Great Expanse\n- The Azure Deep";
    
    const magicalFeaturesList = Array.isArray(worldData.magicalFeatures)
      ? worldData.magicalFeatures.slice(0, 3).map((feature: any) => {
          return `- ${typeof feature === 'string' ? feature : (feature?.name || feature || "Magical Feature")}`;
        }).join('\n')
      : "- The Everflame\n- Whispering Woods";
    
    const mapPrompt = `Create a beautiful, full-color fantasy world map of "Everdice", a realm of adventure.

This global map MUST accurately represent these specific continents in geographically appropriate positions:
${continentDescriptions}

The map must show these major oceans and seas:
${oceanDescriptions}

Include these unique magical features that define the world:
${magicalFeaturesList}

Style this as a detailed, high-fantasy world map on aged parchment with ornate borders, a decorative compass rose, and elegant fantasy-style illustrations of sea monsters and creatures in the oceans. Create a map with high readability, rich colors, and clear geographical labels. Make sure all text is clearly legible.

This should be a complete, global world map showing ALL of the major continents in their entirety, with proper projected curvature as if looking at a complete world. Do not include any real-world geographical features or names.`;

    console.log("Sending DALL-E map generation request...");
    const imageResponse = await openai.images.generate({
      model: "dall-e-3", 
      prompt: mapPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "url"
    });
    
    if (!imageResponse || !imageResponse.data || !imageResponse.data[0] || !imageResponse.data[0].url) {
      throw new Error("No image URL returned from OpenAI");
    }
    
    console.log("Map image generation complete");
    return {
      url: imageResponse.data[0].url,
      worldData
    };
  } catch (error: any) {
    console.error("Error generating global map image:", error);
    // Return a placeholder URL instead of throwing, to make the function more resilient
    return {
      url: "/assets/placeholder-map.jpg",
      error: error.message || "Failed to generate global map",
      worldData: {}
    };
  }
}
