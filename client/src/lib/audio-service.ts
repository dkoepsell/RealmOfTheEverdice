/**
 * Audio Service for Ambient Sound Playback
 * 
 * This service manages the loading, playback, and crossfading of ambient sounds
 * using the Web Audio API for optimal performance and flexibility.
 */

interface AudioTrack {
  id: string;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  buffer: AudioBuffer | null;
  playing: boolean;
  loop: boolean;
  volume: number;
  url: string;
  startTime?: number;
}

interface FadeOptions {
  duration?: number; // in seconds
  targetVolume?: number; // 0 to 1
}

class AmbientAudioService {
  private static instance: AmbientAudioService;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<string, AudioTrack> = new Map();
  private soundPath = '/sounds/';
  private initialized = false;
  private muted = false;
  private volume = 0.5; // 0 to 1
  
  private constructor() {
    this.initAudioContext();
  }
  
  public static getInstance(): AmbientAudioService {
    if (!AmbientAudioService.instance) {
      AmbientAudioService.instance = new AmbientAudioService();
    }
    return AmbientAudioService.instance;
  }
  
  /**
   * Initialize the Web Audio API context
   */
  private initAudioContext(): void {
    try {
      // AudioContext must be created as a result of user gesture
      // We'll delay actual creation until playSound() is called
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.initialized = false;
    }
  }
  
  /**
   * Ensure audio context is created and resumed
   */
  private async ensureAudioContext(): Promise<boolean> {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(this.audioContext.destination);
      } catch (error) {
        console.error('Failed to create audio context:', error);
        return false;
      }
    }
    
    // Make sure audio context is running
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Load an audio file and returns a promise that resolves with the decoded audio data
   */
  private async loadAudioFile(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      if (!await this.ensureAudioContext()) {
        return null;
      }
    }
    
    try {
      const response = await fetch(this.soundPath + url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext!.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Failed to load audio: ${url}`, error);
      return null;
    }
  }
  
  /**
   * Create a new track or return existing one
   */
  private async getOrCreateTrack(id: string, url: string, loop = true): Promise<AudioTrack | null> {
    // Check if track exists
    let track = this.tracks.get(id);
    
    if (!track) {
      // Create a new track
      track = {
        id,
        source: null,
        gainNode: null,
        buffer: null,
        playing: false,
        loop,
        volume: 1.0,
        url
      };
      
      this.tracks.set(id, track);
    }
    
    // Load audio buffer if it's not loaded yet
    if (!track.buffer) {
      if (url !== track.url) {
        track.url = url;
      }
      
      track.buffer = await this.loadAudioFile(url);
      if (!track.buffer) {
        return null;
      }
    }
    
    return track;
  }
  
  /**
   * Play a sound with the given ID and options
   */
  public async playSound(
    id: string,
    url: string,
    options: {
      loop?: boolean;
      volume?: number;
      fadeIn?: number; // seconds
    } = {}
  ): Promise<boolean> {
    const { loop = true, volume = 1.0, fadeIn = 0 } = options;
    
    if (!await this.ensureAudioContext()) {
      return false;
    }
    
    // Create or get the track
    const track = await this.getOrCreateTrack(id, url, loop);
    if (!track) {
      return false;
    }
    
    // Stop the track if it's already playing
    if (track.playing) {
      this.stopSound(id, { duration: fadeIn > 0 ? fadeIn / 2 : 0 });
    }
    
    // Create new source and gain node
    track.source = this.audioContext!.createBufferSource();
    track.source.buffer = track.buffer;
    track.source.loop = loop;
    
    track.gainNode = this.audioContext!.createGain();
    track.volume = volume;
    
    // Set initial volume to 0 for fade-in or full volume otherwise
    if (fadeIn > 0) {
      track.gainNode.gain.value = 0;
    } else {
      track.gainNode.gain.value = volume;
    }
    
    // Connect nodes
    track.source.connect(track.gainNode);
    track.gainNode.connect(this.masterGain!);
    
    // Start playing
    track.source.start(0);
    track.playing = true;
    track.startTime = this.audioContext!.currentTime;
    
    // Apply fade-in
    if (fadeIn > 0) {
      track.gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
      track.gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext!.currentTime + fadeIn
      );
    }
    
    // Handle track ending
    track.source.onended = () => {
      if (!loop) {
        this.cleanupTrack(track);
      }
    };
    
    return true;
  }
  
  /**
   * Stop playing a sound with the given ID
   */
  public stopSound(id: string, options: FadeOptions = {}): boolean {
    const { duration = 0 } = options;
    
    const track = this.tracks.get(id);
    if (!track || !track.playing || !track.source || !track.gainNode) {
      return false;
    }
    
    try {
      if (duration > 0 && this.audioContext) {
        // Fade out
        const currentTime = this.audioContext.currentTime;
        track.gainNode.gain.setValueAtTime(track.gainNode.gain.value, currentTime);
        track.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
        
        // Stop after fade-out completes
        setTimeout(() => {
          this.cleanupTrack(track);
        }, duration * 1000);
      } else {
        // Stop immediately
        this.cleanupTrack(track);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to stop sound: ${id}`, error);
      return false;
    }
  }
  
  /**
   * Cleanup track resources
   */
  private cleanupTrack(track: AudioTrack): void {
    if (track.source) {
      try {
        track.source.stop();
      } catch (e) {
        // Ignore errors when the sound has already stopped
      }
      track.source.disconnect();
      track.source = null;
    }
    
    if (track.gainNode) {
      track.gainNode.disconnect();
      track.gainNode = null;
    }
    
    track.playing = false;
    track.startTime = undefined;
  }
  
  /**
   * Crossfade between two sounds
   */
  public async crossFade(
    fromId: string,
    toUrl: string,
    toId: string,
    fadeDuration: number = 2.0
  ): Promise<boolean> {
    const fromTrack = this.tracks.get(fromId);
    
    // First start the new sound with 0 volume
    const success = await this.playSound(toId, toUrl, { 
      volume: 0, 
      loop: true 
    });
    
    if (!success) return false;
    
    // If the 'from' sound is playing, fade it out
    if (fromTrack && fromTrack.playing && fromTrack.gainNode && this.audioContext) {
      const currentTime = this.audioContext.currentTime;
      fromTrack.gainNode.gain.setValueAtTime(
        fromTrack.gainNode.gain.value, 
        currentTime
      );
      fromTrack.gainNode.gain.linearRampToValueAtTime(
        0, 
        currentTime + fadeDuration
      );
    }
    
    // Fade in the 'to' sound
    const toTrack = this.tracks.get(toId);
    if (toTrack && toTrack.gainNode && this.audioContext) {
      const currentTime = this.audioContext.currentTime;
      toTrack.gainNode.gain.setValueAtTime(0, currentTime);
      toTrack.gainNode.gain.linearRampToValueAtTime(
        toTrack.volume, 
        currentTime + fadeDuration
      );
    }
    
    // After fade completes, clean up the 'from' track
    if (fromTrack) {
      setTimeout(() => {
        this.cleanupTrack(fromTrack);
      }, fadeDuration * 1000);
    }
    
    return true;
  }
  
  /**
   * Set the master volume for all sounds
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume;
    }
  }
  
  /**
   * Mute or unmute all sounds
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
  }
  
  /**
   * Toggle mute state
   */
  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
  
  /**
   * Get the current mute state
   */
  public isMuted(): boolean {
    return this.muted;
  }
  
  /**
   * Get the current volume
   */
  public getVolume(): number {
    return this.volume;
  }
  
  /**
   * Stop all playing sounds
   */
  public stopAll(fadeOut: number = 0): void {
    for (const [id, track] of this.tracks.entries()) {
      if (track.playing) {
        this.stopSound(id, { duration: fadeOut });
      }
    }
  }
  
  /**
   * Set the path where sound files are located
   */
  public setSoundPath(path: string): void {
    this.soundPath = path.endsWith('/') ? path : path + '/';
  }
  
  /**
   * Cleanup and release resources
   */
  public dispose(): void {
    this.stopAll();
    
    this.tracks.clear();
    
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const ambientAudioService = AmbientAudioService.getInstance();