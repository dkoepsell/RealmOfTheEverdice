import { useState } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import { Link } from "wouter";
import { 
  Book, 
  MapPin, 
  Users, 
  LinkIcon, 
  DicesIcon, 
  ScrollText, 
  HelpCircle, 
  Star, 
  Heart, 
  Gamepad2,
  ArrowUpRight,
  Github
} from "lucide-react";

export default function AboutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("about");

  const resources = [
    {
      title: "Official D&D Website",
      description: "The home of Dungeons & Dragons with official rules, adventures, and resources.",
      url: "https://dnd.wizards.com/",
      icon: <Book className="h-5 w-5" />
    },
    {
      title: "D&D Beyond",
      description: "Digital tools, character builder, and official digital rulebooks.",
      url: "https://www.dndbeyond.com/",
      icon: <ScrollText className="h-5 w-5" />
    },
    {
      title: "Roll20",
      description: "Virtual tabletop platform for playing D&D online with friends.",
      url: "https://roll20.net/",
      icon: <Gamepad2 className="h-5 w-5" />
    },
    {
      title: "Find Game Stores",
      description: "Locate local game stores where you can meet players and join in-person games.",
      url: "https://locator.wizards.com/",
      icon: <MapPin className="h-5 w-5" />
    },
    {
      title: "Reddit D&D Community",
      description: "Join the vibrant D&D discussion community on Reddit.",
      url: "https://www.reddit.com/r/DnD/",
      icon: <Users className="h-5 w-5" />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">
                <HelpCircle className="h-4 w-4 mr-2" />
                About Quest Tavern
              </TabsTrigger>
              <TabsTrigger value="resources">
                <LinkIcon className="h-4 w-4 mr-2" />
                D&D Resources
              </TabsTrigger>
              <TabsTrigger value="philosophy">
                <ScrollText className="h-4 w-4 mr-2" />
                Our Philosophy
              </TabsTrigger>
            </TabsList>
            
            {/* About Tab */}
            <TabsContent value="about" className="mt-6">
              <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-white">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-3">
                    <svg 
                      className="h-16 w-16 text-primary"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <CardTitle className="text-3xl font-medieval bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800">Quest Tavern</CardTitle>
                  <CardDescription className="text-lg">Your Digital Dungeon Master's Companion</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 text-center pb-2">
                  <p className="text-lg">
                    Quest Tavern is a comprehensive D&D Dungeon Master companion web application 
                    designed to transform digital storytelling into an interactive, book-like 
                    experience for tabletop roleplaying enthusiasts.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <div className="p-4 bg-muted/10 rounded-lg">
                      <DicesIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium text-lg mb-1">Campaign Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Create and manage your D&D campaigns with intuitive tools and AI assistance.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-muted/10 rounded-lg">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h3 className="font-medium text-lg mb-1">Social Play</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with friends or find new players in the Tavern to join your adventures.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-muted/10 rounded-lg">
                      <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <h3 className="font-medium text-lg mb-1">AI-Powered</h3>
                      <p className="text-sm text-muted-foreground">
                        Let our AI Dungeon Master help craft stories, NPCs, and dynamic adventures.
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-center pb-6">
                  <p className="text-sm text-center max-w-xl text-muted-foreground">
                    Quest Tavern is a passion project created to enhance your tabletop role-playing 
                    experience, not replace it. We encourage all users to support official D&D publishers 
                    and participate in physical tabletop gaming whenever possible.
                  </p>
                </CardFooter>
              </Card>
              
              <div className="mt-8">
                <h2 className="text-2xl font-medieval mb-4">Meet the Creators</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Heart className="h-12 w-12 text-primary/50" />
                      </div>
                      <h3 className="text-xl font-medium mb-1">Made with Love</h3>
                      <p className="text-muted-foreground mb-4">
                        Quest Tavern was created by passionate D&D enthusiasts who wanted to enhance 
                        the game they love. This app is designed as a companion tool for Dungeon Masters 
                        and players, whether novice adventurers or veteran dragon slayers.
                      </p>
                      <div className="flex space-x-4 mt-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          toast({
                            title: "GitHub Repository",
                            description: "The repository link will be available soon!",
                            variant: "default",
                          });
                        }}>
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </Button>
                        
                        <Button variant="outline" size="sm" onClick={() => {
                          toast({
                            title: "Support",
                            description: "Thank you for your interest in supporting Quest Tavern!",
                            variant: "default",
                          });
                        }}>
                          <Heart className="h-4 w-4 mr-2" />
                          Support
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Resources Tab */}
            <TabsContent value="resources" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-medieval">Official D&D Resources</CardTitle>
                  <CardDescription>
                    We strongly encourage all Quest Tavern users to support official D&D products 
                    and explore these valuable resources.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resources.map((resource, index) => (
                      <div key={index} className="flex items-start">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                          {resource.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg flex items-center">
                            {resource.title}
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center ml-2 text-sm text-primary hover:underline"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </h3>
                          <p className="text-muted-foreground">{resource.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground italic">
                    All trademarks and copyrights belong to their respective owners. Quest Tavern is 
                    not affiliated with Wizards of the Coast or Hasbro.
                  </p>
                </CardFooter>
              </Card>
              
              <div className="mt-8 bg-muted/20 p-6 rounded-lg">
                <h2 className="text-2xl font-medieval mb-4">Essential D&D Products for Beginners</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-medium text-lg mb-2">Player's Handbook</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The essential rulebook for players. Contains all the rules, classes, races, 
                      backgrounds, equipment and spells you need to create and play characters.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://dnd.wizards.com/products/rpg_playershandbook" target="_blank" rel="noopener noreferrer">
                        <Book className="h-4 w-4 mr-2" />
                        Learn More
                      </a>
                    </Button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-medium text-lg mb-2">Dungeon Master's Guide</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The ultimate resource for Dungeon Masters. Contains world-building advice, 
                      tools for creating adventures, magical treasures, and much more.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://dnd.wizards.com/products/dungeon-masters-guide" target="_blank" rel="noopener noreferrer">
                        <Book className="h-4 w-4 mr-2" />
                        Learn More
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Philosophy Tab */}
            <TabsContent value="philosophy" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-medieval">Our Philosophy</CardTitle>
                  <CardDescription>
                    Quest Tavern was created with a specific vision and purpose in mind.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2 flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      Enhancing, Not Replacing
                    </h3>
                    <p className="text-muted-foreground">
                      We believe that nothing can replace the magic of sitting around a table with 
                      friends, rolling physical dice, and immersing yourselves in a shared story. 
                      Quest Tavern is designed to enhance this experience, not replace it. Our tools 
                      help Dungeon Masters prepare more efficiently and players engage more deeply.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2 flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      Accessibility and Inclusivity
                    </h3>
                    <p className="text-muted-foreground">
                      We want to make tabletop roleplaying games more accessible to everyone. 
                      Whether you're a veteran player or someone who's never rolled a d20 before, 
                      Quest Tavern offers tools that help lower the barrier to entry and make 
                      the hobby more approachable.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2 flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      Respecting the Craft
                    </h3>
                    <p className="text-muted-foreground">
                      We have immense respect for the game designers, writers, and artists who 
                      create the official D&D materials. Quest Tavern is built on the foundation 
                      of their work, and we encourage all our users to support official publications 
                      and local game stores.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2 flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      Community-Focused
                    </h3>
                    <p className="text-muted-foreground">
                      At its heart, D&D is about building stories together. Quest Tavern aims 
                      to foster connections between players, help people find groups, and build 
                      a supportive community where everyone can share their love for the game.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/tavern">
                      <DicesIcon className="h-4 w-4 mr-2" />
                      Visit the Tavern
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="bg-muted/30 border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Quest Tavern is not affiliated with Wizards of the Coast or Hasbro. 
            Dungeons & Dragons and D&D are trademarks of Wizards of the Coast LLC.
          </p>
          <p>
            &copy; {new Date().getFullYear()} Quest Tavern — Created with 
            <Heart className="h-3 w-3 inline-block mx-1 text-red-500" /> by D&D enthusiasts
          </p>
        </div>
      </footer>
    </div>
  );
}