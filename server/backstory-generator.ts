import OpenAI from "openai";
import OpenAI from "openai";

// Helper function copied from openai.ts to avoid circular dependency
function safeJsonParse(content: string | null | undefined) {
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing JSON from OpenAI response:", error);
    return {};
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BackstoryNode {
  id: string;
  text: string;
  choices?: BackstoryChoice[];
  ending?: boolean;
  tags?: string[];
}

export interface BackstoryChoice {
  text: string;
  nextNodeId: string;
  impact?: {
    alignment?: "lawful" | "chaotic" | "good" | "evil" | "neutral";
    personality?: Record<string, number>;
    background?: string[];
  };
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

export async function generateBackstoryTree(options: BackstoryNodeGenerationOptions = {}) {
  const {
    race = "human",
    class: characterClass = "fighter",
    alignment = "neutral",
    theme = "classic fantasy"
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a D&D narrative designer specialized in creating branching backstory paths for player characters. You create interactive story trees that allow players to build their character's history through meaningful choices.

Create a backstory tree structure that begins with a formative event and branches into multiple paths based on character choices. Each choice should affect personality traits, background elements, and alignment tendencies.

The tree should have:
1. A starting node (id: "start")
2. Multiple branching paths with meaningful choices (at least 3-4 branches deep)
3. Several ending nodes that wrap up the character's backstory journey

Each node should have:
- id: A unique identifier string
- text: The narrative text for this node (1-2 paragraphs)
- choices: Array of possible choices (except for ending nodes)
  - Each choice has:
    - text: The choice text
    - nextNodeId: The id of the next node
    - impact: How this choice affects the character
      - alignment: Optional effect on alignment ("lawful", "chaotic", "good", "evil", "neutral")
      - personality: Optional key-value pairs of traits and their magnitude (-3 to +3)
      - background: Optional array of background elements this choice adds

For ending nodes, include "ending: true" instead of choices array.

Craft this narrative tree specifically for a ${race} ${characterClass} with initial ${alignment} tendencies in a ${theme} setting.`
        },
        {
          role: "user",
          content: `Generate a complete branching backstory tree for a ${race} ${characterClass}.

Create a rich narrative tree with:
- A compelling starting situation
- At least 3 initial choices from the start node
- Each path should branch at least 3-4 times before reaching an ending
- Each choice should have meaningful impact on the character's development
- Provide at least 15-20 total nodes to allow for a rich variety of backstories
- Include plot elements appropriate for a ${race} ${characterClass} in a ${theme} world
- Ensure the narrative flows naturally between connected nodes
- Ensure each choice feels meaningful to character development

Return the result as a JSON object with:
- nodes: An object where keys are node IDs and values are the node objects
- startNodeId: The ID of the starting node (usually "start")`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating backstory tree:", error);
    throw new Error("Failed to generate backstory tree");
  }
}

export async function finalizeBackstory(options: BackstoryPathOptions) {
  const {
    race = "human",
    class: characterClass = "fighter",
    narrativePath,
    personalityTraits,
    backgroundElements,
    alignmentTendencies
  } = options;

  // Extract alignment description based on tendencies
  let alignmentDescription = "neutral";
  if (alignmentTendencies.lawChaos <= -5) {
    alignmentDescription = "lawful";
  } else if (alignmentTendencies.lawChaos >= 5) {
    alignmentDescription = "chaotic";
  }
  
  if (alignmentTendencies.goodEvil <= -5) {
    alignmentDescription += " good";
  } else if (alignmentTendencies.goodEvil >= 5) {
    alignmentDescription += " evil";
  } else if (alignmentDescription === "neutral") {
    alignmentDescription = "true neutral";
  } else {
    alignmentDescription += " neutral";
  }

  // Convert personality traits to a description
  const personalityDescription = Object.entries(personalityTraits)
    .filter(([, value]) => Math.abs(value) >= 2) // Only include strong traits
    .map(([trait, value]) => {
      if (value >= 4) return `extremely ${trait}`;
      if (value >= 2) return `notably ${trait}`;
      if (value <= -4) return `rarely ${trait}`;
      if (value <= -2) return `somewhat reluctant to be ${trait}`;
      return null;
    })
    .filter(Boolean)
    .join(", ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a master storyteller who crafts compelling character backstories for D&D characters. Given a series of narrative events and choices a character has made in their past, you create a cohesive, flowing backstory that makes these elements fit together naturally.

Write in second person perspective (using "you") to immerse the player in their character's history. The backstory should:
1. Flow naturally between life events
2. Incorporate all provided narrative elements and choices
3. Add appropriate details to flesh out the story
4. Reflect the character's personality traits and alignment tendencies
5. Include hooks for future adventures and connections
6. Be written in 3-5 rich paragraphs

Create a backstory that feels personal and unique, while fitting the character's race, class, and the choices they've made.`
        },
        {
          role: "user",
          content: `Create a flowing, cohesive backstory for a ${race} ${characterClass} based on the following narrative path, personality traits, and alignment tendencies.

Narrative Path (in chronological order):
${narrativePath.map((step, i) => `Event ${i + 1}: ${step.nodeText}${step.choiceText ? `\nYour choice: ${step.choiceText}` : ""}`).join("\n\n")}

Character tends toward: ${alignmentDescription}

Personality traits: ${personalityDescription || "balanced and adaptable"}

Background elements: ${backgroundElements.join(", ") || "standard adventurer background"}

Generate a backstory written in second person (using "you"), incorporating these elements into a compelling personal history of 3-5 paragraphs. The story should flow naturally between the events, add appropriate details, and fit the character's race and class.`
        }
      ],
      temperature: 0.8,
    });

    const backstory = response.choices[0].message.content;
    return { backstory };
  } catch (error) {
    console.error("Error finalizing backstory:", error);
    throw new Error("Failed to finalize backstory");
  }
}