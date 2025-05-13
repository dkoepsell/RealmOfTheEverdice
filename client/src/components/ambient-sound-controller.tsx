import React, { useState, useEffect } from 'react';
import { 
  Volume1, 
  Volume2, 
  VolumeX, 
  Music, 
  Play, 
  Pause,
  Sliders,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AmbientSoundControllerProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentSoundContext?: {
    primary: string;
    secondary?: string;
    environment: string;
    mood: string;
  };
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onAutoDetectToggle?: (enabled: boolean) => void;
  className?: string;
}

export function AmbientSoundController({
  isPlaying,
  isMuted,
  volume,
  currentSoundContext,
  onVolumeChange,
  onToggleMute,
  onTogglePlay,
  onAutoDetectToggle,
  className = ''
}: AmbientSoundControllerProps) {
  const [expanded, setExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useLocalStorage('ambientSoundEnabled', true);
  const [autoDetect, setAutoDetect] = useLocalStorage('ambientSoundAutoDetect', true);
  
  // Format sound name for display
  const formatSoundName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };
  
  // Handle auto-detect toggle
  const handleAutoDetectToggle = (enabled: boolean) => {
    setAutoDetect(enabled);
    if (onAutoDetectToggle) {
      onAutoDetectToggle(enabled);
    }
  };
  
  // Handle sound enabled toggle
  const handleSoundEnabledToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    if (!enabled) {
      onToggleMute(); // Mute if disabled
    }
  };
  
  // Get the appropriate volume icon
  const VolumeIcon = isMuted 
    ? VolumeX 
    : volume < 0.3 
      ? Volume1 
      : Volume2;
  
  return (
    <div className={`ambient-sound-controller ${className}`}>
      {/* Minimized version shown by default */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                size="icon"
                onClick={onToggleMute}
                className={`rounded-full bg-background/80 backdrop-blur-sm ${isMuted ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                <VolumeIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMuted ? 'Unmute' : 'Mute'} ambient sounds</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover open={expanded} onOpenChange={setExpanded}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-full bg-background/80 backdrop-blur-sm"
              size="icon"
            >
              <Music className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" side="top" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Ambient Sound Controls</span>
                  <Badge 
                    variant={isPlaying && !isMuted ? "default" : "outline"}
                    className="ml-2"
                  >
                    {isPlaying && !isMuted ? "Playing" : "Paused"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                {/* Main Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={onTogglePlay}
                      className="mr-2"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={onToggleMute}
                      className={isMuted ? "text-muted-foreground" : ""}
                    >
                      <VolumeIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 mx-4">
                    <Slider
                      value={[volume * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(values) => onVolumeChange(values[0] / 100)}
                      disabled={isMuted}
                    />
                  </div>
                  
                  <div>
                    <span className="text-xs">{Math.round(volume * 100)}%</span>
                  </div>
                </div>
                
                {/* Settings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled" className="flex items-center text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Enable ambient sounds
                    </Label>
                    <Switch
                      id="sound-enabled"
                      checked={soundEnabled}
                      onCheckedChange={handleSoundEnabledToggle}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-detect" className="flex items-center text-sm">
                      <Sliders className="h-4 w-4 mr-2" />
                      Auto-detect from narrative
                    </Label>
                    <Switch
                      id="auto-detect"
                      checked={autoDetect}
                      onCheckedChange={handleAutoDetectToggle}
                      disabled={!soundEnabled}
                    />
                  </div>
                </div>
                
                {/* Current Sound Info */}
                {currentSoundContext && soundEnabled && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">Current Ambient Sound</h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">Primary:</span>
                        <span>{formatSoundName(currentSoundContext.primary)}</span>
                      </div>
                      {currentSoundContext.secondary && (
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Secondary:</span>
                          <span>{formatSoundName(currentSoundContext.secondary)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">Environment:</span>
                        <span>{formatSoundName(currentSoundContext.environment)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold mr-2">Mood:</span>
                        <span>{formatSoundName(currentSoundContext.mood)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}