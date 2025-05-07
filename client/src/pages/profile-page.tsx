import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PencilLine, 
  UserCircle, 
  ShieldPlus, 
  Mail, 
  Calendar, 
  Users, 
  Scroll, 
  Sword, 
  Shield 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Campaign, Character } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });
  
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/dm/campaigns"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - User profile */}
        <div className="col-span-1">
          <Card className="shadow-lg border-2 border-amber-200/50 bg-amber-50/30">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold text-amber-900">Profile</CardTitle>
                <Button size="sm" variant="ghost" className="text-amber-700">
                  <PencilLine className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription className="text-amber-700/80">Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4 border-2 border-amber-300">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-amber-200 text-amber-900 text-xl">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-amber-900 mb-1">{user.username}</h2>
                <p className="text-amber-700/80 text-sm">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center text-amber-800">
                  <UserCircle className="h-5 w-5 mr-3 text-amber-600" />
                  <span>Adventurer</span>
                </div>
                <div className="flex items-center text-amber-800">
                  <ShieldPlus className="h-5 w-5 mr-3 text-amber-600" />
                  <span>{campaigns.length > 0 ? "Dungeon Master" : "Player"}</span>
                </div>
                <div className="flex items-center text-amber-800">
                  <Mail className="h-5 w-5 mr-3 text-amber-600" />
                  <span>{user.email || "No email provided"}</span>
                </div>
                <div className="flex items-center text-amber-800">
                  <Calendar className="h-5 w-5 mr-3 text-amber-600" />
                  <span>Active member</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-amber-200 pt-4 flex justify-between">
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <Users className="h-4 w-4 mr-2" /> Friends
              </Button>
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                <Scroll className="h-4 w-4 mr-2" /> Adventures
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6 shadow-lg border-2 border-amber-200/50 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-amber-900">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">Characters</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                    {characters.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">Campaigns</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                    {campaigns.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">Completed Quests</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                    0
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Tabs for Characters and Campaigns */}
        <div className="col-span-1 md:col-span-2">
          <Tabs defaultValue="characters" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-amber-100 text-amber-800">
              <TabsTrigger value="characters" className="data-[state=active]:bg-amber-200">
                <Sword className="h-4 w-4 mr-2" /> Characters
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-amber-200">
                <Shield className="h-4 w-4 mr-2" /> Campaigns
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="characters">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {characters.length > 0 ? (
                  characters.map((character) => (
                    <Card key={character.id} className="shadow border-amber-200 bg-amber-50/50 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-amber-900">
                          {character.name}
                        </CardTitle>
                        <CardDescription className="text-amber-700/80">
                          Level {character.level} {character.race} {character.class}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 pb-3">
                        <p className="text-amber-700 line-clamp-2">{character.background}</p>
                      </CardContent>
                      <CardFooter className="border-t border-amber-200/60 pt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-amber-300 text-amber-800 hover:bg-amber-100"
                          asChild
                        >
                          <Link href={`/characters/${character.id}`}>View Character</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-1 md:col-span-2 bg-amber-50/30 border-dashed border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-center text-amber-800">No Characters Yet</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-amber-700/80">
                      <p>Start your adventure by creating a character!</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <Button 
                        variant="default" 
                        className="bg-amber-700 hover:bg-amber-800 text-amber-50"
                        asChild
                      >
                        <Link href="/characters/create">Create Character</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="campaigns">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <Card key={campaign.id} className="shadow border-amber-200 bg-amber-50/50 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-amber-900">
                          {campaign.name}
                        </CardTitle>
                        <CardDescription className="text-amber-700/80">
                          {campaign.setting || "Fantasy Setting"} • {campaign.status || "Active"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 pb-3">
                        <p className="text-amber-700 line-clamp-2">{campaign.description}</p>
                      </CardContent>
                      <CardFooter className="border-t border-amber-200/60 pt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-amber-300 text-amber-800 hover:bg-amber-100"
                          asChild
                        >
                          <Link href={`/campaigns/${campaign.id}`}>Enter Campaign</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-1 md:col-span-2 bg-amber-50/30 border-dashed border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-center text-amber-800">No Campaigns Yet</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-amber-700/80">
                      <p>Begin your journey as a Dungeon Master by creating a campaign!</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <Button 
                        variant="default" 
                        className="bg-amber-700 hover:bg-amber-800 text-amber-50"
                        asChild
                      >
                        <Link href="/campaigns/create">Create Campaign</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}