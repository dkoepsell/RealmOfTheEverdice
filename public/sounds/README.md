# Ambient Sound Files for Everdice

This directory contains ambient sound files for the Realm of the Everdice application.

## Sound File Organization

The audio files should be organized in the following structure:

```
/sounds/
  ├── environments/          # Background ambient sounds based on location
  │   ├── town_daytime.mp3
  │   ├── town_night.mp3
  │   ├── forest_ambient.mp3
  │   ├── dungeon_drips.mp3
  │   └── ...
  │
  ├── weather/               # Weather-related ambient sounds
  │   ├── rain.mp3
  │   ├── thunder.mp3
  │   ├── wind.mp3
  │   └── ...
  │
  ├── moods/                 # Background music for different moods
  │   ├── peaceful.mp3
  │   ├── mysterious.mp3
  │   ├── combat.mp3
  │   └── ...
  │
  └── events/                # One-shot sound effects for specific events
      ├── door_open.mp3
      ├── sword_draw.mp3
      ├── magic_spell.mp3
      └── ...
```

## File Naming Convention

Sound files should be named using the following guidelines:

1. Use lowercase letters and underscores for spaces
2. Make names descriptive and specific
3. For variants of a sound, append a number (e.g., `forest_ambient_1.mp3`, `forest_ambient_2.mp3`)

## Sound Licensing and Attribution

All sound files used in this project must be either:

1. Created specifically for the project
2. Licensed as royalty-free for commercial use
3. Under Creative Commons Attribution license with proper attribution
4. In the public domain

## Adding New Sounds

When adding new sounds to the project:

1. Make sure they are in MP3 format for wider compatibility
2. Normalize the volume to avoid jarring volume differences
3. Keep file sizes reasonable (aim for under 2MB per file)
4. Update the ambient sound context analyzer to use the new sounds

## Sound Context Analyzer

The application analyzes narrative text and associates it with appropriate sounds using the algorithm in `client/src/lib/ambient-sound-context.ts`.

When modifying that file, make sure to update the following data structures:

- `ENVIRONMENT_SOUNDS`
- `WEATHER_SOUNDS`
- `MOOD_SOUNDS`
- `TIME_SOUNDS`
- `EVENT_SOUNDS`

And make sure any keywords added to the file match the sound file names (without the extension).