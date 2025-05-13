/**
 * Ambient Sound Context Analyzer
 * 
 * This module analyzes narrative text to determine appropriate ambient sounds
 * based on contextual analysis of the narrative content.
 */

export interface AmbientSoundContext {
  primary: string;       // Main ambient sound (environment)
  secondary?: string;    // Secondary ambient sound (could be weather, time of day, etc.)
  environment: string;   // Description of the environment (forest, town, dungeon, etc.)
  mood: string;          // The mood of the scene (peaceful, tense, mysterious, etc.)
}

// Map event keywords to sound files
const EVENT_SOUNDS_BASE: Record<string, string> = {
  dice_roll: 'events/dice_roll',
  critical_hit: 'events/critical_hit',
  critical_miss: 'events/critical_miss',
  level_up: 'events/level_up',
  achievement: 'events/achievement',
  treasure: 'events/treasure',
  spell_cast: 'events/spell_cast',
  heal: 'events/heal',
  sword_swing: 'events/sword_swing',
  bow_shot: 'events/bow_shot',
  door_open: 'events/door_open',
  chest_open: 'events/chest_open'
};

// Export the consolidated EVENT_SOUNDS object
export const EVENT_SOUNDS: Record<string, string> = {...EVENT_SOUNDS_BASE};

// Map environment keywords to sound files
export const ENVIRONMENT_SOUNDS: Record<string, string> = {
  // Locations
  town: 'environments/town_daytime',
  village: 'environments/town_daytime',
  city: 'environments/town_daytime',
  market: 'environments/town_market',
  tavern: 'environments/tavern',
  inn: 'environments/tavern',
  forest: 'environments/forest_ambient',
  woods: 'environments/forest_ambient',
  jungle: 'environments/jungle_ambient',
  mountains: 'environments/mountain_wind',
  dungeon: 'environments/dungeon_drips',
  cave: 'environments/cave_ambient',
  underground: 'environments/cave_ambient',
  castle: 'environments/castle_ambient',
  palace: 'environments/castle_ambient',
  desert: 'environments/desert_wind',
  beach: 'environments/ocean_waves',
  coast: 'environments/ocean_waves',
  ocean: 'environments/ocean_waves',
  sea: 'environments/ocean_waves',
  swamp: 'environments/swamp_ambient',
  marsh: 'environments/swamp_ambient',
  temple: 'environments/temple_ambient',
  church: 'environments/temple_ambient',
  shrine: 'environments/temple_ambient',
  battlefield: 'environments/battle_distant',
  ruins: 'environments/ruins_ambient',
  cemetery: 'environments/cemetery_ambient',
  graveyard: 'environments/cemetery_ambient'
};

// Map weather keywords to sound files
export const WEATHER_SOUNDS: Record<string, string> = {
  rain: 'weather/rain',
  rainy: 'weather/rain',
  downpour: 'weather/heavy_rain',
  storm: 'weather/thunder',
  thunder: 'weather/thunder',
  lightning: 'weather/thunder',
  wind: 'weather/wind',
  windy: 'weather/wind',
  gale: 'weather/strong_wind',
  snow: 'weather/snow_wind',
  snowy: 'weather/snow_wind',
  blizzard: 'weather/blizzard',
  foggy: 'weather/light_wind',
  fog: 'weather/light_wind',
  mist: 'weather/light_wind'
};

// Map time of day keywords to sound files
export const TIME_SOUNDS: Record<string, string> = {
  dawn: 'environments/morning_birds',
  sunrise: 'environments/morning_birds',
  morning: 'environments/morning_birds',
  day: 'environments/daytime_ambient',
  daytime: 'environments/daytime_ambient',
  noon: 'environments/daytime_ambient',
  afternoon: 'environments/daytime_ambient',
  dusk: 'environments/evening_crickets',
  sunset: 'environments/evening_crickets',
  evening: 'environments/evening_crickets',
  night: 'environments/night_ambient',
  nighttime: 'environments/night_ambient',
  midnight: 'environments/night_ambient'
};

// Map mood keywords to sound files
export const MOOD_SOUNDS: Record<string, string> = {
  peaceful: 'moods/peaceful',
  calm: 'moods/peaceful',
  serene: 'moods/peaceful',
  tranquil: 'moods/peaceful',
  relaxing: 'moods/peaceful',
  tense: 'moods/tense',
  suspenseful: 'moods/tense',
  anxious: 'moods/tense',
  combat: 'moods/combat',
  fight: 'moods/combat',
  battle: 'moods/combat',
  attack: 'moods/combat',
  mysterious: 'moods/mysterious',
  strange: 'moods/mysterious',
  eerie: 'moods/eerie',
  creepy: 'moods/eerie',
  spooky: 'moods/eerie',
  magical: 'moods/magical',
  enchanted: 'moods/magical',
  sad: 'moods/melancholy',
  melancholy: 'moods/melancholy',
  tragic: 'moods/melancholy',
  celebration: 'moods/celebration',
  festive: 'moods/celebration',
  party: 'moods/celebration',
  joyful: 'moods/celebration',
  horror: 'moods/horror',
  terrifying: 'moods/horror',
  dread: 'moods/horror'
};

// Additional event sounds, merged with the main EVENT_SOUNDS defined above
const ADDITIONAL_EVENT_SOUNDS = {
  door_close: 'events/door_close',
  lock_pick: 'events/lock_pick',
  sword_draw: 'events/sword_draw',
  arrow_hit: 'events/arrow_hit',
  magic_spell: 'events/magic_spell',
  drinking: 'events/drinking',
  eating: 'events/eating',
  footsteps: 'events/footsteps',
  gold_coins: 'events/gold_coins',
  monster_growl: 'events/monster_growl',
  monster_attack: 'events/monster_attack',
  dragon_roar: 'events/dragon_roar',
  character_damage: 'events/character_damage',
  character_death: 'events/character_death',
  item_pickup: 'events/item_pickup'
};

// Merge additional event sounds with the main EVENT_SOUNDS object
Object.entries(ADDITIONAL_EVENT_SOUNDS).forEach(([key, value]) => {
  EVENT_SOUNDS[key] = value;
});

/**
 * Detect the most prominent environment based on keyword frequency
 */
function detectEnvironment(text: string): { name: string, soundFile: string } {
  const lowerText = text.toLowerCase();
  let bestMatch = { name: 'generic', soundFile: 'environments/daytime_ambient' };
  let highestCount = 0;
  
  // Check for keywords
  for (const [env, sound] of Object.entries(ENVIRONMENT_SOUNDS)) {
    // Create a regex that ensures we match whole words, not parts of words
    const regex = new RegExp(`\\b${env}\\b`, 'gi');
    const matches = lowerText.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > highestCount) {
      highestCount = count;
      bestMatch = { name: env, soundFile: sound };
    }
  }
  
  return bestMatch;
}

/**
 * Detect weather conditions mentioned in the text
 */
function detectWeather(text: string): { name: string, soundFile: string } | null {
  const lowerText = text.toLowerCase();
  
  for (const [weather, sound] of Object.entries(WEATHER_SOUNDS)) {
    // Create a regex that ensures we match whole words, not parts of words
    const regex = new RegExp(`\\b${weather}\\b`, 'gi');
    if (regex.test(lowerText)) {
      return { name: weather, soundFile: sound };
    }
  }
  
  return null;
}

/**
 * Detect time of day mentioned in the text
 */
function detectTimeOfDay(text: string): { name: string, soundFile: string } | null {
  const lowerText = text.toLowerCase();
  
  for (const [time, sound] of Object.entries(TIME_SOUNDS)) {
    // Create a regex that ensures we match whole words, not parts of words
    const regex = new RegExp(`\\b${time}\\b`, 'gi');
    if (regex.test(lowerText)) {
      return { name: time, soundFile: sound };
    }
  }
  
  return null;
}

/**
 * Detect the mood of the scene
 */
function detectMood(text: string): { name: string, soundFile: string } {
  const lowerText = text.toLowerCase();
  let bestMatch = { name: 'neutral', soundFile: 'moods/peaceful' };
  let highestCount = 0;
  
  // Check for keywords
  for (const [mood, sound] of Object.entries(MOOD_SOUNDS)) {
    // Create a regex that ensures we match whole words, not parts of words
    const regex = new RegExp(`\\b${mood}\\b`, 'gi');
    const matches = lowerText.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > highestCount) {
      highestCount = count;
      bestMatch = { name: mood, soundFile: sound };
    }
  }
  
  // Additional pattern checks for combat
  if (/\\b(fight|battle|attack|combat|sword|dagger|axe|spear|weapon|enemy|foe|opponent)\\b/i.test(lowerText)) {
    bestMatch = { name: 'combat', soundFile: 'moods/combat' };
  }
  
  return bestMatch;
}

/**
 * Main function to analyze narrative and determine appropriate sound context
 */
export function analyzeNarrativeForSoundContext(narrativeText: string): AmbientSoundContext {
  if (!narrativeText) {
    return {
      primary: 'environments/town_daytime', // Default primary sound
      environment: 'town',
      mood: 'peaceful'
    };
  }
  
  // Detect environment
  const environment = detectEnvironment(narrativeText);
  
  // Detect weather
  const weather = detectWeather(narrativeText);
  
  // Detect time of day
  const timeOfDay = detectTimeOfDay(narrativeText);
  
  // Detect mood
  const mood = detectMood(narrativeText);
  
  // Choose secondary sound (prefer weather over time of day)
  const secondary = weather ? weather.soundFile : (timeOfDay ? timeOfDay.soundFile : undefined);
  
  return {
    primary: environment.soundFile,
    secondary,
    environment: environment.name,
    mood: mood.name
  };
}