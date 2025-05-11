import OpenAI from "openai";
import { 
  CharacterRelationship, 
  Character,
  RelationshipPrediction,
  User
} from "@shared/schema";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type RelationshipAnalysis = {
  summary: string;
  dynamicFactors: string[];
  potentialConflicts: string[];
  growthOpportunities: string[];
  predictions: {
    event: string;
    outcome: string;
    triggerCondition: string;
    probability: number;
  }[];
};

type CharacterRelationshipContext = {
  sourceCharacter: Character;
  targetCharacter: Character;
  relationship: CharacterRelationship;
  campaignContext?: {
    campaignId: number;
    campaignTitle: string;
    campaignTheme: string;
    campaignSetting: string;
  };
};

/**
 * Analyzes a character relationship and generates insights using AI
 */
export async function analyzeRelationship(context: CharacterRelationshipContext): Promise<RelationshipAnalysis> {
  try {
    // Ensure we have the OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Format relationship history for context
    const interactionHistoryText = context.relationship.interactionHistory && context.relationship.interactionHistory.length > 0
      ? context.relationship.interactionHistory.map(interaction => (
        `- Date: ${new Date(interaction.date).toISOString().split('T')[0]}\n` +
        `  Description: ${interaction.description}\n` +
        `  Impact: ${interaction.impact > 0 ? '+' : ''}${interaction.impact}\n` +
        `  Context: ${interaction.context}`
      )).join('\n\n')
      : "No previous interactions recorded.";
    
    // Create the system prompt
    const systemPrompt = `You are an expert D&D relationship analyzer that helps predict character dynamics in tabletop RPG campaigns.
Analyze the relationship between two characters and provide insights based on their relationship type, strength, and interaction history.
For predictions, consider the characters' classes, races, and the campaign setting/theme when available.
Your analysis should include:
1. A summary of the current relationship
2. Key dynamic factors influencing this relationship
3. Potential conflicts that might arise
4. Growth opportunities for positive development
5. Specific predictions about future interactions with event, outcome, trigger condition, and probability

Format predictions as events that could reasonably occur in a D&D campaign setting, with trigger conditions that are clear and observable.
Make your analysis and predictions specific to the characters' traits, not generic.`;

    // Create the user prompt with all relationship information
    const userPrompt = `Please analyze the relationship between these two D&D characters:

SOURCE CHARACTER:
Name: ${context.sourceCharacter.name}
Race: ${context.sourceCharacter.race}
Class: ${context.sourceCharacter.class}
Level: ${context.sourceCharacter.level}
Background: ${context.sourceCharacter.background || "Unknown"}

TARGET CHARACTER:
Name: ${context.targetCharacter.name}
Race: ${context.targetCharacter.race}
Class: ${context.targetCharacter.class}
Level: ${context.targetCharacter.level}
Background: ${context.targetCharacter.background || "Unknown"}

RELATIONSHIP DETAILS:
Type: ${context.relationship.relationshipType}
Strength: ${context.relationship.relationshipStrength} (scale from -10 to +10)
Notes: ${context.relationship.notes || "None"}

INTERACTION HISTORY:
${interactionHistoryText}

${context.campaignContext ? `CAMPAIGN CONTEXT:
Title: ${context.campaignContext.campaignTitle}
Theme: ${context.campaignContext.campaignTheme}
Setting: ${context.campaignContext.campaignSetting}` : "No campaign context available."}

Based on this information, provide your complete relationship analysis and predictions.`;

    // Make the OpenAI API call
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Extract and format the analysis
    return {
      summary: result.summary || "No summary available",
      dynamicFactors: result.dynamic_factors || result.dynamicFactors || [],
      potentialConflicts: result.potential_conflicts || result.potentialConflicts || [],
      growthOpportunities: result.growth_opportunities || result.growthOpportunities || [],
      predictions: (result.predictions || []).map((prediction: any) => ({
        event: prediction.event || prediction.predicted_event || "",
        outcome: prediction.outcome || prediction.predicted_outcome || "",
        triggerCondition: prediction.trigger_condition || prediction.triggerCondition || "",
        probability: Math.min(100, Math.max(0, parseInt(prediction.probability) || 50))
      }))
    };
  } catch (error) {
    console.error("Error analyzing relationship:", error);
    // Return a fallback analysis if there's an error
    return {
      summary: "Unable to analyze relationship due to an error.",
      dynamicFactors: ["Error: AI analysis unavailable"],
      potentialConflicts: ["Error: AI analysis unavailable"],
      growthOpportunities: ["Error: AI analysis unavailable"],
      predictions: []
    };
  }
}

/**
 * Automatically generates relationship predictions for a campaign
 */
export async function generateCampaignRelationshipPredictions(
  campaignId: number,
  dmId: number
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Get all campaign characters
    const campaignCharacters = await storage.getCampaignCharacters(campaignId);
    if (campaignCharacters.length < 2) {
      return { success: false, count: 0, error: "Campaign needs at least 2 characters for relationship predictions" };
    }
    
    // Get campaign details
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      return { success: false, count: 0, error: "Campaign not found" };
    }
    
    // Verify the DM
    if (campaign.dmId !== dmId) {
      return { success: false, count: 0, error: "Only the DM can generate predictions" };
    }
    
    // Get character IDs
    const characterIds = campaignCharacters.map(cc => cc.characterId);
    
    // Find all relationships between characters in this campaign
    let createdCount = 0;
    
    // For each character, get their relationships
    for (const characterId of characterIds) {
      const relationships = await storage.getCharacterRelationships(characterId);
      
      // Filter relationships to those within the campaign
      const campaignRelationships = relationships.filter(relationship => {
        const otherCharacterId = relationship.sourceCharacterId === characterId
          ? relationship.targetCharacterId
          : relationship.sourceCharacterId;
          
        return characterIds.includes(otherCharacterId);
      });
      
      // For each relationship, generate a prediction if there isn't already a pending one
      for (const relationship of campaignRelationships) {
        // Check if there's already a pending prediction
        const existingPredictions = await storage.getRelationshipPredictions(
          relationship.id,
          campaignId
        );
        
        const hasPendingPrediction = existingPredictions.some(p => !p.wasTriggered);
        
        // Skip if there's already a pending prediction
        if (hasPendingPrediction) continue;
        
        // Get both characters
        const sourceCharacter = await storage.getCharacter(relationship.sourceCharacterId);
        const targetCharacter = await storage.getCharacter(relationship.targetCharacterId);
        
        if (!sourceCharacter || !targetCharacter) continue;
        
        // Get campaign context
        const campaignContext = {
          campaignId,
          campaignTitle: campaign.title || "",
          campaignTheme: campaign.theme || "",
          campaignSetting: campaign.setting || ""
        };
        
        // Analyze the relationship
        const analysis = await analyzeRelationship({
          sourceCharacter,
          targetCharacter,
          relationship,
          campaignContext
        });
        
        // Create a prediction from the analysis
        if (analysis.predictions && analysis.predictions.length > 0) {
          // Pick a random prediction from the analysis
          const randomPrediction = analysis.predictions[
            Math.floor(Math.random() * analysis.predictions.length)
          ];
          
          // Create the prediction
          await storage.createRelationshipPrediction({
            relationshipId: relationship.id,
            campaignId,
            predictedEvent: randomPrediction.event,
            predictedOutcome: randomPrediction.outcome,
            triggerCondition: randomPrediction.triggerCondition,
            probability: randomPrediction.probability,
            wasTriggered: false,
            createdAt: new Date()
          });
          
          createdCount++;
        }
      }
    }
    
    return { success: true, count: createdCount };
  } catch (error) {
    console.error("Error generating campaign relationship predictions:", error);
    return { 
      success: false, 
      count: 0, 
      error: `Error generating predictions: ${(error as Error).message}` 
    };
  }
}

/**
 * Analyzes how characters might interact with a new character
 */
export async function predictNewCharacterInteractions(
  newCharacterId: number,
  campaignId: number
): Promise<{
  interactions: Array<{
    existingCharacterId: number;
    existingCharacterName: string;
    potentialRelationship: string;
    initialImpression: string;
    interactionStyle: string;
  }>;
}> {
  try {
    // Get the new character
    const newCharacter = await storage.getCharacter(newCharacterId);
    if (!newCharacter) {
      throw new Error("New character not found");
    }
    
    // Get campaign details
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Get existing campaign characters
    const campaignCharacters = await storage.getCampaignCharacters(campaignId);
    const existingCharacterIds = campaignCharacters
      .map(cc => cc.characterId)
      .filter(id => id !== newCharacterId);
    
    // If no existing characters, return empty result
    if (existingCharacterIds.length === 0) {
      return { interactions: [] };
    }
    
    // Get character details for all existing characters
    const existingCharacters = await Promise.all(
      existingCharacterIds.map(id => storage.getCharacter(id))
    );
    
    // Filter out any undefined characters
    const validExistingCharacters = existingCharacters.filter(
      (char): char is Character => !!char
    );
    
    // Prepare the prompt for the OpenAI API
    const systemPrompt = `You are an expert D&D character analyst specialized in predicting how characters will interact based on their classes, races, backgrounds, and other traits. 
For each existing character in the campaign, predict how they might interact with the new character joining their party. 
Focus on initial impressions, potential relationship types, and interaction styles.
Consider class dynamics, race relations, background synergies or conflicts, and typical D&D party dynamics.
Format your response as a JSON array with objects containing existingCharacterId, existingCharacterName, potentialRelationship, initialImpression, and interactionStyle fields.`;

    // Format character information
    const newCharacterInfo = `
NEW CHARACTER:
Name: ${newCharacter.name}
Race: ${newCharacter.race}
Class: ${newCharacter.class}
Level: ${newCharacter.level}
Background: ${newCharacter.background || "Unknown"}
Appearance: ${newCharacter.appearance || "Not described"}
Backstory: ${newCharacter.backstory ? newCharacter.backstory.substring(0, 200) + "..." : "Unknown"}
`;

    const existingCharactersInfo = validExistingCharacters.map(char => `
EXISTING CHARACTER:
ID: ${char.id}
Name: ${char.name}
Race: ${char.race}
Class: ${char.class}
Level: ${char.level}
Background: ${char.background || "Unknown"}
Backstory: ${char.backstory ? char.backstory.substring(0, 100) + "..." : "Unknown"}
`).join("\n");

    const campaignInfo = `
CAMPAIGN CONTEXT:
Title: ${campaign.title || "Unnamed Campaign"}
Theme: ${campaign.theme || "Unknown"}
Setting: ${campaign.setting || "Unknown"}
`;

    const userPrompt = `A new character is joining a D&D campaign. Predict how each existing character might interact with this newcomer.

${newCharacterInfo}

${existingCharactersInfo}

${campaignInfo}

Predict initial interactions between each existing character and the new character. Consider their traits, classes, backgrounds, etc. 
Return a JSON array with detailed predictions for each existing character.`;

    // Make the OpenAI API call
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Extract and validate the predictions
    const interactions = (result.interactions || []).map((interaction: any) => ({
      existingCharacterId: parseInt(interaction.existingCharacterId),
      existingCharacterName: interaction.existingCharacterName,
      potentialRelationship: interaction.potentialRelationship,
      initialImpression: interaction.initialImpression,
      interactionStyle: interaction.interactionStyle
    }));
    
    return { interactions };
  } catch (error) {
    console.error("Error predicting new character interactions:", error);
    return { interactions: [] };
  }
}