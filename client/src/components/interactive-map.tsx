import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Castle, 
  Tent, 
  Trees, 
  Mountain, 
  Skull, 
  Ship, 
  Building, 
  Compass, 
  Sword, 
  ScrollText,
  Plus,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Waypoints,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the MarkerData interface to type our map markers
interface MarkerData {
  id?: number;
  name: string;
  type: string;
  position: [number, number];
  description?: string | null;
  notes?: string | null;
  discovered?: boolean;
  completed?: boolean;
  iconUrl?: string | null;
  quests?: {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    reward?: string;
  }[] | null;
}

// Define the PathData interface for paths between markers
interface PathData {
  id?: number;
  name: string;
  points: [number, number][];
  description?: string | null;
  type?: string;
  discovered?: boolean;
  completed?: boolean;
}

interface InteractiveMapProps {
  campaignId: number;
  height?: string;
  width?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  isDM?: boolean;
  onMarkerClick?: (marker: MarkerData) => void;
}

// Custom map marker icons for different location types
const getMarkerIcon = (type: string, discovered: boolean = true) => {
  // Base icon properties
  const iconSize = [25, 41];
  const iconAnchor = [12, 41];
  const popupAnchor = [1, -34];
  const shadowSize = [41, 41];

  let iconUrl = '';
  const opacity = discovered ? 1 : 0.6;
  
  // Determine icon based on location type
  switch (type) {
    case 'town':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
      break;
    case 'city':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
      break;
    case 'dungeon':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png';
      break;
    case 'camp':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
      break;
    case 'point_of_interest':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png';
      break;
    case 'quest':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png';
      break;
    case 'encounter':
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png';
      break;
    default:
      iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
  }

  return L.icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconSize,
    iconAnchor,
    popupAnchor,
    shadowSize,
    className: `opacity-${opacity * 100}`
  });
};

const getMarkerIcon2 = (type: string, discovered: boolean = true) => {
  const defaultIcon = new L.Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    iconSize: [25, 41],
  });
  
  return defaultIcon;
};

// Helper component to get the current map instance
const MapController = ({ 
  markers, 
  paths, 
  onMapClick, 
  editingMode, 
  selectedMarker,
  setSelectedMarker
}: { 
  markers: MarkerData[],
  paths: PathData[],
  onMapClick: (e: L.LeafletMouseEvent) => void,
  editingMode: boolean,
  selectedMarker: MarkerData | null,
  setSelectedMarker: (marker: MarkerData | null) => void
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (editingMode) {
      map.on('click', onMapClick);
    } else {
      map.off('click', onMapClick);
    }
    
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick, editingMode]);

  // Add/remove click handlers for markers
  useEffect(() => {
    // Any additional marker-related effects
  }, [markers, map]);

  return null;
};

// Main interactive map component
const InteractiveMap: React.FC<InteractiveMapProps> = ({
  campaignId,
  height = '500px',
  width = '100%',
  initialCenter = [0, 0],
  initialZoom = 3,
  isDM = false,
  onMarkerClick
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State variables
  const [editingMode, setEditingMode] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<[number, number] | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [selectedPath, setSelectedPath] = useState<PathData | null>(null);
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number][]>([]);
  const [newMarkerData, setNewMarkerData] = useState<Partial<MarkerData>>({
    name: '',
    type: 'point_of_interest',
    description: '',
    notes: '',
    discovered: true
  });
  const [newPathData, setNewPathData] = useState<Partial<PathData>>({
    name: '',
    type: 'road',
    description: '',
    discovered: true
  });
  
  // Function to handle map clicks (for adding new markers when in edit mode)
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!editingMode) return;
    
    if (isCreatingPath) {
      // Add point to the current path
      setCurrentPathPoints([...currentPathPoints, [e.latlng.lat, e.latlng.lng]]);
      toast({
        title: 'Point added to path',
        description: `Added point at ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
      });
    } else {
      // Set position for a new marker
      setNewMarkerPosition([e.latlng.lat, e.latlng.lng]);
      setNewMarkerData({
        ...newMarkerData,
        position: [e.latlng.lat, e.latlng.lng]
      });
      setMarkerDialogOpen(true);
    }
  };

  // Query to get markers for this campaign
  const { 
    data: markers = [], 
    isLoading: markersLoading,
    refetch: refetchMarkers 
  } = useQuery<MarkerData[]>({
    queryKey: [`/api/campaigns/${campaignId}/markers`],
    retry: 1,
  });
  
  // Query to get paths for this campaign
  const { 
    data: paths = [], 
    isLoading: pathsLoading,
    refetch: refetchPaths 
  } = useQuery<PathData[]>({
    queryKey: [`/api/campaigns/${campaignId}/paths`],
    retry: 1,
  });

  // Mutation to add a new marker
  const addMarkerMutation = useMutation({
    mutationFn: async (markerData: Partial<MarkerData>) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/markers`, markerData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Marker added',
        description: 'New location added to the map'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/markers`] });
      setMarkerDialogOpen(false);
      setNewMarkerData({
        name: '',
        type: 'point_of_interest',
        description: '',
        notes: '',
        discovered: true
      });
      setNewMarkerPosition(null);
    },
    onError: (error) => {
      toast({
        title: 'Error adding marker',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mutation to update an existing marker
  const updateMarkerMutation = useMutation({
    mutationFn: async (markerData: MarkerData) => {
      const res = await apiRequest('PUT', `/api/campaigns/${campaignId}/markers/${markerData.id}`, markerData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Marker updated',
        description: 'Location information has been updated'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/markers`] });
      setMarkerDialogOpen(false);
      setSelectedMarker(null);
    },
    onError: (error) => {
      toast({
        title: 'Error updating marker',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mutation to delete a marker
  const deleteMarkerMutation = useMutation({
    mutationFn: async (markerId: number) => {
      const res = await apiRequest('DELETE', `/api/campaigns/${campaignId}/markers/${markerId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Marker deleted',
        description: 'Location has been removed from the map'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/markers`] });
      setMarkerDialogOpen(false);
      setSelectedMarker(null);
    },
    onError: (error) => {
      toast({
        title: 'Error deleting marker',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mutation to add a new path
  const addPathMutation = useMutation({
    mutationFn: async (pathData: Partial<PathData>) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/paths`, pathData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Path added',
        description: 'New path added to the map'
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/paths`] });
      setPathDialogOpen(false);
      setIsCreatingPath(false);
      setCurrentPathPoints([]);
      setNewPathData({
        name: '',
        type: 'road',
        description: '',
        discovered: true
      });
    },
    onError: (error) => {
      toast({
        title: 'Error adding path',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handle creating a new marker
  const handleCreateMarker = () => {
    if (!newMarkerPosition) return;
    
    addMarkerMutation.mutate({
      ...newMarkerData,
      campaignId,
      position: newMarkerPosition,
    });
  };
  
  // Handle updating an existing marker
  const handleUpdateMarker = () => {
    if (!selectedMarker) return;
    
    updateMarkerMutation.mutate(selectedMarker);
  };
  
  // Handle deleting a marker
  const handleDeleteMarker = () => {
    if (!selectedMarker?.id) return;
    
    deleteMarkerMutation.mutate(selectedMarker.id);
  };
  
  // Handle creating a new path
  const handleCreatePath = () => {
    if (currentPathPoints.length < 2) {
      toast({
        title: 'Not enough points',
        description: 'A path requires at least 2 points',
        variant: 'destructive'
      });
      return;
    }
    
    addPathMutation.mutate({
      ...newPathData,
      campaignId,
      points: currentPathPoints,
    });
  };
  
  // Start creating a path
  const startPathCreation = () => {
    setIsCreatingPath(true);
    setCurrentPathPoints([]);
    toast({
      title: 'Creating new path',
      description: 'Click on the map to add points to your path'
    });
  };
  
  // Complete path creation
  const completePathCreation = () => {
    if (currentPathPoints.length < 2) {
      toast({
        title: 'Not enough points',
        description: 'A path requires at least 2 points',
        variant: 'destructive'
      });
      return;
    }
    
    setPathDialogOpen(true);
  };
  
  // Cancel path creation
  const cancelPathCreation = () => {
    setIsCreatingPath(false);
    setCurrentPathPoints([]);
    toast({
      title: 'Path creation cancelled',
    });
  };
  
  // Marker icon types for the dropdown
  const markerTypes = [
    { value: 'town', label: 'Town', icon: <Building className="h-4 w-4 mr-2" /> },
    { value: 'city', label: 'City', icon: <Castle className="h-4 w-4 mr-2" /> },
    { value: 'dungeon', label: 'Dungeon', icon: <Skull className="h-4 w-4 mr-2" /> },
    { value: 'camp', label: 'Camp', icon: <Tent className="h-4 w-4 mr-2" /> },
    { value: 'forest', label: 'Forest', icon: <Trees className="h-4 w-4 mr-2" /> },
    { value: 'mountain', label: 'Mountain', icon: <Mountain className="h-4 w-4 mr-2" /> },
    { value: 'sea', label: 'Sea', icon: <Ship className="h-4 w-4 mr-2" /> },
    { value: 'point_of_interest', label: 'Point of Interest', icon: <Compass className="h-4 w-4 mr-2" /> },
    { value: 'quest', label: 'Quest', icon: <ScrollText className="h-4 w-4 mr-2" /> },
    { value: 'encounter', label: 'Encounter', icon: <Sword className="h-4 w-4 mr-2" /> }
  ];

  return (
    <div className="h-full w-full">
      <div className="relative" style={{ height, width }}>
        <MapContainer 
          center={initialCenter} 
          zoom={initialZoom} 
          style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          attributionControl={false}
          className="map-container z-0"
        >
          {/* Custom parchment-style tile layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Render all markers */}
          {markers.map((marker) => (
            <Marker 
              key={marker.id || `temp-${marker.position.join('-')}`}
              position={marker.position}
              icon={getMarkerIcon(marker.type, marker.discovered)}
              eventHandlers={{
                click: () => {
                  if (editingMode) {
                    setSelectedMarker(marker);
                    setMarkerDialogOpen(true);
                  } else if (onMarkerClick) {
                    onMarkerClick(marker);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-medieval text-lg mb-1">{marker.name}</h3>
                  {marker.description && <p className="text-sm mb-2">{marker.description}</p>}
                  {isDM && marker.notes && (
                    <div className="text-xs p-2 bg-secondary/20 rounded mt-2 italic text-muted-foreground">
                      <strong>DM Notes:</strong> {marker.notes}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Render temporary marker when adding a new one */}
          {newMarkerPosition && editingMode && !markerDialogOpen && (
            <Marker 
              position={newMarkerPosition}
              icon={getMarkerIcon('point_of_interest')}
            >
              <Popup>
                <div className="text-center">
                  <p>New marker position</p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => setMarkerDialogOpen(true)}
                  >
                    Add details
                  </Button>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Render path points when creating a path */}
          {isCreatingPath && currentPathPoints.map((point, index) => (
            <Circle 
              key={`path-point-${index}`}
              center={point}
              radius={200}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.5 }}
            />
          ))}
          
          {/* Render preview of the path being created */}
          {isCreatingPath && currentPathPoints.length > 1 && (
            <Polyline 
              positions={currentPathPoints} 
              pathOptions={{ color: 'blue', weight: 3, dashArray: '5, 5' }}
            />
          )}
          
          {/* Render all existing paths */}
          {paths.map((path) => (
            <Polyline 
              key={path.id}
              positions={path.points}
              pathOptions={{ 
                color: path.type === 'road' ? '#8B4513' : 
                      path.type === 'river' ? '#1E90FF' : 
                      path.type === 'trail' ? '#228B22' : '#000000',
                weight: path.type === 'road' ? 4 : 
                       path.type === 'river' ? 5 : 
                       path.type === 'trail' ? 3 : 2,
                opacity: path.discovered ? 1 : 0.5
              }}
              eventHandlers={{
                click: () => {
                  if (editingMode) {
                    setSelectedPath(path);
                    setPathDialogOpen(true);
                  }
                }
              }}
            />
          ))}
          
          {/* Map controller for event handling */}
          <MapController 
            markers={markers} 
            paths={paths}
            onMapClick={handleMapClick} 
            editingMode={editingMode} 
            selectedMarker={selectedMarker}
            setSelectedMarker={setSelectedMarker}
          />
        </MapContainer>
        
        {/* DM Controls for editing the map */}
        {isDM && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={editingMode ? "default" : "outline"} 
                    size="icon"
                    onClick={() => setEditingMode(!editingMode)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{editingMode ? 'Exit Edit Mode' : 'Edit Map'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {editingMode && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => isCreatingPath ? completePathCreation() : startPathCreation()}
                      >
                        <Waypoints className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isCreatingPath ? 'Finish Path' : 'Add Path'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {isCreatingPath && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={cancelPathCreation}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel Path Creation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          refetchMarkers();
                          refetchPaths();
                          toast({
                            title: 'Map refreshed',
                            description: 'Latest map data loaded'
                          });
                        }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh Map</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Dialog for adding/editing markers */}
      <Dialog open={markerDialogOpen} onOpenChange={setMarkerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMarker ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              {selectedMarker 
                ? 'Update the details for this map location'
                : 'Fill in the details for the new location marker'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  placeholder="Enter location name"
                  value={selectedMarker ? selectedMarker.name : newMarkerData.name}
                  onChange={(e) => {
                    if (selectedMarker) {
                      setSelectedMarker({ ...selectedMarker, name: e.target.value });
                    } else {
                      setNewMarkerData({ ...newMarkerData, name: e.target.value });
                    }
                  }}
                />
              </div>
              
              <div className="col-span-4">
                <Label htmlFor="type">Location Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedMarker ? selectedMarker.type : newMarkerData.type}
                  onChange={(e) => {
                    if (selectedMarker) {
                      setSelectedMarker({ ...selectedMarker, type: e.target.value });
                    } else {
                      setNewMarkerData({ ...newMarkerData, type: e.target.value });
                    }
                  }}
                >
                  {markerTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-4">
                <Label htmlFor="description">Description (Visible to players)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this location..."
                  className="resize-none"
                  rows={3}
                  value={selectedMarker?.description || newMarkerData.description || ''}
                  onChange={(e) => {
                    if (selectedMarker) {
                      setSelectedMarker({ ...selectedMarker, description: e.target.value });
                    } else {
                      setNewMarkerData({ ...newMarkerData, description: e.target.value });
                    }
                  }}
                />
              </div>
              
              <div className="col-span-4">
                <Label htmlFor="notes">DM Notes (Only visible to you)</Label>
                <Textarea
                  id="notes"
                  placeholder="Private notes about this location..."
                  className="resize-none"
                  rows={3}
                  value={selectedMarker?.notes || newMarkerData.notes || ''}
                  onChange={(e) => {
                    if (selectedMarker) {
                      setSelectedMarker({ ...selectedMarker, notes: e.target.value });
                    } else {
                      setNewMarkerData({ ...newMarkerData, notes: e.target.value });
                    }
                  }}
                />
              </div>
              
              <div className="col-span-4 flex items-center space-x-2">
                <Checkbox
                  id="discovered"
                  checked={selectedMarker ? !!selectedMarker.discovered : !!newMarkerData.discovered}
                  onCheckedChange={(checked) => {
                    if (selectedMarker) {
                      setSelectedMarker({ ...selectedMarker, discovered: !!checked });
                    } else {
                      setNewMarkerData({ ...newMarkerData, discovered: !!checked });
                    }
                  }}
                />
                <Label htmlFor="discovered">Visible to players</Label>
              </div>
              
              {selectedMarker && (
                <div className="col-span-4 flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={!!selectedMarker.completed}
                    onCheckedChange={(checked) => {
                      setSelectedMarker({ ...selectedMarker, completed: !!checked });
                    }}
                  />
                  <Label htmlFor="completed">Mark as completed/explored</Label>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            {selectedMarker && (
              <Button
                variant="destructive"
                onClick={handleDeleteMarker}
                disabled={deleteMarkerMutation.isPending}
              >
                Delete Location
              </Button>
            )}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMarkerDialogOpen(false);
                  if (!selectedMarker) {
                    setNewMarkerPosition(null);
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={selectedMarker ? handleUpdateMarker : handleCreateMarker}
                disabled={
                  (selectedMarker ? updateMarkerMutation.isPending : addMarkerMutation.isPending) ||
                  !(selectedMarker ? selectedMarker.name : newMarkerData.name)
                }
              >
                {selectedMarker ? 'Update Location' : 'Add Location'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding/editing paths */}
      <Dialog open={pathDialogOpen} onOpenChange={setPathDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPath ? 'Edit Path' : 'Add New Path'}
            </DialogTitle>
            <DialogDescription>
              {selectedPath 
                ? 'Update the details for this path'
                : `Define details for the new path with ${currentPathPoints.length} points`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="path-name">Path Name</Label>
                <Input
                  id="path-name"
                  placeholder="Enter path name"
                  value={selectedPath ? selectedPath.name : newPathData.name}
                  onChange={(e) => {
                    if (selectedPath) {
                      setSelectedPath({ ...selectedPath, name: e.target.value });
                    } else {
                      setNewPathData({ ...newPathData, name: e.target.value });
                    }
                  }}
                />
              </div>
              
              <div className="col-span-4">
                <Label htmlFor="path-type">Path Type</Label>
                <select
                  id="path-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedPath ? selectedPath.type : newPathData.type}
                  onChange={(e) => {
                    if (selectedPath) {
                      setSelectedPath({ ...selectedPath, type: e.target.value });
                    } else {
                      setNewPathData({ ...newPathData, type: e.target.value });
                    }
                  }}
                >
                  <option value="road">Road</option>
                  <option value="river">River</option>
                  <option value="trail">Trail</option>
                  <option value="border">Border</option>
                </select>
              </div>
              
              <div className="col-span-4">
                <Label htmlFor="path-description">Description</Label>
                <Textarea
                  id="path-description"
                  placeholder="Describe this path..."
                  className="resize-none"
                  rows={3}
                  value={selectedPath?.description || newPathData.description || ''}
                  onChange={(e) => {
                    if (selectedPath) {
                      setSelectedPath({ ...selectedPath, description: e.target.value });
                    } else {
                      setNewPathData({ ...newPathData, description: e.target.value });
                    }
                  }}
                />
              </div>
              
              <div className="col-span-4 flex items-center space-x-2">
                <Checkbox
                  id="path-discovered"
                  checked={selectedPath ? !!selectedPath.discovered : !!newPathData.discovered}
                  onCheckedChange={(checked) => {
                    if (selectedPath) {
                      setSelectedPath({ ...selectedPath, discovered: !!checked });
                    } else {
                      setNewPathData({ ...newPathData, discovered: !!checked });
                    }
                  }}
                />
                <Label htmlFor="path-discovered">Visible to players</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPathDialogOpen(false);
                if (!selectedPath) {
                  // Don't cancel path creation, just close dialog
                  // Allow user to continue adding points
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePath}
              disabled={
                !newPathData.name || currentPathPoints.length < 2 || addPathMutation.isPending
              }
            >
              Add Path
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteractiveMap;