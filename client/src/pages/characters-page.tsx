import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Character } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { PlusCircle, Sword, Shield, BookOpen, GitBranch, Trash2 } from "lucide-react";
import Navbar from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CharacterSheet } from "@/components/character-sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { DialogClose } from "@radix-ui/react-dialog";

export default function CharactersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Fetch all characters for the current user
  const { data: characters, isLoading, isError, refetch } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDeleteCharacter = async (id: number) => {
    try {
      await fetch(`/api/characters/${id}`, {
        method: "DELETE",
      });
      toast({
        title: "Character deleted",
        description: "Your character has been deleted successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete character. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow container max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Characters</h1>
          <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Link href="/characters/create">
              <a className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Character
              </a>
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-6 h-64">
                <div className="h-5 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-12 bg-muted rounded mt-auto"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Failed to load characters</h3>
            <p className="text-muted-foreground mb-4">There was an error loading your characters.</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : characters && characters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <Card key={character.id} className="relative overflow-hidden border-2 hover:border-primary transition-all duration-200">
                <div className="absolute top-0 right-0 p-2">
                  <Badge className="bg-accent text-background">{character.level ? `Level ${character.level}` : "New"}</Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 border-2 border-primary">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {character.name ? character.name.charAt(0) : "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{character.name}</CardTitle>
                        <CardDescription>
                          {character.race} {character.class}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-y-2 text-sm mt-2">
                    <div className="flex items-center">
                      <Sword className="h-4 w-4 mr-2 text-primary" />
                      <span>Class: <span className="font-medium">{character.class || "Unknown"}</span></span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      <span>Race: <span className="font-medium">{character.race || "Unknown"}</span></span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-primary" />
                      <span>Level: <span className="font-medium">{character.level || "1"}</span></span>
                    </div>
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 mr-2 text-primary" />
                      <span>Align: <span className="font-medium">{character.background?.includes("Alignment:") ? character.background.split("Alignment:")[1].trim().split(" ")[0] : "Neutral"}</span></span>
                    </div>
                  </div>
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-between pt-4">
                  {isMobile ? (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedCharacter(character)}>View Details</Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>{character.name}</DrawerTitle>
                          <DrawerDescription>{character.race} {character.class}</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 py-2 max-h-[calc(80vh-10rem)] overflow-y-auto">
                          {character && <CharacterSheet character={character} />}
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedCharacter(character)}>View Details</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{character.name}</DialogTitle>
                          <DialogDescription>{character.race} {character.class}</DialogDescription>
                        </DialogHeader>
                        {character && <CharacterSheet character={character} />}
                        <div className="flex justify-end mt-4">
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => handleDeleteCharacter(character.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted-foreground/20">
            <h3 className="text-xl font-semibold mb-2">No Characters Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first D&D character to begin your adventure. You'll be able to use your character in campaigns.
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Link href="/characters/create">
                <a className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Your First Character
                </a>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}