import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioService } from '@/lib/audio-service';
import { 
  analyzeNarrativeForSoundContext, 
  AmbientSoundContext,
  ENVIRONMENT_SOUNDS,
  MOOD_SOUNDS,
  WEATHER_SOUNDS, 
  EVENT_SOUNDS 
} from '@/lib/ambient-sound-context';

interface AmbientSoundOptions {
  autoplay?: boolean;
  volume?: number;
  fadeTime?: number;
  enabled?: boolean;
}

/**
 * Hook to manage ambient sounds based on narrative context
 */
export function useAmbientSound(
  narrative: string,
  options: AmbientSoundOptions = {}
) {
  // Default options
  const { 
    autoplay = true, 
    volume = 0.5, 
    fadeTime = 2,
    enabled = true
  } = options;
  
  // Audio service instance
  const audioService = useRef(AudioService.getInstance());
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundVolume, setVolume] = useState(volume);
  const [currentPrimary, setCurrentPrimary] = useState<string | null>(null);
  const [currentSecondary, setCurrentSecondary] = useState<string | null>(null);
  const [currentContext, setCurrentContext] = useState<AmbientSoundContext | null>(null);
  
  // Track previous narrative for changes
  const prevNarrativeRef = useRef(narrative);
  
  // Initialize audio service
  useEffect(() => {
    const service = audioService.current;
    
    // Set initial volume
    service.setMasterVolume(soundVolume);
    
    // Set fade time
    service.setFadeTime(fadeTime);
    
    // Preload common sounds
    const preloadPromises = [];
    
    // Attempt to preload environment sounds
    for (const [key, path] of Object.entries(ENVIRONMENT_SOUNDS)) {
      preloadPromises.push(
        service.loadTrack(`env_${key}`, path, { 
          loop: true,
          volume: soundVolume,
          category: 'ambient'
        }).catch(err => console.warn(`Failed to preload environment sound ${key}:`, err))
      );
    }
    
    // Attempt to preload common event sounds
    for (const [key, path] of Object.entries(EVENT_SOUNDS)) {
      preloadPromises.push(
        service.loadTrack(`event_${key}`, path, { 
          loop: false,
          volume: soundVolume,
          category: 'effect'
        }).catch(err => console.warn(`Failed to preload event sound ${key}:`, err))
      );
    }
    
    // Return cleanup function
    return () => {
      service.stopAll(true);
    };
  }, [fadeTime]);
  
  // Analyze narrative for sound context when it changes
  useEffect(() => {
    if (!narrative || narrative === prevNarrativeRef.current || !enabled) {
      return;
    }
    
    const context = analyzeNarrativeForSoundContext(narrative);
    setCurrentContext(context);
    
    // Update the current primary/secondary sound IDs if they've changed
    if (context.primary !== currentPrimary) {
      setCurrentPrimary(context.primary || null);
    }
    
    if (context.secondary !== currentSecondary) {
      setCurrentSecondary(context.secondary || null);
    }
    
    prevNarrativeRef.current = narrative;
  }, [currentPrimary, currentSecondary]);
  
  // Automatically play ambient sounds when context changes
  useEffect(() => {
    if (!enabled || !currentContext) return;
    
    const service = audioService.current;
    
    if (autoplay && !service.isAnyAmbientPlaying() && !isMuted) {
      playAmbientSounds();
    }
  }, [currentContext, autoplay, isMuted, enabled]);
  
  // Update volume when it changes
  useEffect(() => {
    audioService.current.setMasterVolume(soundVolume);
  }, [soundVolume]);
  
  // Update mute state when it changes
  useEffect(() => {
    audioService.current.setMute(isMuted);
  }, [isMuted]);
  
  /**
   * Analyze narrative and update sound context
   */
  const analyzeSounds = useCallback((text: string) => {
    if (!text || !enabled) return;
    
    const context = analyzeNarrativeForSoundContext(text);
    setCurrentContext(context);
    
    if (context.primary !== currentPrimary) {
      setCurrentPrimary(context.primary || null);
    }
    
    if (context.secondary !== currentSecondary) {
      setCurrentSecondary(context.secondary || null);
    }
  }, [currentPrimary, currentSecondary, enabled]);
  
  /**
   * Play ambient sounds based on current context
   */
  const playAmbientSounds = useCallback(() => {
    if (!currentContext || !enabled) return;
    
    const service = audioService.current;
    
    // Stop any currently playing ambient sounds
    service.stopAllAmbient(true);
    
    // Prepare track IDs
    const primaryId = `env_${currentContext.environment}`;
    let secondaryId = null;
    
    if (currentContext.secondary) {
      // Extract the base name from the path (e.g., 'weather/rain' -> 'rain')
      const secondaryPath = currentContext.secondary;
      const secondaryType = secondaryPath.split('/')[0]; // 'weather', 'moods', etc.
      const secondaryBase = secondaryPath.split('/')[1]; // 'rain', 'peaceful', etc.
      
      if (secondaryType && secondaryBase) {
        secondaryId = `${secondaryType}_${secondaryBase}`;
      }
    }
    
    // Try to load and play primary sound
    service.loadTrack(primaryId, currentContext.primary, {
      loop: true,
      volume: soundVolume * 0.7, // Primary sound at 70% of master volume
      category: 'ambient'
    }).then(() => {
      service.play(primaryId, true);
      setIsPlaying(true);
    }).catch(err => {
      console.error(`Failed to load primary sound ${primaryId}:`, err);
    });
    
    // Try to load and play secondary sound if available
    if (secondaryId && currentContext.secondary) {
      service.loadTrack(secondaryId, currentContext.secondary, {
        loop: true,
        volume: soundVolume * 0.4, // Secondary sound at 40% of master volume
        category: 'ambient'
      }).then(() => {
        service.play(secondaryId!, true);
      }).catch(err => {
        console.error(`Failed to load secondary sound ${secondaryId}:`, err);
      });
    }
  }, [currentContext, soundVolume, enabled]);
  
  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newState = !prev;
      audioService.current.setMute(newState);
      return newState;
    });
  }, []);
  
  /**
   * Set volume level
   */
  const setVolumeLevel = useCallback((level: number) => {
    // Clamp between 0 and 1
    const clamped = Math.max(0, Math.min(1, level));
    setVolume(clamped);
    audioService.current.setMasterVolume(clamped);
  }, []);
  
  /**
   * Stop all ambient sounds
   */
  const stopAll = useCallback(() => {
    audioService.current.stopAll(true);
    setIsPlaying(false);
  }, []);
  
  /**
   * Play a single event sound
   */
  const playEventSound = useCallback((eventName: string) => {
    if (!enabled) return;
    
    const service = audioService.current;
    const trackId = `event_${eventName}`;
    
    if (EVENT_SOUNDS[eventName]) {
      service.loadTrack(trackId, EVENT_SOUNDS[eventName], {
        loop: false,
        volume: soundVolume * 0.8, // Event sounds at 80% of master volume
        category: 'effect'
      }).then(() => {
        service.play(trackId);
      }).catch(err => {
        console.error(`Failed to load event sound ${eventName}:`, err);
      });
    }
  }, [soundVolume, enabled]);
  
  return {
    isPlaying,
    isMuted,
    soundVolume,
    currentContext,
    analyzeSounds,
    playAmbientSounds,
    toggleMute,
    setVolume: setVolumeLevel,
    stopAll,
    playEventSound
  };
}