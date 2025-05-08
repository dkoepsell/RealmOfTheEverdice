import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline,
  useMap,
  Circle,
  useMapEvents,
  ZoomControl,
  ImageOverlay
} from 'react-leaflet';
import { 
  DivIcon, 
  LatLngExpression,
  LatLng,
  Icon,
  LeafletMouseEvent
} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Map, 
  MapPin, 
  Flag, 
  Compass, 
  Castle, 
  Home, 
  Mountain, 
  Skull, 
  Trees, 
  Building, 
  Tent, 
  Waves, 
  ShoppingBag, 
  BookOpen,
  Route,
  Trash2,
  PlusCircle,
  Edit2,
  Eye,
  EyeOff,
  Check,
  X,
  Settings2
} from 'lucide-react';

// Default latitude/longitude for map center if none is provided
const DEFAULT_CENTER: LatLngExpression = [51.505, -0.09];
const DEFAULT_ZOOM = 7;

// Map location types and their icons
const LOCATION_TYPES = [
  { value: 'city', label: 'City', icon: <Building className="h-4 w-4" /> },
  { value: 'town', label: 'Town', icon: <Home className="h-4 w-4" /> },
  { value: 'village', label: 'Village', icon: <Tent className="h-4 w-4" /> },
  { value: 'dungeon', label: 'Dungeon', icon: <Skull className="h-4 w-4" /> },
  { value: 'castle', label: 'Castle', icon: <Castle className="h-4 w-4" /> },
  { value: 'forest', label: 'Forest', icon: <Trees className="h-4 w-4" /> },
  { value: 'mountain', label: 'Mountain', icon: <Mountain className="h-4 w-4" /> },
  { value: 'water', label: 'Water', icon: <Waves className="h-4 w-4" /> },
  { value: 'market', label: 'Market', icon: <ShoppingBag className="h-4 w-4" /> },
  { value: 'library', label: 'Library', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'point_of_interest', label: 'Point of Interest', icon: <MapPin className="h-4 w-4" /> },
  { value: 'quest', label: 'Quest Location', icon: <Flag className="h-4 w-4" /> },
];

// Get location icon based on type
const getLocationIcon = (type: string) => {
  const locationType = LOCATION_TYPES.find(t => t.value === type);
  return locationType?.icon || <MapPin className="h-4 w-4" />;
};

// Path colors for different types of journeys
const PATH_COLORS = {
  main: '#4338ca', // Primary quest
  side: '#ca8a04', // Side quest
  traveled: '#10b981', // Already traveled
  planned: '#6b7280', // Planned journey
};

// Custom marker icons
const createMarkerIcon = (type: string, discovered: boolean, completed: boolean) => {
  let className = 'flex items-center justify-center rounded-full w-8 h-8 text-white';
  
  // Base background color by type
  let backgroundColor = '#1e293b'; // default
  if (type === 'city' || type === 'town' || type === 'village') backgroundColor = '#0e7490';
  if (type === 'dungeon' || type === 'castle') backgroundColor = '#9f1239';
  if (type === 'forest' || type === 'mountain' || type === 'water') backgroundColor = '#166534';
  if (type === 'market' || type === 'library') backgroundColor = '#7e22ce';
  if (type === 'quest') backgroundColor = '#ca8a04';
  
  // Modify for status
  if (!discovered) {
    className += ' opacity-50';
    backgroundColor = '#1e293b'; // undiscovered locations are greyed out
  }
  if (completed) {
    className += ' ring-2 ring-green-500';
  }
  
  // Create HTML element for the marker
  const html = `
    <div class="${className}" style="background-color: ${backgroundColor};">
      ${type === 'city' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>' : ''}
      ${type === 'town' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' : ''}
      ${type === 'village' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M19 20V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v15"/><path d="M2 20h20"/><path d="M14 4v6"></path><path d="M10 4v6"></path><path d="M12 7v12"></path></svg>' : ''}
      ${type === 'dungeon' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>' : ''}
      ${type === 'castle' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M11 17v4h4v-4h5V11a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3H6a2 2 0 0 0-2 2v0a2 2 0 0 0-2 2h13"/><path d="M4 17h17"/></svg>' : ''}
      ${type === 'quest' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' : ''}
      ${type === 'point_of_interest' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' : ''}
      ${type === 'forest' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M7 14c-1.7-3 1.7-7.7 5-8 3.3-.3 6 3 6 7"/><path d="M16 19c1.7 0 3-1.3 3-3 0-2.4-3-2.7-3-6.4 0-3.3-3-5.5-6-4.8-3 .7-4.7 4-4 7 .7 3 3 3.4 3 6.4 0 1.7 1.3 3 3 3Z"/><path d="M7 22V13"/><path d="M17 22v-7"/><path d="M12 22v-3"/></svg>' : ''}
      ${type === 'mountain' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>' : ''}
      ${type === 'water' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M2 12h20"/><path d="M5 12v2c0 1.7 3.3 3 7 3s7-1.3 7-3v-2"/><path d="M19 6c-1.4 0-3 .5-4 2-1-1.5-2.6-2-4-2s-3 .5-4 2c-1-1.5-2.6-2-4-2C1.4 6 0 7.5 0 9.5V10c0 1.7 3.3 3 7 3s7-1.3 7-3 3.3-3 7-3 7 1.3 7 3v2"/></svg>' : ''}
      ${type === 'market' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>' : ''}
      ${type === 'library' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m2 3 10 10L22 3"/><path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M12 15v6"/><path d="M12 3v9"/></svg>' : ''}
    </div>
  `;
  
  return new DivIcon({
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: ''
  });
};

// Interface for Location
interface MapLocation {
  id: string;
  campaignId: number;
  name: string;
  type: string;
  position: [number, number];
  description?: string | null;
  discovered?: boolean;
  completed?: boolean;
  notes?: string | null;
  iconUrl?: string | null;
  quests?: {
    id: number;
    name: string;
    completed: boolean;
  }[];
}

// Interface for Journey Path
interface JourneyPath {
  id: string;
  campaignId: number;
  name: string;
  points: [number, number][];
  type: string;
  status: string;
  description?: string | null;
  distance?: number | null;
  dangers?: string | null;
  travelTime?: string | null;
}

// Interface for the props
interface AdventureMapPanelProps {
  campaignId: number;
  isDm: boolean;
  onLocationClick?: (location: MapLocation) => void;
}

// Helper component to update map view when center changes
function ChangeMapView({ center, zoom }: { center: LatLngExpression, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Map Events Handler component
function MapEventsHandler({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

export function AdventureMapPanel({ 
  campaignId, 
  isDm = false,
  onLocationClick 
}: AdventureMapPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedTab, setSelectedTab] = useState('locations');
  const [editingLocation, setEditingLocation] = useState<MapLocation | null>(null);
  const [newLocation, setNewLocation] = useState<Partial<MapLocation> | null>(null);
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null);
  const [editingPath, setEditingPath] = useState<JourneyPath | null>(null);
  const [newPath, setNewPath] = useState<Partial<JourneyPath> | null>(null);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number][]>([]);
  const [showDiscoveredOnly, setShowDiscoveredOnly] = useState(false);
  const [worldMap, setWorldMap] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch campaign map locations
  const locationsQuery = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/map/locations`],
    enabled: !!campaignId
  });
  
  // Fetch campaign journey paths
  const pathsQuery = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/map/paths`],
    enabled: !!campaignId
  });
  
  // Location mutations
  const addLocationMutation = useMutation({
    mutationFn: async (location: Partial<MapLocation>) => {
      const response = await apiRequest('POST', `/api/campaigns/${campaignId}/map/locations`, location);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location added",
        description: "New location has been added to the map",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/locations`] });
      setNewLocation(null);
      setClickedPosition(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add location",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<MapLocation> }) => {
      const response = await apiRequest('PATCH', `/api/campaigns/${campaignId}/map/locations/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location updated",
        description: "Location has been updated on the map",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/locations`] });
      setEditingLocation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update location",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/campaigns/${campaignId}/map/locations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Location deleted",
        description: "Location has been removed from the map",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/locations`] });
      setEditingLocation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete location",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Path mutations
  const addPathMutation = useMutation({
    mutationFn: async (path: Partial<JourneyPath>) => {
      const response = await apiRequest('POST', `/api/campaigns/${campaignId}/map/paths`, path);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Path added",
        description: "New journey path has been added to the map",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/paths`] });
      setNewPath(null);
      setCurrentPathPoints([]);
      setIsDrawingPath(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add path",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updatePathMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<JourneyPath> }) => {
      const response = await apiRequest('PATCH', `/api/campaigns/${campaignId}/map/paths/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Path updated",
        description: "Journey path has been updated on the map",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/paths`] });
      setEditingPath(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update path",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deletePathMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/campaigns/${campaignId}/map/paths/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Path deleted",
        description: "Journey path has been removed from the map",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/paths`] });
      setEditingPath(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete path",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Get all locations
  const locations: MapLocation[] = Array.isArray(locationsQuery.data) ? locationsQuery.data : [];
  
  // Get all paths
  const journeyPaths: JourneyPath[] = Array.isArray(pathsQuery.data) ? pathsQuery.data : [];
  
  // Fetch world map from the API
  useEffect(() => {
    async function fetchWorldMap() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/campaigns/${campaignId}/world-map`);
        if (response.ok) {
          const data = await response.json();
          console.log("World map data:", data); // Debug log
          if (data && data.mapUrl) {
            setWorldMap(data.mapUrl);
          } else if (data && typeof data === 'object' && 'url' in data) {
            // Handle alternative response format
            setWorldMap(data.url);
          } else {
            console.error("Invalid world map data format:", data);
          }
        } else {
          console.error("Failed to fetch world map:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching world map:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (campaignId && isOpen) {
      fetchWorldMap();
    }
  }, [campaignId, isOpen]);
  
  // Filter locations based on discovered status (for player view)
  const filteredLocations = showDiscoveredOnly && !isDm
    ? locations.filter(location => location.discovered)
    : locations;
  
  // Function to handle map clicks
  const handleMapClick = (e: LeafletMouseEvent) => {
    if (isDm) {
      if (isDrawingPath) {
        // Add point to current path
        const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        setCurrentPathPoints(prev => [...prev, newPoint]);
      } else {
        // Set clicked position for adding a new location
        setClickedPosition([e.latlng.lat, e.latlng.lng]);
        setNewLocation({
          campaignId,
          name: '',
          type: 'point_of_interest',
          position: [e.latlng.lat, e.latlng.lng],
          discovered: true
        });
      }
    }
  };
  
  // Handle saving a new location
  const handleSaveNewLocation = () => {
    if (newLocation) {
      addLocationMutation.mutate(newLocation);
    }
  };
  
  // Handle updating an existing location
  const handleUpdateLocation = () => {
    if (editingLocation) {
      updateLocationMutation.mutate({
        id: editingLocation.id,
        updates: editingLocation
      });
    }
  };
  
  // Handle deleting a location
  const handleDeleteLocation = () => {
    if (editingLocation && confirm("Are you sure you want to delete this location?")) {
      deleteLocationMutation.mutate(editingLocation.id);
    }
  };
  
  // Start path drawing mode
  const startDrawingPath = () => {
    setIsDrawingPath(true);
    setCurrentPathPoints([]);
    setNewPath({
      campaignId,
      name: '',
      type: 'main',
      status: 'planned',
      points: []
    });
  };
  
  // Save the drawn path
  const saveNewPath = () => {
    if (newPath && currentPathPoints.length >= 2) {
      addPathMutation.mutate({
        ...newPath,
        points: currentPathPoints
      });
    } else {
      toast({
        title: "Cannot save path",
        description: "A path must have at least 2 points",
        variant: "destructive",
      });
    }
  };
  
  // Cancel path drawing
  const cancelDrawingPath = () => {
    setIsDrawingPath(false);
    setCurrentPathPoints([]);
    setNewPath(null);
  };
  
  // Update existing path
  const handleUpdatePath = () => {
    if (editingPath) {
      updatePathMutation.mutate({
        id: editingPath.id,
        updates: editingPath
      });
    }
  };
  
  // Delete existing path
  const handleDeletePath = () => {
    if (editingPath && confirm("Are you sure you want to delete this path?")) {
      deletePathMutation.mutate(editingPath.id);
    }
  };
  
  // Get color for path based on type and status
  const getPathColor = (type: string, status: string) => {
    if (status === 'traveled') return PATH_COLORS.traveled;
    if (type === 'main') return PATH_COLORS.main;
    if (type === 'side') return PATH_COLORS.side;
    return PATH_COLORS.planned;
  };
  
  // Calculate path distance in miles (approximate)
  const calculatePathDistance = (points: [number, number][]) => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const from = new LatLng(points[i-1][0], points[i-1][1]);
      const to = new LatLng(points[i][0], points[i][1]);
      totalDistance += from.distanceTo(to);
    }
    
    // Convert meters to miles (rough approximation)
    return Math.round(totalDistance / 1609.34);
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="h-8 w-8"
            >
              <Map className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Adventure Map</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Adventure Map</DialogTitle>
            <DialogDescription>
              Explore locations and plan your journey in this campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Left panel: Map */}
            <div className="flex-1 h-[60vh] relative border rounded-md overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%', background: '#2a3b47' }}
                zoomControl={false}
                className="fantasy-map-container border-4 border-amber-800/50 rounded-lg shadow-inner"
              >
                {/* Fantasy Map Image Overlay */}
                {worldMap ? (
                  <ImageOverlay
                    url={worldMap}
                    bounds={[[-85, -180], [85, 180]]}
                    opacity={1.0}
                    zIndex={10}
                  />
                ) : (
                  <ImageOverlay
                    url="https://cdna.artstation.com/p/assets/images/images/018/066/339/large/anastasia-shabalina-.jpg"
                    bounds={[[-85, -180], [85, 180]]}
                    opacity={0.8}
                    zIndex={10}
                  />
                )}
                
                {/* Fallback map tiles that show through in areas without fantasy map coverage */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  className="blend-multiply"
                />
                <ZoomControl position="bottomright" />
                <ChangeMapView center={mapCenter} zoom={zoom} />
                
                {/* Display markers for each location */}
                {filteredLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={location.position}
                    icon={createMarkerIcon(location.type, !!location.discovered, !!location.completed)}
                    eventHandlers={{
                      click: () => {
                        if (onLocationClick) {
                          onLocationClick(location);
                        }
                        if (isDm) {
                          setEditingLocation(location);
                        }
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-bold text-base">{location.name}</h3>
                        <div className="text-xs flex items-center text-muted-foreground mb-1">
                          {getLocationIcon(location.type)}
                          <span className="ml-1 capitalize">{location.type.replace('_', ' ')}</span>
                        </div>
                        {location.description && (
                          <p className="text-sm mb-2">{location.description}</p>
                        )}
                        {location.quests && location.quests.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-semibold">Quests:</h4>
                            <ul className="text-xs list-disc pl-4">
                              {location.quests.map(quest => (
                                <li key={quest.id} className={quest.completed ? 'line-through' : ''}>
                                  {quest.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {isDm && (
                          <div className="flex justify-end mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingLocation(location)}
                              className="text-xs h-7"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Display journey paths */}
                {journeyPaths.map((path) => (
                  <Polyline
                    key={path.id}
                    positions={path.points}
                    color={getPathColor(path.type, path.status)}
                    weight={4}
                    opacity={0.8}
                    eventHandlers={{
                      click: () => {
                        if (isDm) {
                          setEditingPath(path);
                        }
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-bold text-base">{path.name}</h3>
                        <div className="text-xs flex items-center text-muted-foreground mb-1">
                          <Route className="h-4 w-4 mr-1" />
                          <span>
                            {path.status === 'traveled' ? 'Traveled' : 'Planned'} •{' '}
                            {path.distance ?? calculatePathDistance(path.points)} miles
                          </span>
                        </div>
                        {path.description && (
                          <p className="text-sm">{path.description}</p>
                        )}
                        {path.dangers && (
                          <div className="mt-1">
                            <span className="text-xs font-medium">Dangers:</span>
                            <p className="text-xs text-red-500">{path.dangers}</p>
                          </div>
                        )}
                        {isDm && (
                          <div className="flex justify-end mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingPath(path)}
                              className="text-xs h-7"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Polyline>
                ))}
                
                {/* Show current drawing path points */}
                {isDrawingPath && currentPathPoints.length > 0 && (
                  <Polyline
                    positions={currentPathPoints}
                    color="#3b82f6"
                    weight={4}
                    dashArray="5, 10"
                    opacity={0.8}
                  />
                )}
                
                {/* Show temp marker for clicked position */}
                {clickedPosition && (
                  <Marker position={clickedPosition}>
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-bold text-sm">New Location</h3>
                        <p className="text-xs">Click to add details</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Map event handler */}
                <MapEventsHandler onClick={handleMapClick} />
              </MapContainer>
              
              {/* Map controls overlay */}
              <div className="absolute top-2 right-2 z-[1000] flex flex-col space-y-2">
                {!isDm && (
                  <div className="bg-background p-2 rounded-md shadow-md flex items-center">
                    <Label htmlFor="show-discovered" className="text-xs mr-2">
                      Show discovered only
                    </Label>
                    <Switch
                      id="show-discovered"
                      checked={showDiscoveredOnly}
                      onCheckedChange={setShowDiscoveredOnly}
                    />
                  </div>
                )}
                
                {isDm && (
                  <>
                    {isDrawingPath ? (
                      <div className="bg-background p-2 rounded-md shadow-md space-y-2">
                        <p className="text-xs text-center font-semibold">Drawing Path</p>
                        <p className="text-xs text-muted-foreground text-center">
                          Click map to add points ({currentPathPoints.length} points)
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={cancelDrawingPath}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={saveNewPath}
                            disabled={currentPathPoints.length < 2}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-background p-2 rounded-md shadow-md space-y-2">
                        <Button size="sm" className="w-full" onClick={startDrawingPath}>
                          <Route className="h-4 w-4 mr-1" />
                          Draw Path
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Right panel: Details */}
            <div className="w-1/3 ml-4 overflow-y-auto">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="journeys">Journeys</TabsTrigger>
                </TabsList>
                
                {/* Locations tab */}
                <TabsContent value="locations" className="space-y-4">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <Card key={location.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardHeader className="p-3 pb-2" onClick={() => {
                          setMapCenter(location.position);
                          setZoom(10);
                          if (onLocationClick) onLocationClick(location);
                          if (isDm) setEditingLocation(location);
                        }}>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base flex items-center">
                                {getLocationIcon(location.type)}
                                <span className="ml-2">{location.name}</span>
                                {!location.discovered && !isDm && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Undiscovered
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs capitalize">
                                {location.type.replace('_', ' ')} • {location.position[0].toFixed(2)}, {location.position[1].toFixed(2)}
                              </CardDescription>
                            </div>
                            {location.completed && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        {location.description && (
                          <CardContent className="px-3 py-2">
                            <p className="text-sm line-clamp-2">{location.description}</p>
                          </CardContent>
                        )}
                        {location.quests && location.quests.length > 0 && (
                          <CardFooter className="px-3 py-2 pt-0 flex-col items-start">
                            <div className="w-full">
                              <span className="text-xs font-medium">Quests:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {location.quests.map(quest => (
                                  <Badge key={quest.id} variant={quest.completed ? "secondary" : "outline"} className="text-xs">
                                    {quest.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardFooter>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-6 border border-dashed rounded-lg">
                      <MapPin className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-1">No locations found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isDm 
                          ? "Click on the map to add locations to your campaign." 
                          : "The DM hasn't added any locations yet."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Journeys tab */}
                <TabsContent value="journeys" className="space-y-4">
                  {journeyPaths.length > 0 ? (
                    journeyPaths.map((path) => (
                      <Card key={path.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardHeader 
                          className="p-3 pb-2"
                          onClick={() => {
                            // Center map at the middle point of the path
                            if (path.points.length > 0) {
                              const midIndex = Math.floor(path.points.length / 2);
                              setMapCenter(path.points[midIndex]);
                              setZoom(9);
                            }
                            if (isDm) setEditingPath(path);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base flex items-center">
                                <Route className="h-4 w-4 mr-2" />
                                <span>{path.name}</span>
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {path.status === 'traveled' ? 'Traveled' : 'Planned'} • {path.type} • {path.distance ?? calculatePathDistance(path.points)} miles
                              </CardDescription>
                            </div>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getPathColor(path.type, path.status) }}
                            />
                          </div>
                        </CardHeader>
                        {path.description && (
                          <CardContent className="px-3 py-2">
                            <p className="text-sm line-clamp-2">{path.description}</p>
                          </CardContent>
                        )}
                        <CardFooter className="px-3 py-2 pt-0">
                          <div className="w-full flex justify-between items-center">
                            {path.dangers ? (
                              <span className="text-xs text-red-500">{path.dangers}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No known dangers</span>
                            )}
                            {path.travelTime && (
                              <span className="text-xs font-medium">{path.travelTime}</span>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-6 border border-dashed rounded-lg">
                      <Route className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-1">No journey paths found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isDm 
                          ? "Click the 'Draw Path' button to create journey routes." 
                          : "The DM hasn't created any journey paths yet."}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Edit Location Dialog */}
          <Dialog 
            open={!!editingLocation} 
            onOpenChange={(open) => !open && setEditingLocation(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Location</DialogTitle>
                <DialogDescription>
                  Update details for this map location.
                </DialogDescription>
              </DialogHeader>
              
              {editingLocation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editingLocation.name}
                        onChange={(e) => setEditingLocation({
                          ...editingLocation,
                          name: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={editingLocation.type}
                        onValueChange={(value) => setEditingLocation({
                          ...editingLocation,
                          type: value
                        })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                {type.icon}
                                <span className="ml-2">{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingLocation.description || ''}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        description: e.target.value
                      })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (DM Only)</Label>
                    <Textarea
                      id="notes"
                      value={editingLocation.notes || ''}
                      onChange={(e) => setEditingLocation({
                        ...editingLocation,
                        notes: e.target.value
                      })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="discovered"
                        checked={!!editingLocation.discovered}
                        onCheckedChange={(checked) => setEditingLocation({
                          ...editingLocation,
                          discovered: checked
                        })}
                      />
                      <Label htmlFor="discovered">Discovered by players</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="completed"
                        checked={!!editingLocation.completed}
                        onCheckedChange={(checked) => setEditingLocation({
                          ...editingLocation,
                          completed: checked
                        })}
                      />
                      <Label htmlFor="completed">Completed</Label>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter className="flex sm:justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDeleteLocation}
                  disabled={deleteLocationMutation.isPending}
                >
                  {deleteLocationMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingLocation(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateLocation}
                    disabled={updateLocationMutation.isPending}
                  >
                    {updateLocationMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* New Location Dialog */}
          <Dialog 
            open={!!newLocation} 
            onOpenChange={(open) => !open && setNewLocation(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Add details for the new location.
                </DialogDescription>
              </DialogHeader>
              
              {newLocation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Name</Label>
                      <Input
                        id="new-name"
                        value={newLocation.name || ''}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          name: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-type">Type</Label>
                      <Select
                        value={newLocation.type || 'point_of_interest'}
                        onValueChange={(value) => setNewLocation({
                          ...newLocation,
                          type: value
                        })}
                      >
                        <SelectTrigger id="new-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                {type.icon}
                                <span className="ml-2">{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-description">Description</Label>
                    <Textarea
                      id="new-description"
                      value={newLocation.description || ''}
                      onChange={(e) => setNewLocation({
                        ...newLocation,
                        description: e.target.value
                      })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-notes">Notes (DM Only)</Label>
                    <Textarea
                      id="new-notes"
                      value={newLocation.notes || ''}
                      onChange={(e) => setNewLocation({
                        ...newLocation,
                        notes: e.target.value
                      })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="new-discovered"
                        checked={!!newLocation.discovered}
                        onCheckedChange={(checked) => setNewLocation({
                          ...newLocation,
                          discovered: checked
                        })}
                      />
                      <Label htmlFor="new-discovered">Discovered by players</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="new-completed"
                        checked={!!newLocation.completed}
                        onCheckedChange={(checked) => setNewLocation({
                          ...newLocation,
                          completed: checked
                        })}
                      />
                      <Label htmlFor="new-completed">Completed</Label>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewLocation(null);
                    setClickedPosition(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNewLocation}
                  disabled={
                    addLocationMutation.isPending || 
                    !newLocation?.name
                  }
                >
                  {addLocationMutation.isPending ? 'Adding...' : 'Add Location'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Path Dialog */}
          <Dialog 
            open={!!editingPath} 
            onOpenChange={(open) => !open && setEditingPath(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Journey Path</DialogTitle>
                <DialogDescription>
                  Update details for this journey path.
                </DialogDescription>
              </DialogHeader>
              
              {editingPath && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="path-name">Name</Label>
                      <Input
                        id="path-name"
                        value={editingPath.name}
                        onChange={(e) => setEditingPath({
                          ...editingPath,
                          name: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="path-type">Type</Label>
                      <Select
                        value={editingPath.type}
                        onValueChange={(value) => setEditingPath({
                          ...editingPath,
                          type: value
                        })}
                      >
                        <SelectTrigger id="path-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.main }} />
                              <span>Main Quest</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="side">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.side }} />
                              <span>Side Quest</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="other">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.planned }} />
                              <span>Other Journey</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="path-status">Status</Label>
                    <Select
                      value={editingPath.status}
                      onValueChange={(value) => setEditingPath({
                        ...editingPath,
                        status: value
                      })}
                    >
                      <SelectTrigger id="path-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">
                          <div className="flex items-center">
                            <Route className="h-4 w-4 mr-2" />
                            <span>Planned (Not yet traveled)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="traveled">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.traveled }} />
                            <span>Traveled (Completed)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="path-description">Description</Label>
                    <Textarea
                      id="path-description"
                      value={editingPath.description || ''}
                      onChange={(e) => setEditingPath({
                        ...editingPath,
                        description: e.target.value
                      })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="path-distance">Distance (miles)</Label>
                      <Input
                        id="path-distance"
                        type="number"
                        value={editingPath.distance || calculatePathDistance(editingPath.points)}
                        onChange={(e) => setEditingPath({
                          ...editingPath,
                          distance: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="path-time">Travel Time</Label>
                      <Input
                        id="path-time"
                        value={editingPath.travelTime || ''}
                        onChange={(e) => setEditingPath({
                          ...editingPath,
                          travelTime: e.target.value
                        })}
                        placeholder="e.g. 3 days"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="path-dangers">Dangers or Hazards</Label>
                    <Textarea
                      id="path-dangers"
                      value={editingPath.dangers || ''}
                      onChange={(e) => setEditingPath({
                        ...editingPath,
                        dangers: e.target.value
                      })}
                      rows={2}
                      placeholder="Describe potential dangers along this path"
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter className="flex sm:justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDeletePath}
                  disabled={deletePathMutation.isPending}
                >
                  {deletePathMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingPath(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePath}
                    disabled={updatePathMutation.isPending}
                  >
                    {updatePathMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* New Path Dialog */}
          <Dialog 
            open={isDrawingPath && currentPathPoints.length >= 2} 
            onOpenChange={(open) => !open && cancelDrawingPath()}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Journey Path</DialogTitle>
                <DialogDescription>
                  Add details for the new path.
                </DialogDescription>
              </DialogHeader>
              
              {newPath && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-path-name">Name</Label>
                      <Input
                        id="new-path-name"
                        value={newPath.name || ''}
                        onChange={(e) => setNewPath({
                          ...newPath,
                          name: e.target.value
                        })}
                        placeholder="e.g. Journey to Elvendale"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-path-type">Type</Label>
                      <Select
                        value={newPath.type || 'main'}
                        onValueChange={(value) => setNewPath({
                          ...newPath,
                          type: value
                        })}
                      >
                        <SelectTrigger id="new-path-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.main }} />
                              <span>Main Quest</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="side">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.side }} />
                              <span>Side Quest</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="other">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.planned }} />
                              <span>Other Journey</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-path-status">Status</Label>
                    <Select
                      value={newPath.status || 'planned'}
                      onValueChange={(value) => setNewPath({
                        ...newPath,
                        status: value
                      })}
                    >
                      <SelectTrigger id="new-path-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">
                          <div className="flex items-center">
                            <Route className="h-4 w-4 mr-2" />
                            <span>Planned (Not yet traveled)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="traveled">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PATH_COLORS.traveled }} />
                            <span>Traveled (Completed)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-path-description">Description</Label>
                    <Textarea
                      id="new-path-description"
                      value={newPath.description || ''}
                      onChange={(e) => setNewPath({
                        ...newPath,
                        description: e.target.value
                      })}
                      rows={2}
                      placeholder="Describe this journey path"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-path-distance">
                        Distance (miles)
                      </Label>
                      <Input
                        id="new-path-distance"
                        type="number"
                        value={newPath.distance || calculatePathDistance(currentPathPoints)}
                        onChange={(e) => setNewPath({
                          ...newPath,
                          distance: parseFloat(e.target.value)
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Calculated: ~{calculatePathDistance(currentPathPoints)} miles
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-path-time">Travel Time</Label>
                      <Input
                        id="new-path-time"
                        value={newPath.travelTime || ''}
                        onChange={(e) => setNewPath({
                          ...newPath,
                          travelTime: e.target.value
                        })}
                        placeholder="e.g. 3 days"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-path-dangers">Dangers or Hazards</Label>
                    <Textarea
                      id="new-path-dangers"
                      value={newPath.dangers || ''}
                      onChange={(e) => setNewPath({
                        ...newPath,
                        dangers: e.target.value
                      })}
                      rows={2}
                      placeholder="Describe potential dangers along this path"
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={cancelDrawingPath}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewPath}
                  disabled={
                    addPathMutation.isPending || 
                    !newPath?.name || 
                    currentPathPoints.length < 2
                  }
                >
                  {addPathMutation.isPending ? 'Adding...' : 'Add Path'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}