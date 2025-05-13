/**
 * Ambient Sound Context Analyzer
 * 
 * This utility analyzes narrative text to determine appropriate ambient sounds
 * based on environment, situation, and mood.
 */

export interface AmbientSoundContext {
  primary: string;
  secondary?: string;
  intensity: 'low' | 'medium' | 'high';
  mood: 'peaceful' | 'tense' | 'mysterious' | 'combat' | 'celebratory' | 'somber';
  environment: 'town' | 'tavern' | 'forest' | 'dungeon' | 'castle' | 'wilderness' | 'mountain' | 'beach' | 'cave' | 'ship' | 'temple' | 'other';
  time: 'day' | 'night' | 'dawn' | 'dusk' | 'unknown';
  weather?: 'rain' | 'thunder' | 'wind' | 'snow' | 'clear' | 'fog';
  events?: string[];
}

/**
 * Mapping of settings to ambient sound types
 */
export const ENVIRONMENT_SOUNDS: Record<string, string[]> = {
  town: ['town_daytime', 'town_night', 'marketplace', 'street_vendors', 'town_bustle'],
  tavern: ['tavern_chatter', 'tavern_music', 'tavern_glasses_clinking', 'tavern_laughter'],
  forest: ['forest_daytime', 'forest_night', 'birds_chirping', 'leaves_rustling', 'forest_wind'],
  dungeon: ['dungeon_drips', 'dungeon_echoes', 'dungeon_ambient', 'dungeon_creaks', 'chains_rattling'],
  castle: ['castle_halls', 'castle_ambient', 'grand_hall', 'throne_room', 'castle_servants'],
  wilderness: ['wilderness_ambient', 'prairie_wind', 'grasslands', 'crickets_night', 'wide_open_spaces'],
  mountain: ['mountain_wind', 'mountain_echoes', 'rocky_terrain', 'mountain_birds', 'high_altitude_wind'],
  beach: ['ocean_waves', 'seabirds', 'coastal_wind', 'beach_ambient', 'distant_surf'],
  cave: ['cave_drips', 'cave_echoes', 'underground_rumble', 'cave_wind', 'subterranean_ambient'],
  ship: ['ship_creaking', 'ocean_waves', 'sail_flapping', 'ship_bells', 'below_deck'],
  temple: ['temple_chants', 'temple_bells', 'quiet_reverence', 'temple_ambient', 'sacred_singing'],
  other: ['ambient_neutral', 'general_ambience', 'background_noise']
};

/**
 * Weather sounds for different conditions
 */
export const WEATHER_SOUNDS: Record<string, string[]> = {
  rain: ['light_rain', 'heavy_rain', 'rain_on_roof', 'rain_on_leaves', 'rain_on_windows'],
  thunder: ['distant_thunder', 'thunderstorm', 'rolling_thunder', 'stormy_weather', 'thunder_and_rain'],
  wind: ['gentle_breeze', 'howling_wind', 'wind_through_trees', 'wind_whistling', 'gusting_wind'],
  snow: ['snow_footsteps', 'winter_ambient', 'snowfall', 'frozen_lake', 'icy_wind'],
  clear: [], // No specific sounds for clear weather
  fog: ['foggy_atmosphere', 'fog_horn', 'misty_ambience', 'foggy_woods']
};

/**
 * Mood sounds for different emotions
 */
export const MOOD_SOUNDS: Record<string, string[]> = {
  peaceful: ['peaceful_ambient', 'gentle_music', 'relaxing_birds', 'quiet_nature', 'soothing_tones'],
  tense: ['tense_strings', 'ominous_tones', 'suspenseful_ambient', 'heartbeat', 'eerie_whispers'],
  mysterious: ['mysterious_tones', 'enigmatic_ambient', 'strange_sounds', 'curious_notes', 'otherworldly'],
  combat: ['battle_drums', 'combat_music', 'sword_clashes', 'intense_action', 'battle_cries'],
  celebratory: ['celebratory_music', 'cheering', 'fanfare', 'festive_ambient', 'laughter_and_joy'],
  somber: ['somber_tones', 'melancholy_music', 'sad_strings', 'sorrowful_ambient', 'mournful_sounds']
};

/**
 * Time of day sounds
 */
export const TIME_SOUNDS: Record<string, string[]> = {
  day: ['daytime_ambient', 'busy_day', 'midday_atmosphere', 'day_birds'],
  night: ['night_crickets', 'night_owls', 'quiet_night', 'nocturnal_ambient'],
  dawn: ['dawn_chorus', 'early_morning', 'daybreak_ambient', 'dawn_atmosphere'],
  dusk: ['dusk_ambient', 'sunset_atmosphere', 'evening_sounds', 'twilight_tone']
};

/**
 * Event-specific sounds
 */
export const EVENT_SOUNDS: Record<string, string> = {
  "door_open": "door_creaking_open",
  "door_close": "door_slamming_shut",
  "lock_picking": "lock_picking_sounds",
  "trap_triggered": "trap_triggering",
  "chest_open": "chest_opening",
  "discovery": "discovery_jingle",
  "magic_spell": "magic_spell_casting",
  "healing": "healing_magic_sounds",
  "gold_coins": "coins_jingling",
  "dragon_roar": "dragon_roaring",
  "horse_gallop": "horse_galloping",
  "wolf_howl": "wolf_howling",
  "campfire": "campfire_crackling",
  "footsteps_stone": "footsteps_on_stone",
  "footsteps_wood": "footsteps_on_wood",
  "footsteps_leaves": "footsteps_on_leaves",
  "armor_moving": "armor_movement_clanking",
  "drinking": "drinking_potion",
  "eating": "eating_food",
  "sword_draw": "sword_unsheathing",
  "bow_shot": "bow_firing_arrow",
  "monster_growl": "monster_growling",
  "undead_moan": "zombie_moaning",
  "ghost_wail": "ghost_wailing",
  "water_splash": "water_splashing",
  "falling_rocks": "rocks_falling",
  "paper_rustling": "paper_scroll_rustling"
};

/**
 * Analyzes narrative text and returns appropriate ambient sound context
 * @param narrativeText The narrative text to analyze
 * @returns An object with sound context information
 */
export function analyzeNarrativeForSoundContext(narrativeText: string): AmbientSoundContext {
  const lowerText = narrativeText.toLowerCase();
  
  // Default values
  const context: AmbientSoundContext = {
    primary: 'ambient_neutral',
    intensity: 'low',
    mood: 'peaceful',
    environment: 'other',
    time: 'unknown'
  };
  
  // Detect environment
  for (const [env, keywords] of Object.entries(environmentKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      context.environment = env as any;
      break;
    }
  }
  
  // Detect weather
  for (const [weather, keywords] of Object.entries(weatherKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      context.weather = weather as any;
      break;
    }
  }
  
  // Detect mood
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      context.mood = mood as any;
      break;
    }
  }
  
  // Detect time of day
  for (const [time, keywords] of Object.entries(timeKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      context.time = time as any;
      break;
    }
  }
  
  // Detect events
  const events: string[] = [];
  for (const [event, keywords] of Object.entries(eventKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      events.push(event);
    }
  }
  
  if (events.length > 0) {
    context.events = events;
  }
  
  // Determine intensity
  if (context.mood === 'combat' || context.weather === 'thunder') {
    context.intensity = 'high';
  } else if (context.mood === 'tense' || context.mood === 'mysterious') {
    context.intensity = 'medium';
  }
  
  // Determine primary sound based on context
  context.primary = selectPrimarySound(context);
  context.secondary = selectSecondarySound(context);
  
  return context;
}

/**
 * Selects the primary sound based on the context
 */
function selectPrimarySound(context: AmbientSoundContext): string {
  // Combat takes precedence
  if (context.mood === 'combat') {
    return MOOD_SOUNDS.combat[Math.floor(Math.random() * MOOD_SOUNDS.combat.length)];
  }
  
  // Weather is next in priority for severe conditions
  if (context.weather === 'thunder' || context.weather === 'rain') {
    const weatherSounds = WEATHER_SOUNDS[context.weather];
    return weatherSounds[Math.floor(Math.random() * weatherSounds.length)];
  }
  
  // Environment is usually the primary background sound
  const envSounds = ENVIRONMENT_SOUNDS[context.environment];
  return envSounds[Math.floor(Math.random() * envSounds.length)];
}

/**
 * Selects a secondary sound based on the context
 */
function selectSecondarySound(context: AmbientSoundContext): string | undefined {
  // If we have specific events, prioritize one
  if (context.events && context.events.length > 0) {
    const event = context.events[Math.floor(Math.random() * context.events.length)];
    return EVENT_SOUNDS[event];
  }
  
  // Add mood sounds as secondary if primary is environment or weather
  if (context.mood !== 'peaceful') {
    const moodSounds = MOOD_SOUNDS[context.mood];
    return moodSounds[Math.floor(Math.random() * moodSounds.length)];
  }
  
  // Add time of day sounds if available
  if (context.time !== 'unknown') {
    const timeSounds = TIME_SOUNDS[context.time];
    return timeSounds[Math.floor(Math.random() * timeSounds.length)];
  }
  
  return undefined;
}

// Keyword lists for detection

const environmentKeywords: Record<string, string[]> = {
  town: ['town', 'village', 'settlement', 'buildings', 'streets', 'market', 'square', 'shops', 'urban'],
  tavern: ['tavern', 'inn', 'bar', 'pub', 'alehouse', 'drinking', 'barkeep', 'bartender', 'mead'],
  forest: ['forest', 'woods', 'trees', 'woodland', 'grove', 'underbrush', 'canopy', 'thicket'],
  dungeon: ['dungeon', 'cell', 'prison', 'underground', 'labyrinth', 'corridor', 'passageway', 'chamber'],
  castle: ['castle', 'fortress', 'keep', 'citadel', 'palace', 'throne', 'battlements', 'stronghold'],
  wilderness: ['wilderness', 'wild', 'untamed', 'plains', 'grassland', 'savanna', 'prairie'],
  mountain: ['mountain', 'peak', 'highland', 'cliff', 'ridge', 'summit', 'crag', 'rocky'],
  beach: ['beach', 'shore', 'coast', 'sand', 'ocean', 'sea', 'waves', 'shoreline', 'seafront'],
  cave: ['cave', 'cavern', 'grotto', 'tunnel', 'subterranean', 'stalactite', 'stalagmite'],
  ship: ['ship', 'boat', 'deck', 'vessel', 'sail', 'mast', 'hold', 'cabin', 'galley', 'hull'],
  temple: ['temple', 'church', 'cathedral', 'shrine', 'sanctuary', 'altar', 'prayer', 'worship', 'holy']
};

const weatherKeywords: Record<string, string[]> = {
  rain: ['rain', 'rainy', 'downpour', 'drizzle', 'shower', 'precipitation', 'raindrops'],
  thunder: ['thunder', 'lightning', 'storm', 'thunderstorm', 'tempest', 'thunderclap', 'thunderous'],
  wind: ['wind', 'windy', 'breeze', 'gust', 'blustery', 'blowing', 'gusting', 'whistling'],
  snow: ['snow', 'snowfall', 'snowy', 'blizzard', 'snowstorm', 'frost', 'snowflake', 'freezing'],
  fog: ['fog', 'foggy', 'mist', 'misty', 'haze', 'murky', 'obscured', 'shrouded']
};

const moodKeywords: Record<string, string[]> = {
  peaceful: ['peaceful', 'calm', 'quiet', 'serene', 'tranquil', 'undisturbed', 'still', 'relaxing'],
  tense: ['tense', 'uneasy', 'anxious', 'nervous', 'suspicious', 'wary', 'afraid', 'fearful'],
  mysterious: ['mysterious', 'strange', 'odd', 'curious', 'enigmatic', 'puzzling', 'perplexing', 'unusual'],
  combat: ['combat', 'battle', 'fight', 'attack', 'fighting', 'clash', 'skirmish', 'conflict', 'struggle'],
  celebratory: ['celebratory', 'celebration', 'festive', 'joyous', 'triumphant', 'victorious', 'merry'],
  somber: ['somber', 'sad', 'gloomy', 'melancholy', 'mournful', 'sorrowful', 'depressing', 'funeral']
};

const timeKeywords: Record<string, string[]> = {
  day: ['day', 'daylight', 'daytime', 'noon', 'midday', 'afternoon', 'sunlight', 'sunny'],
  night: ['night', 'nighttime', 'midnight', 'darkness', 'dark', 'stars', 'moonlight', 'late'],
  dawn: ['dawn', 'sunrise', 'early morning', 'daybreak', 'first light', 'breaking day'],
  dusk: ['dusk', 'sunset', 'twilight', 'evening', 'sundown', 'nightfall', 'growing dark']
};

const eventKeywords: Record<string, string[]> = {
  "door_open": ['door opens', 'opened the door', 'door creaks open', 'swings open'],
  "door_close": ['door closes', 'closed the door', 'door slams', 'door shuts'],
  "lock_picking": ['pick the lock', 'picking the lock', 'lock picking', 'unlock', 'lockpick'],
  "trap_triggered": ['trap springs', 'trap activates', 'triggered a trap', 'trap goes off'],
  "chest_open": ['open the chest', 'chest opens', 'lift the lid', 'chest creaks open'],
  "discovery": ['discovered', 'find', 'found', 'uncover', 'revealed', 'locate'],
  "magic_spell": ['cast a spell', 'casts spell', 'magic missile', 'magical energy', 'spell'],
  "healing": ['healing', 'heal', 'cured', 'recovery', 'restored health', 'regains health'],
  "gold_coins": ['gold coins', 'jingling coins', 'handful of coins', 'pouch of gold'],
  "dragon_roar": ['dragon roars', 'roaring dragon', 'dragon bellows', 'draconic cry'],
  "horse_gallop": ['horse gallops', 'galloping', 'riding fast', 'horse hooves'],
  "wolf_howl": ['wolf howls', 'howling', 'wolf cry', 'mournful howl'],
  "campfire": ['campfire', 'fire crackles', 'lit a fire', 'around the fire', 'burning logs'],
  "footsteps_stone": ['footsteps echo', 'stone floor', 'walking on stone', 'steps on the stone'],
  "footsteps_wood": ['wooden floor', 'creaking boards', 'wooden planks', 'steps on wood'],
  "footsteps_leaves": ['rustling leaves', 'crunching leaves', 'steps on leaves', 'forest floor'],
  "armor_moving": ['armor clanks', 'metal armor', 'clanking', 'armor shifting'],
  "drinking": ['drinks a potion', 'gulps down', 'drinking', 'quaffs', 'sips from'],
  "eating": ['eating', 'chewing', 'consume', 'feast', 'bites into', 'meal'],
  "sword_draw": ['draws sword', 'unsheathes', 'pulls out sword', 'blade from scabbard'],
  "bow_shot": ['fires an arrow', 'bow twangs', 'arrow flies', 'archery', 'shoots'],
  "monster_growl": ['monster growls', 'growling', 'snarling', 'beast rumbles'],
  "undead_moan": ['zombie moans', 'undead groan', 'ghoulish sounds', 'moaning'],
  "ghost_wail": ['ghostly wail', 'spirit cries', 'haunting sound', 'spectral noise'],
  "water_splash": ['splash', 'splashing water', 'water droplets', 'dripping water'],
  "falling_rocks": ['rocks fall', 'cave-in', 'rockslide', 'stone crumbles', 'falling debris'],
  "paper_rustling": ['scroll unfurls', 'parchment rustles', 'turning pages', 'paper crinkles']
};