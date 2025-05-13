# Ambient Sound System

This directory contains audio files for the ambient sound system in Realm of the Everdice.

## Directory Structure

- `/environments/` - Environmental ambient sounds (forests, towns, dungeons, etc.)
- `/weather/` - Weather-related sounds (rain, thunder, wind, etc.)
- `/moods/` - Mood-related sounds (tension, peace, mystery, etc.)
- `/events/` - Event-related sound effects (combat, magic, achievements, etc.)

## File Format

All sound files should be in MP3 format for best browser compatibility and file size.

## Sound Categories

### Environments
- `forest_ambient.mp3` - Gentle forest sounds with birds and rustling leaves
- `town_ambient.mp3` - Town ambience with distant chatter and activity
- `dungeon_ambient.mp3` - Echoing drips and distant creaks
- `cave_ambient.mp3` - Subterranean rumbles and echoes
- `tavern_ambient.mp3` - Tavern ambience with chatter and clinking mugs
- `castle_ambient.mp3` - Grand hall ambience with distant echoes
- `mountain_ambient.mp3` - High wind whistling through peaks
- `beach_ambient.mp3` - Gentle waves on shore
- `cemetery_ambient.mp3` - Silent atmosphere with occasional wind

### Weather
- `rain.mp3` - Light to moderate rainfall
- `heavy_rain.mp3` - Heavy downpour
- `thunder.mp3` - Distant thunder rumbles
- `light_wind.mp3` - Light breeze through trees or buildings
- `strong_wind.mp3` - Howling wind

### Time of Day
- `morning_birds.mp3` - Dawn chorus of birds
- `daytime_ambient.mp3` - General daytime ambient sounds
- `evening_ambient.mp3` - Evening sounds with crickets
- `night_ambient.mp3` - Night sounds with occasional owl hoots

### Moods
- `peaceful.mp3` - Gentle, calming background for peaceful scenes
- `mysterious.mp3` - Subtle, eerie tones for mysteries
- `tension.mp3` - Rising tension for dangerous moments
- `battle.mp3` - Intense battle music
- `victory.mp3` - Triumphant sounds for victories
- `sad.mp3` - Melancholy tones for sad moments

### Events
- `dice_roll.mp3` - Sound of dice rolling
- `critical_hit.mp3` - Sound for critical hit in combat
- `critical_miss.mp3` - Sound for critical miss in combat
- `level_up.mp3` - Sound for character level up
- `achievement.mp3` - Sound for unlocking achievements
- `treasure.mp3` - Sound for finding treasure
- `spell_cast.mp3` - Generic magic spell casting sound
- `heal.mp3` - Healing spell sound
- `sword_swing.mp3` - Sword attack sound
- `bow_shot.mp3` - Bow and arrow sound
- `door_open.mp3` - Door opening sound
- `chest_open.mp3` - Treasure chest opening

## Usage

The ambient sound system automatically selects appropriate sounds based on narrative context. The system analyzes the current game narration to determine:

1. The primary environment (forest, town, dungeon, etc.)
2. Weather conditions (if any)
3. Time of day (if mentioned)
4. The overall mood of the scene

Sounds are layered appropriately, with environmental sounds as the base layer and weather/mood sounds mixed in at lower volumes.

## Adding New Sounds

When adding new sounds:
1. Convert to MP3 format
2. Place in the appropriate directory
3. Update the sound mappings in `client/src/lib/ambient-sound-context.ts` to include the new sound
4. Keep files under 1MB when possible for faster loading

## Credits

Sound files should be royalty-free and properly licensed for commercial use.