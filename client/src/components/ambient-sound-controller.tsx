import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AmbientSoundControllerProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentVolume: number;
  onMuteToggle: () => void;
  onVolumeChange: (value: number) => void;
  onPlayPause: () => void;
  currentContext?: {
    environment: string;
    mood: string;
  };
  className?: string;
}

/**
 * Controller component for ambient sounds
 * Provides volume adjustment and mute controls
 */
export function AmbientSoundController({
  isPlaying,
  isMuted,
  currentVolume,
  onMuteToggle,
  onVolumeChange,
  onPlayPause,
  currentContext,
  className,
}: AmbientSoundControllerProps) {
  // Persistent settings
  const [soundEnabled, setSoundEnabled] = useLocalStorage('sound-enabled', true);
  
  // Local state for temporary UI values
  const [localVolume, setLocalVolume] = useState(currentVolume);
  
  // Update local volume when prop changes
  useEffect(() => {
    setLocalVolume(currentVolume);
  }, [currentVolume]);
  
  // Handle volume slider change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    onVolumeChange(newVolume);
  };
  
  // Handle sound toggle
  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    
    if (!checked && isPlaying) {
      onMuteToggle(); // Mute sounds if toggled off
    } else if (checked && isMuted) {
      onMuteToggle(); // Unmute sounds if toggled on
    }
  };
  
  return (
    <div className={`ambient-sound-controller ${className || ''}`}>
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${!soundEnabled || isMuted ? 'text-muted-foreground' : 'text-primary'}`}
                  aria-label="Sound settings"
                >
                  {!soundEnabled || isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Ambient Sound Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Ambient Sounds</h4>
              <Switch 
                checked={soundEnabled} 
                onCheckedChange={handleSoundToggle}
                aria-label="Enable ambient sounds"
              />
            </div>
            
            {soundEnabled && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(localVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[localVolume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    aria-label="Adjust volume"
                    disabled={isMuted}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mute</span>
                  <Switch 
                    checked={isMuted} 
                    onCheckedChange={onMuteToggle}
                    aria-label="Mute sounds"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPlayPause}
                    className="w-full"
                    disabled={isMuted}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    {isPlaying ? 'Stop Music' : 'Play Music'}
                  </Button>
                </div>
              </>
            )}
            
            {soundEnabled && currentContext && (
              <div className="pt-2 border-t border-border">
                <h5 className="text-sm font-medium mb-2">Current Sound Context</h5>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment:</span>
                    <span className="font-medium">{currentContext.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mood:</span>
                    <span className="font-medium">{currentContext.mood}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}