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
  loop?: boolean;
}

interface LoadTrackOptions {
  loop?: boolean;
  volume?: number;
  category?: 'ambient' | 'effect';
}

export class AudioService {
  private static instance: AudioService;
  private tracks: Map<string, AudioTrack> = new Map();
  private basePath: string = '/sounds/';
  private masterVolume: number = 1.0;
  private muted: boolean = false;
  private fadeTime: number = 2; // Default fade time in seconds

  private constructor() {
    // Private constructor for singleton pattern
    console.log('AudioService initialized');
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
    options: LoadTrackOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // If track is already loaded, don't load it again
      if (this.tracks.has(id)) {
        resolve();
        return;
      }

      const fullPath = `${this.basePath}${path}.mp3`;
      const audio = new Audio();

      audio.src = fullPath;
      audio.loop = options.loop ?? false;
      audio.volume = this.muted ? 0 : (options.volume ?? 1.0) * this.masterVolume;
      
      const track: AudioTrack = {
        element: audio,
        playing: false,
        loaded: false,
        volume: options.volume ?? 1.0,
        category: options.category ?? 'effect',
        loop: options.loop ?? false
      };

      // Register a loadeddata event listener
      audio.addEventListener('loadeddata', () => {
        track.loaded = true;
        console.log(`Track ${id} loaded:`, fullPath);
        resolve();
      });

      // Register an error event listener
      audio.addEventListener('error', (e) => {
        console.error(`Failed to load track ${id}:`, fullPath, e);
        reject(new Error(`Failed to load audio track: ${e.message}`));
      });

      // Add the track to the map
      this.tracks.set(id, track);

      // Begin loading the audio
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
      // Stop the track if it's playing
      if (track.playing) {
        track.element.pause();
      }

      // Remove event listeners
      track.element.onended = null;
      track.element.oncanplaythrough = null;
      track.element.onerror = null;

      // Clean up any active fade intervals
      if (track.fadeInterval) {
        clearInterval(track.fadeInterval);
      }

      // Set src to empty string to release resources
      track.element.src = '';
      
      // Remove from map
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
      console.warn(`Track ${id} not found`);
      return;
    }

    // If already playing, do nothing
    if (track.playing) {
      return;
    }

    // Set the correct volume before playing
    track.element.volume = this.muted ? 0 : track.volume * this.masterVolume;

    // If fade in, set volume to 0 and gradually increase
    if (fadeIn) {
      track.element.volume = 0;
      this.fadeIn(id);
    }

    // Play the track
    try {
      const playPromise = track.element.play();
      track.playing = true;

      // Handle promise rejection (e.g., autoplay policy)
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error(`Failed to play track ${id}:`, error);
          track.playing = false;
        });
      }
    } catch (error) {
      console.error(`Error playing track ${id}:`, error);
      track.playing = false;
    }
  }

  /**
   * Stop a track
   * @param id The track ID to stop
   * @param fadeOut Whether to fade out the track
   */
  public stop(id: string, fadeOut: boolean = false): void {
    const track = this.tracks.get(id);
    if (!track || !track.playing) {
      return;
    }

    if (fadeOut) {
      this.fadeOut(id);
    } else {
      track.element.pause();
      if (track.element.currentTime) {
        track.element.currentTime = 0;
      }
      track.playing = false;
    }
  }

  /**
   * Pause a track
   * @param id The track ID to pause
   */
  public pause(id: string): void {
    const track = this.tracks.get(id);
    if (track && track.playing) {
      track.element.pause();
      track.playing = false;
    }
  }

  /**
   * Resume a paused track
   * @param id The track ID to resume
   */
  public resume(id: string): void {
    const track = this.tracks.get(id);
    if (track && !track.playing && track.element.paused) {
      this.play(id, false);
    }
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
    for (const track of this.tracks.values()) {
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
    for (const track of this.tracks.values()) {
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
    // Clamp volume between 0 and 1
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update volume for all tracks
    for (const track of this.tracks.values()) {
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
    if (track) {
      // Clamp volume between 0 and 1
      track.volume = Math.max(0, Math.min(1, volume));
      
      // Update the actual volume if not muted
      if (!this.muted) {
        track.element.volume = track.volume * this.masterVolume;
      }
    }
  }

  /**
   * Mute all audio
   * @param mute Whether to mute (true) or unmute (false)
   */
  public setMute(mute: boolean): void {
    this.muted = mute;

    // Update volume for all tracks
    for (const track of this.tracks.values()) {
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
    if (!track) return;

    // Clear any existing fade interval
    if (track.fadeInterval) {
      clearInterval(track.fadeInterval);
    }

    // Get target volume
    const targetVolume = this.muted ? 0 : track.volume * this.masterVolume;
    let currentVolume = 0;
    track.element.volume = currentVolume;

    // Calculate number of steps and step size
    const steps = Math.max(10, this.fadeTime * 10); // At least 10 steps, up to 10 steps per second
    const stepSize = targetVolume / steps;
    const stepTime = this.fadeTime * 1000 / steps;

    // Create fade interval
    track.fadeInterval = window.setInterval(() => {
      currentVolume += stepSize;
      
      if (currentVolume >= targetVolume) {
        currentVolume = targetVolume;
        track.element.volume = currentVolume;
        clearInterval(track.fadeInterval!);
        track.fadeInterval = undefined;
      } else {
        track.element.volume = currentVolume;
      }
    }, stepTime);
  }

  /**
   * Fade out a track
   * @param id The track ID to fade out
   */
  private fadeOut(id: string): void {
    const track = this.tracks.get(id);
    if (!track) return;

    // Clear any existing fade interval
    if (track.fadeInterval) {
      clearInterval(track.fadeInterval);
    }

    // Get current volume as starting point
    let currentVolume = track.element.volume;
    
    // Calculate number of steps and step size
    const steps = Math.max(10, this.fadeTime * 10); // At least 10 steps, up to 10 steps per second
    const stepSize = currentVolume / steps;
    const stepTime = this.fadeTime * 1000 / steps;

    // Create fade interval
    track.fadeInterval = window.setInterval(() => {
      currentVolume -= stepSize;
      
      if (currentVolume <= 0) {
        track.element.pause();
        if (track.element.currentTime) {
          track.element.currentTime = 0;
        }
        track.element.volume = 0;
        track.playing = false;
        clearInterval(track.fadeInterval!);
        track.fadeInterval = undefined;
      } else {
        track.element.volume = currentVolume;
      }
    }, stepTime);
  }

  /**
   * Stop all currently playing tracks
   * @param fadeOut Whether to fade out the tracks
   */
  public stopAll(fadeOut: boolean = false): void {
    for (const [id, track] of this.tracks.entries()) {
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
    for (const [id, track] of this.tracks.entries()) {
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
    options?: LoadTrackOptions;
  }>): Promise<void[]> {
    const promises = tracks.map(track => 
      this.loadTrack(track.id, track.path, track.options)
    );
    return Promise.all(promises);
  }

  /**
   * Crossfade between two tracks
   * @param fadeOutId ID of the track to fade out
   * @param fadeInId ID of the track to fade in
   */
  public crossfade(fadeOutId: string, fadeInId: string): void {
    const trackOut = this.tracks.get(fadeOutId);
    const trackIn = this.tracks.get(fadeInId);
    
    if (!trackOut || !trackIn) {
      console.warn(`One or both tracks not found: ${fadeOutId}, ${fadeInId}`);
      return;
    }
    
    // Start fading out the current track
    if (trackOut.playing) {
      this.fadeOut(fadeOutId);
    }
    
    // Start playing and fading in the new track
    this.play(fadeInId, true);
  }
}