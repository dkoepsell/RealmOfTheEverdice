import { useState, useEffect, useCallback, useRef } from 'react';
import { ambientAudioService } from '@/lib/audio-service';
import { 
  analyzeNarrativeForSoundContext,
  AmbientSoundContext,
  EVENT_SOUNDS,
  ENVIRONMENT_SOUNDS,
  MOOD_SOUNDS,
  WEATHER_SOUNDS
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
  narrativeText: string = '',
  options: AmbientSoundOptions = {}
) {
  const { 
    autoplay = true, 
    volume = 0.5, 
    fadeTime = 2,
    enabled = true
  } = options;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundVolume, setSoundVolume] = useState(volume);
  const [currentContext, setCurrentContext] = useState<AmbientSoundContext | null>(null);
  const [currentPrimary, setCurrentPrimary] = useState<string | null>(null);
  const [currentSecondary, setCurrentSecondary] = useState<string | null>(null);
  
  // Refs to keep track of sound IDs
  const primarySoundRef = useRef<string | null>(null);
  const secondarySoundRef = useRef<string | null>(null);
  const oneShots = useRef<Set<string>>(new Set());
  
  // Keep track of previous narrative to avoid reprocessing same text
  const prevNarrativeRef = useRef<string>('');
  
  /**
   * Analyze narrative and update sound context
   */
  const analyzeAndUpdateContext = useCallback((narrative: string) => {
    if (!narrative || narrative === prevNarrativeRef.current) return;
    
    const context = analyzeNarrativeForSoundContext(narrative);
    setCurrentContext(context);
    
    // Update the current primary/secondary sound IDs if they've changed
    if (context.primary !== currentPrimary) {
      setCurrentPrimary(context.primary);
    }
    
    if (context.secondary !== currentSecondary) {
      setCurrentSecondary(context.secondary);
    }
    
    prevNarrativeRef.current = narrative;
  }, [currentPrimary, currentSecondary]);
  
  /**
   * Play ambient sounds based on current context
   */
  const playAmbientSounds = useCallback(() => {
    if (!currentContext || !enabled) return;
    
    // Sound file URLs (using the sound ID as the file name)
    const primarySoundUrl = `${currentPrimary}.mp3`;
    const secondarySoundUrl = currentSecondary ? `${currentSecondary}.mp3` : null;
    
    // Play primary sound
    if (currentPrimary) {
      const primaryId = `primary-${currentPrimary}`;
      
      if (primarySoundRef.current && primarySoundRef.current !== primaryId) {
        // If we're changing the primary sound, crossfade
        ambientAudioService.crossFade(
          primarySoundRef.current,
          primarySoundUrl,
          primaryId,
          fadeTime
        );
      } else if (!primarySoundRef.current) {
        // If there's no primary sound yet, start playing
        ambientAudioService.playSound(primaryId, primarySoundUrl, {
          loop: true,
          volume: soundVolume,
          fadeIn: fadeTime
        });
      }
      
      primarySoundRef.current = primaryId;
    }
    
    // Play secondary sound
    if (secondarySoundUrl) {
      const secondaryId = `secondary-${currentSecondary}`;
      
      if (secondarySoundRef.current && secondarySoundRef.current !== secondaryId) {
        // Stop the current secondary sound
        ambientAudioService.stopSound(secondarySoundRef.current, {
          duration: fadeTime
        });
        secondarySoundRef.current = null;
      }
      
      if (!secondarySoundRef.current) {
        // Play the new secondary sound
        ambientAudioService.playSound(secondaryId, secondarySoundUrl, {
          loop: true,
          volume: soundVolume * 0.7, // Secondary sounds are quieter
          fadeIn: fadeTime
        });
        
        secondarySoundRef.current = secondaryId;
      }
    }
    
    // Play one-shot event sounds
    if (currentContext.events && currentContext.events.length > 0) {
      currentContext.events.forEach(event => {
        if (EVENT_SOUNDS[event] && !oneShots.current.has(event)) {
          // Play the event sound
          const soundUrl = `${EVENT_SOUNDS[event]}.mp3`;
          const eventId = `event-${event}-${Date.now()}`;
          
          ambientAudioService.playSound(eventId, soundUrl, {
            loop: false,
            volume: soundVolume * 0.9
          });
          
          // Add to the set of played one-shots (to avoid repetition)
          oneShots.current.add(event);
          
          // Remove from set after a short delay to allow replaying later
          setTimeout(() => {
            oneShots.current.delete(event);
          }, 8000); // Don't repeat the same sound for 8 seconds
        }
      });
    }
    
    setIsPlaying(true);
  }, [currentContext, currentPrimary, currentSecondary, enabled, fadeTime, soundVolume]);
  
  // Analyze narrative text when it changes
  useEffect(() => {
    if (narrativeText && enabled) {
      analyzeAndUpdateContext(narrativeText);
    }
  }, [narrativeText, analyzeAndUpdateContext, enabled]);
  
  // Play sounds when context changes and autoplay is enabled
  useEffect(() => {
    if (autoplay && currentContext && enabled) {
      playAmbientSounds();
    }
  }, [currentContext, autoplay, playAmbientSounds, enabled]);
  
  // Update volume when it changes
  useEffect(() => {
    ambientAudioService.setVolume(soundVolume);
    setSoundVolume(soundVolume);
  }, [soundVolume]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (primarySoundRef.current) {
        ambientAudioService.stopSound(primarySoundRef.current, { duration: 1 });
      }
      
      if (secondarySoundRef.current) {
        ambientAudioService.stopSound(secondarySoundRef.current, { duration: 1 });
      }
    };
  }, []);
  
  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    ambientAudioService.setMuted(newMuted);
    setIsMuted(newMuted);
    return newMuted;
  }, [isMuted]);
  
  /**
   * Set volume level
   */
  const setVolume = useCallback((vol: number) => {
    const normalizedVol = Math.max(0, Math.min(1, vol));
    ambientAudioService.setVolume(normalizedVol);
    setSoundVolume(normalizedVol);
  }, []);
  
  /**
   * Stop all ambient sounds
   */
  const stopAll = useCallback((fadeOutTime: number = 1) => {
    ambientAudioService.stopAll(fadeOutTime);
    primarySoundRef.current = null;
    secondarySoundRef.current = null;
    setIsPlaying(false);
  }, []);
  
  /**
   * Play a single event sound
   */
  const playEventSound = useCallback((eventName: string) => {
    if (!enabled) return;
    
    if (EVENT_SOUNDS[eventName]) {
      const soundUrl = `${EVENT_SOUNDS[eventName]}.mp3`;
      const eventId = `event-${eventName}-${Date.now()}`;
      
      ambientAudioService.playSound(eventId, soundUrl, {
        loop: false,
        volume: soundVolume * 0.9
      });
    }
  }, [enabled, soundVolume]);
  
  // Return state and methods
  return {
    isPlaying,
    isMuted,
    soundVolume,
    currentContext,
    toggleMute,
    setVolume,
    stopAll,
    playAmbientSounds,
    playEventSound
  };
}