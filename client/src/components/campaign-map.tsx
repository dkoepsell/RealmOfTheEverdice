import { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMapEvents, 
  LayerGroup,
  CircleMarker,
  Tooltip,
  Polyline
} from 'react-leaflet';
import { Icon, LatLngExpression, DivIcon } from 'leaflet';
import { Button } from '@/components/ui/button';
import { 
  Map, 
  MapPin, 
  Castle, 
  Sword, 
  Skull, 
  Treasure,
  Tree,
  Mountain,
  Home,
  Ship,
  PlusCircle,
  Info,
  X,
  RotateCw,
  Footprints,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndTextAnalyzer } from './dnd-text-analyzer';
import 'leaflet/dist/leaflet.css';

// Types for our map markers
export type MapMarkerType = 
  | 'town' 
  | 'city' 
  | 'dungeon' 
  | 'battle' 
  | 'quest' 
  | 'landmark'
  | 'player';

interface MapMarker {
  id: string;
  type: MapMarkerType;
  name: string;
  description: string;
  position: [number, number];
  discovered: boolean;
  completed?: boolean;
  iconUrl?: string;
}

interface JourneyPath {
  id: string;
  name: string;
  points: [number, number][];
  color: string;
}

interface CampaignMapProps {
  markers?: MapMarker[];
  paths?: JourneyPath[];
  campaignId: number;
  currentLocation?: [number, number];
  onMarkerClick?: (marker: MapMarker) => void;
  onMarkerAdd?: (marker: Omit<MapMarker, 'id'>) => void;
  readOnly?: boolean;
  height?: string;
}

// Custom hook to handle map events
function MapControls({ onPositionClicked, isAddingMarker }: { 
  onPositionClicked: (position: [number, number]) => void;
  isAddingMarker: boolean;
}) {
  const map = useMapEvents({
    click(e) {
      if (isAddingMarker) {
        const { lat, lng } = e.latlng;
        onPositionClicked([lat, lng]);
      }
    },
  });

  return null;
}

// Map component to display the fantasy world
export function CampaignMap({ 
  markers = [], 
  paths = [],
  campaignId,
  currentLocation,
  onMarkerClick,
  onMarkerAdd,
  readOnly = false,
  height = '400px'
}: CampaignMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [showAddMarkerDialog, setShowAddMarkerDialog] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<[number, number] | null>(null);
  const [newMarkerType, setNewMarkerType] = useState<MapMarkerType>('landmark');
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerDescription, setNewMarkerDescription] = useState('');
  const mapRef = useRef<any>(null);

  const defaultCenter: LatLngExpression = [40, -20]; // Default center of the map

  // Center map on current location if available
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView(currentLocation, 6);
    }
  }, [currentLocation]);

  // Get icon for marker type
  const getMarkerIcon = (type: MapMarkerType, discovered: boolean = true, completed: boolean = false) => {
    const markerIcons = {
      town: <Home className={`${discovered ? 'text-blue-600' : 'text-gray-400'} ${completed ? 'opacity-60' : 'opacity-100'}`} />,
      city: <Castle className={`${discovered ? 'text-purple-700' : 'text-gray-400'} ${completed ? 'opacity-60' : 'opacity-100'}`} />,
      dungeon: <Skull className={`${discovered ? 'text-red-600' : 'text-gray-400'} ${completed ? 'opacity-60' : 'opacity-100'}`} />,
      battle: <Sword className={`${discovered ? 'text-orange-600' : 'text-gray-400'} ${completed ? 'opacity-60' : 'opacity-100'}`} />,
      quest: <Treasure className={`${discovered ? 'text-amber-500' : 'text-gray-400'} ${completed ? 'opacity-60' : 'opacity-100'}`} />,
      landmark: <Mountain className={`${discovered ? 'text-green-700' : 'text-gray-400'} ${completed ? 'opacity-60' : 'opacity-100'}`} />,
      player: <MapPin className="text-primary animate-pulse" />
    };

    return markerIcons[type];
  };

  // Handle marker click
  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  // Handle map click when adding a marker
  const handleMapClick = (position: [number, number]) => {
    if (isAddingMarker) {
      setNewMarkerPosition(position);
      setShowAddMarkerDialog(true);
      setIsAddingMarker(false);
    }
  };

  // Handle adding a new marker
  const handleAddMarker = () => {
    if (newMarkerPosition && newMarkerName && onMarkerAdd) {
      onMarkerAdd({
        type: newMarkerType,
        name: newMarkerName,
        description: newMarkerDescription,
        position: newMarkerPosition,
        discovered: true
      });

      // Reset form
      setNewMarkerName('');
      setNewMarkerDescription('');
      setNewMarkerType('landmark');
      setNewMarkerPosition(null);
      setShowAddMarkerDialog(false);
    }
  };

  // Center map on player position
  const centerOnPlayer = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView(currentLocation, 6);
    }
  };

  // Render the map UI
  return (
    <div className="relative bg-card border rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
        {!readOnly && (
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-white shadow-md"
            onClick={() => setIsAddingMarker(true)}
            disabled={isAddingMarker}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
        <Button 
          size="icon" 
          variant="secondary" 
          className="bg-white shadow-md"
          onClick={centerOnPlayer}
        >
          <Footprints className="h-4 w-4" />
        </Button>
      </div>
      
      <MapContainer 
        center={currentLocation || defaultCenter} 
        zoom={5} 
        style={{ height }}
        ref={mapRef}
        attributionControl={false}
      >
        {/* Base map styles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Draw journey paths */}
        {paths.map(path => (
          <Polyline 
            key={path.id}
            positions={path.points}
            color={path.color || '#3b82f6'}
            weight={3}
            opacity={0.7}
            dashArray="6, 8"
          >
            <Tooltip sticky>{path.name}</Tooltip>
          </Polyline>
        ))}
        
        {/* Location markers */}
        <LayerGroup>
          {markers.map(marker => (
            <Marker 
              key={marker.id} 
              position={marker.position}
              eventHandlers={{
                click: () => handleMarkerClick(marker)
              }}
              icon={
                new DivIcon({
                  html: `<div class="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-primary shadow-md">
                    <div class="text-center">${React.createElement('div', {
                      dangerouslySetInnerHTML: {
                        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${
                          marker.type === 'town' ? 'text-blue-600' : 
                          marker.type === 'city' ? 'text-purple-700' : 
                          marker.type === 'dungeon' ? 'text-red-600' : 
                          marker.type === 'battle' ? 'text-orange-600' : 
                          marker.type === 'quest' ? 'text-amber-500' : 
                          marker.type === 'landmark' ? 'text-green-700' : 'text-gray-700'
                        } ${marker.completed ? 'opacity-60' : 'opacity-100'}">
                          ${
                            marker.type === 'town' ? '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' : 
                            marker.type === 'city' ? '<path d="M4 22h14a2 2 0 0 0 2-2V7.5L14 2H6a2 2 0 0 0-2 2v4"></path><path d="M2 13h8v9H2z"></path><path d="M9 10v4"></path><path d="M22 19h-6"></path><path d="M15 13v6"></path><path d="M18 13v6"></path>' : 
                            marker.type === 'dungeon' ? '<path d="M12 4c1.5 0 2.3 1.4 2.8 2.9.3.9 1.2 1.4 2.1 1.1.8-.3 1.1-1.2 1-2L12 4Z"></path><path d="M12 4c-1.5 0-2.3 1.4-2.8 2.9-.3.9-1.2 1.4-2.1 1.1-.8-.3-1.1-1.2-1-2L12 4Z"></path><path d="M19 7.5 C 20  15, 15 18, 12 18C9 18, 4 15, 5 7.5"></path><path d="M12 22v-4"></path><path d="M8 22h8"></path>'  : 
                            marker.type === 'battle' ? '<path d="M14.5 17.5 L 6.3 9.3"></path><path d="M9.5 17.5 L 17.7 9.3"></path><path d="M4 9c.9.9 9 4 9 4s3.1-8.1 4-9"></path><path d="M4 22v-8h8"></path><path d="M20 22v-8h-8"></path>' : 
                            marker.type === 'quest' ? '<path d="M5 11l6-8 6 8-6 8z"></path><path d="M5 11h14"></path>' : 
                            marker.type === 'landmark' ? '<path d="m6 21 6-9.5L18 21"></path><path d="M14 14l3-3.5L21 14"></path>' : 
                            '<circle cx="12" cy="10" r="3"></circle><path d="M12 21.7C17.3 17 22 13 22 8.7a7 7 0 1 0-14 0C8 13 12.7 17 12 21.7z"></path>'
                          }
                        </svg>`
                      }
                    })}</div>
                  </div>`,
                  className: "",
                  iconSize: [32, 32],
                  iconAnchor: [16, 32]
                })
              }
            >
              <Tooltip>{marker.name}</Tooltip>
            </Marker>
          ))}
          
          {/* Current player location */}
          {currentLocation && (
            <CircleMarker
              center={currentLocation}
              radius={6}
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 1, 
                color: 'white', 
                weight: 2 
              }}
            >
              <Tooltip permanent>You are here</Tooltip>
            </CircleMarker>
          )}
        </LayerGroup>
        
        {/* Map controls for adding markers */}
        <MapControls 
          onPositionClicked={handleMapClick} 
          isAddingMarker={isAddingMarker} 
        />
      </MapContainer>
      
      {/* Selected marker info popup */}
      {selectedMarker && (
        <div className="absolute left-4 bottom-4 right-4 md:w-80 md:left-4 md:right-auto bg-card border rounded-lg p-4 shadow-lg z-[1000]">
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-2 top-2" 
            onClick={() => setSelectedMarker(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-muted p-2">
              {getMarkerIcon(selectedMarker.type, selectedMarker.discovered, selectedMarker.completed)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{selectedMarker.name}</h3>
              <Badge variant={selectedMarker.completed ? "outline" : "secondary"} className="capitalize">
                {selectedMarker.completed ? "Completed" : selectedMarker.type}
              </Badge>
            </div>
          </div>
          
          <div className="text-sm mt-2 max-h-32 overflow-y-auto">
            <DndTextAnalyzer text={selectedMarker.description} />
          </div>
        </div>
      )}
      
      {/* Add marker dialog */}
      <Dialog open={showAddMarkerDialog} onOpenChange={setShowAddMarkerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>
              Add a new location to the campaign map.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="marker-type">Location Type</Label>
              <Select 
                value={newMarkerType} 
                onValueChange={(value) => setNewMarkerType(value as MapMarkerType)}
              >
                <SelectTrigger id="marker-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="town">Town/Village</SelectItem>
                  <SelectItem value="city">City/Castle</SelectItem>
                  <SelectItem value="dungeon">Dungeon/Cave</SelectItem>
                  <SelectItem value="battle">Battle Site</SelectItem>
                  <SelectItem value="quest">Quest</SelectItem>
                  <SelectItem value="landmark">Landmark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marker-name">Name</Label>
              <Input 
                id="marker-name" 
                value={newMarkerName} 
                onChange={(e) => setNewMarkerName(e.target.value)} 
                placeholder="Location name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marker-description">Description</Label>
              <Textarea 
                id="marker-description" 
                value={newMarkerDescription} 
                onChange={(e) => setNewMarkerDescription(e.target.value)} 
                placeholder="Describe this location"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMarkerDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMarker} disabled={!newMarkerName}>Add Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}