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
  existingWorldFeatures?: string[]; // Track existing world elements to maintain consistency
  campaignId?: number;             // Reference the specific campaign for persistent features
  worldLocations?: {               // Store established locations with their properties
    name: string;
    description: string;
    position?: string;             // Relative geographic position
    features?: string[];           // Notable features of this location
    status?: string;               // Current status (e.g., "intact", "damaged", "ruins")
  }[];
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
    includeElements = [],
    existingWorldFeatures = [],
    worldLocations = []
  } = options;

  // Create a formatted list of existing locations with details for the AI prompt
  const existingLocationsText = worldLocations.map(loc => 
    `- ${loc.name}: ${loc.description}${loc.position ? ` (Located ${loc.position})` : ''}${loc.features ? ` Features: ${loc.features.join(", ")}` : ''}${loc.status ? ` Current status: ${loc.status}` : ''}`
  ).join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Dungeon Master's assistant, skilled in creating engaging D&D adventures with geographically consistent worlds. Always maintain world continuity and ensure geographical features persist unless explicitly changed by in-game events. Never contradict established world geography or locations."
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
          
          ${existingWorldFeatures.length > 0 ? `CRITICAL - WORLD CONSISTENCY: This adventure MUST incorporate and respect these existing world elements: ${existingWorldFeatures.join(", ")}` : ''}
          
          ${worldLocations.length > 0 ? `ESTABLISHED LOCATIONS (Must be maintained and integrated as they currently exist):\n${existingLocationsText}` : ''}
          
          WORLD CONSISTENCY RULES:
          1. Geography must be internally consistent - maintain spatial relationships between all locations
          2. Natural features (mountains, rivers, forests) remain fixed unless altered by powerful magic
          3. Settlements have consistent layouts and notable landmarks that persist between adventures
          4. New locations must have logical geographical connections to existing ones
          5. Any changes to existing locations must have clear in-game causes (battle damage, weather, etc.)
          
          Format the response as a JSON object with these fields:
          - title: Adventure title
          - description: Brief adventure overview
          - setting: Detailed setting description that maintains geographical consistency
          - hooks: Ways to introduce the adventure to players
          - mainQuest: Object with title and description
          - sideQuests: Array of objects with title and description
          - npcs: Array of important NPCs with name, description, and role
          - locations: Array of key locations with name, description, and geographic relationship to known areas
          - encounters: Array of potential encounters with description and challenge rating
          - treasures: Array of treasures and rewards
          - conclusion: Possible ending scenarios`
        }
      ],
      response_format: { type: "json_object" }
    });

    const adventureData = safeJsonParse(response.choices[0].message.content);
    
    // Extract and update world consistency information
    const newWorldFeatures: string[] = [];
    const updatedWorldLocations = [...(worldLocations || [])];
    
    // Extract new locations from the adventure
    if (adventureData.locations && Array.isArray(adventureData.locations)) {
      adventureData.locations.forEach((location: any) => {
        // Check if this is a new location not already in our list
        const existingLocation = updatedWorldLocations.find(loc => 
          loc.name.toLowerCase() === location.name.toLowerCase()
        );
        
        if (!existingLocation) {
          // Add as a new world location
          updatedWorldLocations.push({
            name: location.name,
            description: location.description,
            position: location.position || location.geographicRelation || '',
            features: location.features || [],
            status: location.status || 'intact'
          });
          
          // Add to new world features
          newWorldFeatures.push(`${location.name} (${location.position || location.geographicRelation || 'New Location'})`);
        } else {
          // Update existing location if it has changed
          if (location.status && location.status !== existingLocation.status) {
            existingLocation.status = location.status;
          }
          
          // Add any new features
          if (location.features && Array.isArray(location.features)) {
            location.features.forEach((feature: string) => {
              if (!existingLocation.features?.includes(feature)) {
                existingLocation.features = [...(existingLocation.features || []), feature];
              }
            });
          }
        }
      });
    }
    
    // Return the adventure data with updated world consistency information
    return {
      ...adventureData,
      worldConsistencyData: {
        newWorldFeatures,
        updatedWorldLocations,
        worldFeaturesUpdated: [...(existingWorldFeatures || []), ...newWorldFeatures]
      }
    };
  } catch (error) {
    console.error("Error generating adventure:", error);
    throw new Error("Failed to generate adventure");
  }
}

export async function generateGameNarration(context: string, playerAction: string, isAutoAdvance: boolean = false) {
  try {
    // Create a controller to allow timeout for OpenAI requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout - reduced further to prevent long waiting
    
    let systemPrompt = `You are a creative D&D Dungeon Master narrating a game. Create responses under 200 words that move the story forward with engaging narrative and varied storytelling.

RESPONSE REQUIREMENTS:
1. Keep responses UNDER 200 WORDS
2. Vary your narrative style to keep gameplay fun and unpredictable
3. Present meaningful choices with alignment consequences
4. Suggest dice rolls in [Roll: d20+modifier vs DC X for Y] format
5. Regularly introduce opportunities for:
   - Character development through moral choices
   - Acquiring interesting items, weapons or magic objects
   - Exciting combat encounters with varied enemies
   - Skills tests that build character stats
   - Meeting unique NPCs and potential allies

WORLD CONSISTENCY RULES:
1. Maintain a geographically consistent world throughout the game
2. All locations you create must remain in the same positions relative to each other
3. Natural features like mountains, rivers, and forests must remain fixed
4. Once you establish a location, it persists unless explicitly altered by player actions
5. Towns and landmarks maintain their established characteristics
6. Never contradict previously established world geography

IMPORTANT: Reward creative actions with minor benefits and handle unusual player approaches positively.`;

    // Check if playerAction contains a dice roll
    const containsDiceRoll = playerAction.match(/roll(ed|s)\s+\d+|result\s+\d+|DC\s+\d+|success|failure|critical/i);
    
    // Check if playerAction is a creative/performative action with a more precise pattern
    // Focus on expressly performative actions while avoiding simple directional movement
    const isPerformativeAction = 
      playerAction.match(/\b(somersault|flip|dance|twirl|leap dramatically|tada|ballet|backflip|lightsaber|perform|flourish|dramatic|bow dramatically|laugh at|laugh maniacally|smile wickedly|grin evilly|wink at|draw my|pull out my|brandish|wave|spin around|juggle|cartwheel|sneak past|pose|gesture|salute)\b/i) &&
      !playerAction.match(/\b(walk|go|move|head|proceed|continue|enter|exit|leave|open|close|push|pull)\b/i);
    
    let userPrompt = "";
    
    if (isPerformativeAction) {
      userPrompt = `Action: ${playerAction}

Describe in 1-2 sentences how this creative action plays out, with a minor positive effect. Keep to 50 words maximum.`;  
    } else if (isAutoAdvance) {
      userPrompt = `Auto-advance story request.

Respond in under 200 words with ONE of these narrative elements (vary between them for gameplay variety):
1. A surprise combat encounter with an interesting enemy that offers item rewards
2. Discovery of a valuable item, treasure, or magical object with unique properties
3. Meeting a unique NPC who offers information, quests, or alignment-changing choices
4. A moral dilemma that affects character alignment with clear consequences
5. An environmental challenge requiring skill checks that could improve character stats
6. A puzzle or trap that rewards creative thinking and offers valuable rewards
7. A plot twist that reveals new information about the main quest or world

Include a clear choice, challenge, or suggested dice roll [Roll: d20+modifier vs DC X for Y].`;
    } else if (containsDiceRoll) {
      // Special handling for dice roll actions with educational elements
      userPrompt = `Dice Roll: ${playerAction}

Respond in under 200 words with:
1. The specific consequence of this roll result with dramatic flair
2. One brief educational element about D&D mechanics for player learning
3. ONE of these impacts (vary between them for gameplay variety):
   - Character growth opportunity with a specific stat or skill improvement
   - Discovery of a unique item or weapon with interesting properties
   - Alignment shift opportunity with clear consequences
   - NPC relationship development opportunity
   - New quest or storyline revelation based on the roll outcome

Keep your response focused, exciting, and directly tied to the roll result.`;
    } else {
      userPrompt = `Player Action: ${playerAction}

Respond in under 200 words with:
1. A direct, vibrant response to the player's action with meaningful consequences
2. ONE of these elements (vary between them for gameplay variety):
   - Combat opportunity with rewards for victory
   - A moral choice affecting alignment with clear consequences
   - Discovery of a valuable or magical item with unique properties
   - A skill challenge that could improve character abilities
   - An NPC interaction offering quests or information
3. A suggested dice roll if appropriate [Roll: d20+modifier vs DC X for Y]

Use varied narrative styles and keep scenarios fresh and unpredictable.`;
    }
    
    console.log("DEBUG: Calling OpenAI in generateGameNarration", {
      model: "gpt-4o",
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      containsDiceRoll,
      isPerformativeAction: isPerformativeAction ? "yes" : "no"
    });
    
    try {
      // Use the proper system and user prompts
      console.log("DEBUG: Sending full request to OpenAI");
      
      // We created the controller earlier to ensure it's available for cleanup
      
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
          temperature: isPerformativeAction ? 0.7 : (containsDiceRoll ? 0.6 : 0.8), // Reduced temperature for more stable responses
          top_p: 0.8, // Slightly more focused sampling
          max_tokens: 150, // Further reduced for better performance
          frequency_penalty: 0.3, // Reduced to speed up generation
          presence_penalty: 0.3, // Reduced to speed up generation
        }, {
          signal: controller.signal
        });
        
        // Clear the timeout if request completes
        clearTimeout(timeoutId);
        
        console.log("DEBUG: OpenAI response received in generateGameNarration", {
          responseLength: response.choices[0].message.content?.length || 0
        });
        
        return response.choices[0].message.content;
      } catch (err: any) {
        clearTimeout(timeoutId); // Make sure to clear the timeout
        
        // Check if this is an abort error (timeout)
        if (err?.name === 'AbortError' || err?.message?.includes('abort') || err?.message?.includes('timeout')) {
          console.warn("Request timed out in generateGameNarration. Using fallback response.");
          
          // Create appropriate fallback responses based on the action type
          if (isPerformativeAction) {
            return `With a flourish, you ${playerAction}. The action adds a bit of flair to the moment, and you sense a slight boost in confidence.`;
          } else if (containsDiceRoll) {
            return `The Dungeon Master nods. "Go ahead and make that roll, and we'll see what happens next!"`;
          } else if (isAutoAdvance) {
            return `The adventure continues. The path ahead presents both challenges and opportunities. What would you like to do next?`;
          } else {
            return `The Dungeon Master considers your action. "Interesting approach! Let's see how that plays out as the story continues."`;
          }
        }
        
        // If it's another type of error, re-throw
        throw err;
      }
    } catch (openaiError) {
      console.error("DEBUG: OpenAI API error in generateGameNarration:", openaiError);
      
      // Provide a generic fallback even for non-timeout errors
      return `The Dungeon Master pauses momentarily. "Let's continue with the adventure. What would you like to do next?"`;
    }
  } catch (error) {
    console.error("Error generating narration:", error);
    // Instead of throwing, return a generic response so game can continue
    return `The Dungeon Master nods thoughtfully. "What would you like to do next in this adventure?"`;
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
  worldConsistencyRules?: string[];  // Special rules for maintaining world consistency
  existingGeography?: {              // Track established geographical features
    naturalFeatures: string[];       // Mountains, rivers, forests, etc.
    settlements: string[];           // Towns, cities, villages
    landmarks: string[];             // Notable locations
    regions: string[];               // Named regions/provinces
  };
  worldType?: string;                // Type of world (e.g., "archipelago", "continent", "desert", etc.)
  existingMagicSystems?: string[];   // Established magical rules or systems
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
    // Determine an appropriate rarity based on character level if not specified
    let effectiveRarity = rarity;
    if (rarity === "random" || rarity === "appropriate") {
      if (characterLevel <= 4) {
        // Tier 1: Levels 1-4
        const rarityOptions = ["common", "common", "common", "uncommon"];
        effectiveRarity = rarityOptions[Math.floor(Math.random() * rarityOptions.length)];
      } else if (characterLevel <= 10) {
        // Tier 2: Levels 5-10
        const rarityOptions = ["common", "uncommon", "uncommon", "rare"];
        effectiveRarity = rarityOptions[Math.floor(Math.random() * rarityOptions.length)];
      } else if (characterLevel <= 16) {
        // Tier 3: Levels 11-16
        const rarityOptions = ["uncommon", "rare", "rare", "very rare"];
        effectiveRarity = rarityOptions[Math.floor(Math.random() * rarityOptions.length)];
      } else {
        // Tier 4: Levels 17-20
        const rarityOptions = ["rare", "very rare", "very rare", "legendary"];
        effectiveRarity = rarityOptions[Math.floor(Math.random() * rarityOptions.length)];
      }
    }
    
    // Determine effective item type based on context if not specified
    let effectiveItemType = itemType;
    if (itemType === "random" || itemType === "contextual") {
      // Default item types if no context is provided
      const defaultItemTypes = [
        "weapon", "weapon", 
        "armor", "armor", 
        "apparel", "apparel",
        "potion", "potion", "potion", 
        "scroll", "scroll",
        "trinket", "trinket", "trinket", 
        "tool", "tool",
        "miscellaneous"
      ];
      effectiveItemType = defaultItemTypes[Math.floor(Math.random() * defaultItemTypes.length)];
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert Dungeons & Dragons narrative designer who creates immersive, context-appropriate items that enhance character development and ethical alignment.
          
Instead of randomly generating items, you carefully craft items that:
1. Match the narrative context provided and feel like meaningful rewards
2. Feel like natural discoveries within the game world
3. Have a plausible origin story or connection to the environment or foe
4. Follow D&D 5e rules and balance considerations
5. Are appropriate for level ${characterLevel} characters
6. Provide interesting strategic options beyond basic mechanical benefits
7. Have evocative descriptions that bring them to life
8. Connect to world lore and potential future storylines
9. MOST IMPORTANTLY: Help develop character abilities and ethical alignment

CHARACTER DEVELOPMENT FOCUS:
1. ETHICAL ALIGNMENT IMPACT:
   - Items that change or shift alignment when used (e.g., a weapon that becomes more powerful when used for evil)
   - Items with different effects based on the user's alignment
   - Items with moral dilemmas built into their use
   - Sentient items with their own alignment that may conflict with the user's
   - Items that attract certain aligned NPCs or factions

2. ABILITY SCORE ENHANCEMENT:
   - Items that temporarily boost specific ability scores in certain situations
   - Items that provide permanent ability score increases after specific achievements
   - Items that allow powerful abilities but at a statistical cost
   - Items that reveal hidden talents or abilities in the character

3. SKILL AND CLASS ENHANCEMENT:
   - Items that allow limited use of abilities from other classes
   - Items that enhance existing class features in interesting ways
   - Items that grant proficiency in new skills or tools
   - Items that allow creative problem-solving beyond standard character options

BALANCE GUIDELINES:
- Common items: Minor conveniences, +1 to specific situations, 1d4 damage boost, usable 1/day
- Uncommon items: +1 weapons/armor, situational advantages, 1d6 damage boost, usable 1-3/day
- Rare items: +2 weapons/armor, significant tactical advantages, 2d6 damage boost, 3-5/day uses
- Very rare: +3 weapons/armor, powerful abilities, significant permanent advantages
- Legendary: Campaign-changing abilities, famous artifacts, major power increases

${enemyType ? `This item is being dropped from a defeated ${enemyType}. The item should reflect this creature's nature, abilities, and lore while being useful to adventurers.` : ''}
${context ? `The current narrative context is: "${context}"` : ''}`
        },
        {
          role: "user",
          content: `Create a narrative-appropriate ${effectiveRarity} item for this D&D adventure that enhances character development and ethical alignment:
          
${context ? `Story Context: ${context}` : 'No specific context provided'}
${enemyType ? `Dropped by: ${enemyType}` : 'Found within the environment'}
${effectiveItemType !== "random" ? `Item Type: ${effectiveItemType}` : ''}
${category !== "any" ? `Category: ${category}` : ''}
Character Level: ${characterLevel}

The item should:
1. Feel meaningful and connected to the narrative context
2. Offer interesting character development opportunities
3. Impact or be impacted by ethical alignment choices
4. Provide tactical options beyond simple stat bonuses
5. Have a rich history that ties into the world

Format your response as a JSON object with these fields:
- name: A distinctive, evocative name for the item
- description: A concise description of the item's appearance
- function: A clear explanation of what the item does mechanically
- alignmentEffect: How this item affects or is affected by character alignment
- characterGrowth: How this item contributes to character development or ability growth
- backstory: A detailed narrative history of the item's origin, previous owners, and how it came to be in this location (3-5 sentences)
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
      temperature: 0.8, // Slightly higher temperature for more creative items
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
          content: `You are an innovative Dungeons & Dragons Dungeon Master renowned for creating imaginative, unconventional campaign worlds that break from standard fantasy tropes while maintaining strict geographical consistency. You excel at worldbuilding that surprises and inspires both new and veteran players.
          
Your campaigns must:
1. Provide truly original concepts not commonly seen in typical D&D settings
2. Feature genuinely creative societies, magic systems, and ecological elements
3. Present complex, morally nuanced factions with unexpected motivations
4. Include distinctive geographical features that affect gameplay and story
5. Offer multiple paths, mysteries, and interconnected plot threads
6. Challenge standard fantasy assumptions with fresh takes on classic elements

WORLD CONSISTENCY REQUIREMENTS:
1. Create a geographically CONSISTENT world - all locations must maintain fixed spatial relationships
2. Natural features like mountains, rivers, and forests must be treated as permanent fixtures 
3. Settlements must have defined positions relative to geographical features and other settlements
4. Once established, locations and features PERSIST throughout the campaign unless explicitly changed
5. Each region should have distinctive ecological, cultural, and architectural characteristics
6. Transportation, trade routes, and distances must make logical sense within the game world

IMPORTANT: Avoid generic medieval European fantasy tropes and standard Tolkien-inspired worlds. Create something that will genuinely surprise and delight experienced players while maintaining a believable, consistent world geography.`
        },
        {
          role: "user",
          content: `Create a highly original D&D campaign setting with these parameters:
          - Genre: ${genre}
          - Theme: ${theme}
          - Tone: ${tone}
          - World Archetype: Consider a world that involves a "${worldArchetype}"
          - Unique Magical Element: Consider incorporating "${magicalElement}"
          ${options.worldType ? `- World Type: This must be a "${options.worldType}" type world` : ''}
          
          ${options.worldConsistencyRules?.length ? `CRITICAL - WORLD CONSISTENCY REQUIREMENTS:
          ${options.worldConsistencyRules.map((rule, i) => `${i+1}. ${rule}`).join('\n')}` : ''}
          
          ${options.existingGeography?.naturalFeatures?.length ? `ESTABLISHED NATURAL FEATURES (Must remain fixed in the world):
          ${options.existingGeography.naturalFeatures.map(f => `- ${f}`).join('\n')}` : ''}
          
          ${options.existingGeography?.settlements?.length ? `ESTABLISHED SETTLEMENTS (Must be incorporated with consistent locations):
          ${options.existingGeography.settlements.map(s => `- ${s}`).join('\n')}` : ''}
          
          ${options.existingGeography?.landmarks?.length ? `ESTABLISHED LANDMARKS (Must persist in their current locations):
          ${options.existingGeography.landmarks.map(l => `- ${l}`).join('\n')}` : ''}
          
          ${options.existingGeography?.regions?.length ? `ESTABLISHED REGIONS (Must be included with their existing characteristics):
          ${options.existingGeography.regions.map(r => `- ${r}`).join('\n')}` : ''}
          
          ${options.existingMagicSystems?.length ? `ESTABLISHED MAGIC SYSTEMS (Must be maintained consistently):
          ${options.existingMagicSystems.map(m => `- ${m}`).join('\n')}` : ''}
          
          Format your response as a JSON object with these fields:
          - name: A truly distinctive and evocative campaign name
          - description: A detailed description (300-400 words) of this unique world, emphasizing its most original elements. Include geography, societies, conflicts, magical systems, and potential adventure hooks.
          - geography: A detailed catalog of the world's geographic features with precise relative locations
          - naturalFeatures: An array of all mountains, rivers, forests, lakes, etc., with descriptions
          - settlements: An array of all significant settlements with descriptions and geographic positions
          - landmarks: An array of all notable landmarks with descriptions and exact locations
          - regions: An array of all major regions/provinces with descriptions of their boundaries and characteristics
          - magicalSystems: Detailed descriptions of how magic functions in this world
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

    const campaignData = safeJsonParse(response.choices[0].message.content);
    
    // Extract and store geographical data for world consistency
    const geographyData = {
      naturalFeatures: campaignData.naturalFeatures || [],
      settlements: campaignData.settlements || [],
      landmarks: campaignData.landmarks || [],
      regions: campaignData.regions || []
    };
    
    // Store magic systems for consistency
    const magicalSystems = campaignData.magicalSystems || [];
    
    // Extract world type if available
    const worldType = campaignData.geography?.worldType || worldArchetype;
    
    // Prepare for next generation by enhancing options with world consistency data
    const enhancedCampaignData = {
      ...campaignData,
      worldConsistencyData: {
        existingGeography: geographyData,
        worldType: worldType,
        existingMagicSystems: magicalSystems
      }
    };
    
    return enhancedCampaignData;
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
