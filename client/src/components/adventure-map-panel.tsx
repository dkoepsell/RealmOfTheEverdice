import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CampaignMap, MapMarker, MapMarkerType } from './campaign-map';
import { DndTextAnalyzer } from './dnd-text-analyzer';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Adventure } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  MapIcon, 
  Compass, 
  Footprints, 
  ScrollText, 
  Crosshair, 
  Skull, 
  Castle, 
  Mountain,
  Flag,
  Ship,
  ChevronRight,
  X,
  Edit,
  Save
} from 'lucide-react';

interface JourneyPath {
  id: string;
  name: string;
  points: [number, number][];
  color: string;
}

interface AdventureMapPanelProps {
  campaignId: number;
  adventureId?: number;
  currentLocation?: [number, number];
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
  readOnly?: boolean;
}

export function AdventureMapPanel({ 
  campaignId, 
  adventureId,
  currentLocation,
  onMarkerClick,
  height = '500px',
  readOnly = false
}: AdventureMapPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedLocation, setSelectedLocation] = useState<MapMarker | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [journeyPaths, setJourneyPaths] = useState<JourneyPath[]>([]);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Fetch adventure data
  const { 
    data: adventure, 
    isLoading: isAdventureLoading 
  } = useQuery<Adventure>({
    queryKey: [`/api/campaigns/${campaignId}/adventures/${adventureId}`],
    enabled: !!campaignId && !!adventureId,
  });

  // Fetch map locations
  const { 
    data: fetchedMarkers, 
    isLoading: isMarkersLoading 
  } = useQuery<MapMarker[]>({
    queryKey: [`/api/campaigns/${campaignId}/map/locations`],
    enabled: !!campaignId,
  });
  
  // Fetch journey paths
  const { 
    data: fetchedPaths, 
    isLoading: isPathsLoading 
  } = useQuery<JourneyPath[]>({
    queryKey: [`/api/campaigns/${campaignId}/map/paths`],
    enabled: !!campaignId,
  });

  // Add location mutation
  const addLocationMutation = useMutation({
    mutationFn: async (marker: Omit<MapMarker, 'id'>) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/map/locations`, marker);
      return res.json();
    },
    onSuccess: (newMarker) => {
      setMarkers(prev => [...prev, newMarker]);
      toast({
        title: 'Location Added',
        description: `${newMarker.name} has been added to your campaign map.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/map/locations`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add location: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (data: { locationId: string; notes: string }) => {
      const res = await apiRequest('PATCH', `/api/campaigns/${campaignId}/map/locations/${data.locationId}`, {
        notes: data.notes
      });
      return res.json();
    },
    onSuccess: (updatedMarker) => {
      setMarkers(prev => prev.map(marker => 
        marker.id === updatedMarker.id ? updatedMarker : marker
      ));
      setIsEditingNote(false);
      toast({
        title: 'Notes Updated',
        description: `Your notes for ${updatedMarker.name} have been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update notes: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update markers when data is fetched
  useEffect(() => {
    if (fetchedMarkers) {
      setMarkers(fetchedMarkers);
    }
  }, [fetchedMarkers]);

  // Update paths when data is fetched
  useEffect(() => {
    if (fetchedPaths) {
      setJourneyPaths(fetchedPaths);
    }
  }, [fetchedPaths]);

  // Handle marker click
  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedLocation(marker);
    setNoteText(marker.notes || '');
    setActiveTab('location');
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  // Handle adding a new marker
  const handleAddMarker = (marker: Omit<MapMarker, 'id'>) => {
    addLocationMutation.mutate(marker);
  };

  // Handle saving notes
  const handleSaveNotes = () => {
    if (selectedLocation) {
      updateNotesMutation.mutate({
        locationId: selectedLocation.id,
        notes: noteText
      });
    }
  };

  // Determine if we're still loading data
  const isLoading = isAdventureLoading || isMarkersLoading || isPathsLoading;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <span>Adventure Map</span>
          </CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-9">
            <TabsList className="h-8">
              <TabsTrigger value="map" className="h-7 px-3">
                <MapIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="h-7 px-3" disabled={!selectedLocation}>
                <Compass className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Location</span>
              </TabsTrigger>
              <TabsTrigger value="journey" className="h-7 px-3">
                <Footprints className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Journey</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>
          {activeTab === 'map' && 'Explore the campaign world and discover new locations'}
          {activeTab === 'location' && selectedLocation && `Details about ${selectedLocation.name}`}
          {activeTab === 'journey' && 'Track your adventure path across the realm'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow p-0">
        <TabsContent value="map" className="h-full m-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Compass className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
                <p>Loading map...</p>
              </div>
            </div>
          ) : (
            <CampaignMap 
              markers={markers}
              paths={journeyPaths}
              campaignId={campaignId}
              currentLocation={currentLocation}
              onMarkerClick={handleMarkerClick}
              onMarkerAdd={!readOnly ? handleAddMarker : undefined}
              height={height}
              readOnly={readOnly}
            />
          )}
        </TabsContent>

        <TabsContent value="location" className="h-full m-0 border-0">
          {selectedLocation ? (
            <div className="h-full flex flex-col">
              <div className="flex items-start p-4 border-b">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-muted">
                      {selectedLocation.type === 'town' && <Castle className="h-5 w-5 text-blue-600" />}
                      {selectedLocation.type === 'city' && <Castle className="h-5 w-5 text-purple-700" />}
                      {selectedLocation.type === 'dungeon' && <Skull className="h-5 w-5 text-red-600" />}
                      {selectedLocation.type === 'battle' && <Crosshair className="h-5 w-5 text-orange-600" />}
                      {selectedLocation.type === 'quest' && <Flag className="h-5 w-5 text-amber-500" />}
                      {selectedLocation.type === 'landmark' && <Mountain className="h-5 w-5 text-green-700" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
                      <Badge variant="outline" className="capitalize">{selectedLocation.type}</Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setSelectedLocation(null);
                    setActiveTab('map');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-grow p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Description</h4>
                    <div className="text-sm">
                      <DndTextAnalyzer text={selectedLocation.description} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm uppercase text-muted-foreground">Notes</h4>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setIsEditingNote(!isEditingNote)}
                        >
                          {isEditingNote ? <Save className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                    
                    {isEditingNote ? (
                      <div className="space-y-2">
                        <Input
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add your notes about this location..."
                          className="text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingNote(false);
                              setNoteText(selectedLocation.notes || '');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveNotes}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm border rounded-md p-3 bg-muted/30 min-h-[80px]">
                        {selectedLocation.notes || 'No notes yet. Click the edit button to add your thoughts.'}
                      </div>
                    )}
                  </div>

                  {selectedLocation.quests && selectedLocation.quests.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Quests</h4>
                      <ul className="space-y-2">
                        {selectedLocation.quests.map(quest => (
                          <li key={quest.id} className="text-sm border rounded-md p-2 flex items-center">
                            <ScrollText className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                            <span>{quest.name}</span>
                            <Badge variant={quest.completed ? "success" : "outline"} className="ml-auto">
                              {quest.completed ? "Completed" : "Active"}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <Compass className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>Select a location on the map to view details</p>
                <Button 
                  variant="link" 
                  className="mt-2" 
                  onClick={() => setActiveTab('map')}
                >
                  Return to Map
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="journey" className="h-full m-0 flex items-center justify-center">
          <div className="text-center p-4">
            <Footprints className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Adventure Journey</h3>
            <p className="text-muted-foreground mb-4">
              Track your party's path across the realm as you complete your adventure.
            </p>
            {journeyPaths.length > 0 ? (
              <div className="text-left">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-2">
                  Current Journey Paths
                </h4>
                <ul className="space-y-2">
                  {journeyPaths.map(path => (
                    <li key={path.id} className="flex items-center border rounded-md p-2">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: path.color }}
                      ></div>
                      <span>{path.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-auto h-6 w-6"
                        onClick={() => setActiveTab('map')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setActiveTab('map')}>
                View Map
              </Button>
            )}
          </div>
        </TabsContent>
      </CardContent>

      <CardFooter className="pt-2 justify-between">
        <div className="text-xs text-muted-foreground">
          {adventure?.title || 'Campaign World Map'}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Compass className="h-3 w-3 mr-1" />
          <span>{markers.length} Locations</span>
        </div>
      </CardFooter>
    </Card>
  );
}