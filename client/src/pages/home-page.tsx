import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import CampaignsDashboard from "@/components/campaigns-dashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Character } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Sword } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch user's characters
  const { 
    data: characters, 
    isLoading: charactersLoading 
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!user
  });
  
  const handleCharacterClick = (characterId: number) => {
    navigate(`/characters/${characterId}`);
  };
  
  const renderCharacters = () => {
    if (charactersLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-accent/20 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-accent/20 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-accent/10 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-accent/20 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (!characters || characters.length === 0) {
      return (
        <div className="text-center py-10">
          <Sword className="mx-auto h-12 w-12 text-accent/50 mb-4" />
          <h3 className="text-xl font-medieval mb-2">No Characters Yet</h3>
          <p className="text-muted-foreground mb-6">You haven't created any characters yet.</p>
          <Button onClick={() => navigate("/characters/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Character
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => (
          <Card key={character.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <CardTitle>{character.name}</CardTitle>
              <CardDescription>
                Level {character.level} {character.race} {character.class}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span className="font-medieval">Health</span>
                <span>{character.hp} / {character.maxHp}</span>
              </div>
              <div className="w-full bg-darkBrown/20 rounded-full h-2 mb-4">
                <div 
                  className="bg-success rounded-full h-2" 
                  style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                ></div>
              </div>
              <p className="line-clamp-2 text-sm italic">
                {character.backstory ? character.backstory.substring(0, 100) + "..." : "No backstory available."}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => handleCharacterClick(character.id)}
              >
                <Users className="mr-2 h-4 w-4" /> View Character
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {/* Create New Character Card */}
        <Card className="cursor-pointer border-dashed border-accent/50 hover:border-accent transition-colors">
          <CardHeader className="pb-2">
            <CardTitle>Create New Character</CardTitle>
            <CardDescription>Build a new hero</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Plus className="h-12 w-12 text-accent/50 mb-2" />
            <p className="text-center text-muted-foreground">
              Create a new character for your adventures
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/characters/create")}
            >
              <Plus className="mr-2 h-4 w-4" /> New Character
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-medieval text-primary mb-2">Welcome, {user?.username || "Adventurer"}</h1>
            <p className="text-lg text-muted-foreground">Your epic journey awaits. Manage your campaigns and characters.</p>
          </header>
          
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="bg-accent/20">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="space-y-4">
              <CampaignsDashboard />
            </TabsContent>
            
            <TabsContent value="characters" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-medieval text-secondary">Your Characters</h2>
                <Button onClick={() => navigate("/characters/create")}>
                  <Plus className="mr-2 h-4 w-4" /> New Character
                </Button>
              </div>
              
              {renderCharacters()}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
