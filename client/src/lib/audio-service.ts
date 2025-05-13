/**
 * AudioService
 * 
 * A service for managing audio playback in the application.
 * This includes loading and playing ambient sounds and sound effects.
 */

export interface AudioTrack {
  element: HTMLAudioElement;
  playing: boolean;
  loaded: boolean;
  volume: number;
  category: 'ambient' | 'effect';
  fadeInterval?: number;
}

export class AudioService {
  private static instance: AudioService;
  private tracks: Map<string, AudioTrack> = new Map();
  private basePath: string;
  private masterVolume: number = 1.0;
  private muted: boolean = false;
  private fadeTime: number = 2; // Default fade time in seconds
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.basePath = '/sounds/';
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
  
  /**
   * Load an audio track
   * @param id Unique identifier for the track
   * @param path Path to the audio file (relative to base path)
   * @param options Additional options for the track
   * @returns Promise that resolves when the track is loaded
   */
  public loadTrack(
    id: string, 
    path: string, 
    options: { 
      volume?: number; 
      loop?: boolean; 
      category?: 'ambient' | 'effect'; 
      autoplay?: boolean;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if track is already loaded
      if (this.tracks.has(id)) {
        resolve();
        return;
      }
      
      // Create audio element
      const audio = new Audio();
      audio.src = `${this.basePath}${path}.mp3`;
      audio.volume = (options.volume ?? 1.0) * this.masterVolume;
      audio.loop = options.loop ?? false;
      
      // Add to tracks map
      this.tracks.set(id, {
        element: audio,
        playing: false,
        loaded: false,
        volume: options.volume ?? 1.0,
        category: options.category ?? 'ambient'
      });
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        const track = this.tracks.get(id);
        if (track) {
          track.loaded = true;
          
          // Auto-play if requested
          if (options.autoplay) {
            this.play(id);
          }
          
          resolve();
        }
      });
      
      audio.addEventListener('error', (err) => {
        console.error(`Error loading audio track ${id}:`, err);
        reject(err);
      });
      
      // Start loading
      audio.load();
    });
  }
  
  /**
   * Unload a track and release resources
   * @param id The track ID to unload
   */
  public unloadTrack(id: string): void {
    const track = this.tracks.get(id);
    if (track) {
      // Stop if playing
      if (track.playing) {
        this.stop(id);
      }
      
      // Remove element
      track.element.src = '';
      track.element.load();
      
      // Remove from tracks map
      this.tracks.delete(id);
    }
  }
  
  /**
   * Play a track
   * @param id The track ID to play
   * @param fadeIn Whether to fade in the track
   */
  public play(id: string, fadeIn: boolean = false): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Track ${id} not found.`);
      return;
    }
    
    if (!track.loaded) {
      console.warn(`Track ${id} is not fully loaded yet.`);
      // Set up to play once loaded
      track.element.addEventListener('canplaythrough', () => {
        track.loaded = true;
        this.play(id, fadeIn);
      }, { once: true });
      return;
    }
    
    // Set volume according to master volume and mute state
    track.element.volume = this.muted ? 0 : track.volume * this.masterVolume;
    
    if (fadeIn) {
      this.fadeIn(id);
    } else {
      track.element.play()
        .catch(err => console.error(`Error playing track ${id}:`, err));
      track.playing = true;
    }
  }
  
  /**
   * Stop a track
   * @param id The track ID to stop
   * @param fadeOut Whether to fade out the track
   */
  public stop(id: string, fadeOut: boolean = false): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Track ${id} not found.`);
      return;
    }
    
    if (fadeOut) {
      this.fadeOut(id);
    } else {
      track.element.pause();
      track.element.currentTime = 0;
      track.playing = false;
    }
  }
  
  /**
   * Pause a track
   * @param id The track ID to pause
   */
  public pause(id: string): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Track ${id} not found.`);
      return;
    }
    
    track.element.pause();
    track.playing = false;
  }
  
  /**
   * Resume a paused track
   * @param id The track ID to resume
   */
  public resume(id: string): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Track ${id} not found.`);
      return;
    }
    
    track.element.play()
      .catch(err => console.error(`Error resuming track ${id}:`, err));
    track.playing = true;
  }
  
  /**
   * Check if a track is currently playing
   * @param id The track ID to check
   * @returns True if the track is playing, false otherwise
   */
  public isPlaying(id: string): boolean {
    const track = this.tracks.get(id);
    return track ? track.playing : false;
  }
  
  /**
   * Check if any track is currently playing
   * @returns True if any track is playing, false otherwise
   */
  public isAnyPlaying(): boolean {
    for (const [_, track] of this.tracks) {
      if (track.playing) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if any ambient track is currently playing
   * @returns True if any ambient track is playing, false otherwise
   */
  public isAnyAmbientPlaying(): boolean {
    for (const [_, track] of this.tracks) {
      if (track.playing && track.category === 'ambient') {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Set the master volume for all tracks
   * @param volume Master volume level (0.0 to 1.0)
   */
  public setMasterVolume(volume: number): void {
    // Clamp between 0 and 1
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update all track volumes
    for (const [_, track] of this.tracks) {
      if (!this.muted) {
        track.element.volume = track.volume * this.masterVolume;
      }
    }
  }
  
  /**
   * Get the current master volume
   * @returns The current master volume
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }
  
  /**
   * Set the volume for a specific track
   * @param id The track ID
   * @param volume Volume level (0.0 to 1.0)
   */
  public setTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Track ${id} not found.`);
      return;
    }
    
    // Clamp between 0 and 1
    track.volume = Math.max(0, Math.min(1, volume));
    
    // Update track volume if not muted
    if (!this.muted) {
      track.element.volume = track.volume * this.masterVolume;
    }
  }
  
  /**
   * Mute all audio
   * @param mute Whether to mute (true) or unmute (false)
   */
  public setMute(mute: boolean): void {
    this.muted = mute;
    
    // Update all track volumes
    for (const [_, track] of this.tracks) {
      track.element.volume = mute ? 0 : track.volume * this.masterVolume;
    }
  }
  
  /**
   * Check if audio is currently muted
   * @returns True if muted, false otherwise
   */
  public isMuted(): boolean {
    return this.muted;
  }
  
  /**
   * Set the default fade time for fade effects
   * @param seconds Fade time in seconds
   */
  public setFadeTime(seconds: number): void {
    this.fadeTime = Math.max(0.1, seconds);
  }
  
  /**
   * Fade in a track
   * @param id The track ID to fade in
   */
  private fadeIn(id: string): void {
    const track = this.tracks.get(id);
    if (!track) {
      return;
    }
    
    // Clear any existing fade
    if (track.fadeInterval) {
      clearInterval(track.fadeInterval);
      track.fadeInterval = undefined;
    }
    
    // Start with volume at 0
    track.element.volume = 0;
    track.element.play()
      .catch(err => console.error(`Error starting fade-in for track ${id}:`, err));
    track.playing = true;
    
    // Calculate steps
    const steps = 20; // Number of steps in the fade
    const stepTime = (this.fadeTime * 1000) / steps;
    const volumeStep = (track.volume * this.masterVolume) / steps;
    let currentStep = 0;
    
    // Set up interval for fade
    track.fadeInterval = window.setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        // Fade complete
        track.element.volume = this.muted ? 0 : track.volume * this.masterVolume;
        clearInterval(track.fadeInterval);
        track.fadeInterval = undefined;
      } else {
        // Increment volume
        track.element.volume = currentStep * volumeStep;
      }
    }, stepTime);
  }
  
  /**
   * Fade out a track
   * @param id The track ID to fade out
   */
  private fadeOut(id: string): void {
    const track = this.tracks.get(id);
    if (!track) {
      return;
    }
    
    // Clear any existing fade
    if (track.fadeInterval) {
      clearInterval(track.fadeInterval);
      track.fadeInterval = undefined;
    }
    
    // Get current volume
    const startVolume = track.element.volume;
    
    // Calculate steps
    const steps = 20; // Number of steps in the fade
    const stepTime = (this.fadeTime * 1000) / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;
    
    // Set up interval for fade
    track.fadeInterval = window.setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        // Fade complete, stop the track
        track.element.pause();
        track.element.currentTime = 0;
        track.playing = false;
        clearInterval(track.fadeInterval);
        track.fadeInterval = undefined;
        
        // Reset volume for next play
        track.element.volume = this.muted ? 0 : track.volume * this.masterVolume;
      } else {
        // Decrement volume
        track.element.volume = startVolume - (currentStep * volumeStep);
      }
    }, stepTime);
  }
  
  /**
   * Stop all currently playing tracks
   * @param fadeOut Whether to fade out the tracks
   */
  public stopAll(fadeOut: boolean = false): void {
    for (const [id, track] of this.tracks) {
      if (track.playing) {
        this.stop(id, fadeOut);
      }
    }
  }
  
  /**
   * Stop all ambient tracks, keeping effect tracks
   * @param fadeOut Whether to fade out the tracks
   */
  public stopAllAmbient(fadeOut: boolean = false): void {
    for (const [id, track] of this.tracks) {
      if (track.playing && track.category === 'ambient') {
        this.stop(id, fadeOut);
      }
    }
  }
  
  /**
   * Preload a set of tracks
   * @param tracks Array of track configurations to preload
   * @returns Promise that resolves when all tracks are loaded
   */
  public preloadTracks(tracks: Array<{
    id: string;
    path: string;
    options?: {
      volume?: number;
      loop?: boolean;
      category?: 'ambient' | 'effect';
    }
  }>): Promise<void[]> {
    return Promise.all(
      tracks.map(track => this.loadTrack(track.id, track.path, track.options))
    );
  }
  
  /**
   * Crossfade between two tracks
   * @param fadeOutId ID of the track to fade out
   * @param fadeInId ID of the track to fade in
   */
  public crossfade(fadeOutId: string, fadeInId: string): void {
    this.stop(fadeOutId, true);
    this.play(fadeInId, true);
  }
}