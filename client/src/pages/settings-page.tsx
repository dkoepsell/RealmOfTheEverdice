import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Save, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);
  const [automaticDiceRolls, setAutomaticDiceRolls] = useState(true);
  const [displayTheme, setDisplayTheme] = useState("dark");
  const [audioEffects, setAudioEffects] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSaveSettings = async () => {
    setSaving(true);
    // This would typically save to the backend
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow container max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full md:w-1/2 grid-cols-3 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and application appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="theme" className="text-base">Dark Theme</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between dark and light mode
                      </p>
                    </div>
                    <Switch 
                      id="theme" 
                      checked={displayTheme === "dark"} 
                      onCheckedChange={(checked) => setDisplayTheme(checked ? "dark" : "light")} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audio-effects" className="text-base">Audio Effects</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable sound effects for dice rolls and gameplay events
                      </p>
                    </div>
                    <Switch 
                      id="audio-effects" 
                      checked={audioEffects} 
                      onCheckedChange={setAudioEffects} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gameplay">
            <Card>
              <CardHeader>
                <CardTitle>Gameplay Settings</CardTitle>
                <CardDescription>
                  Customize your gameplay experience and AI interactions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ai-assist" className="text-base">AI Dungeon Master</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable AI to act as your default Dungeon Master
                      </p>
                    </div>
                    <Switch 
                      id="ai-assist" 
                      checked={aiAssistEnabled} 
                      onCheckedChange={setAiAssistEnabled} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-dice" className="text-base">Automatic Dice Rolls</Label>
                      <p className="text-sm text-muted-foreground">
                        Let the system automatically roll dice for skill checks
                      </p>
                    </div>
                    <Switch 
                      id="auto-dice" 
                      checked={automaticDiceRolls} 
                      onCheckedChange={setAutomaticDiceRolls} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="campaign-invites" className="text-base">Campaign Invitations</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when you're invited to a campaign
                    </p>
                  </div>
                  <Switch id="campaign-invites" defaultChecked />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="friend-requests" className="text-base">Friend Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for friend requests
                    </p>
                  </div>
                  <Switch id="friend-requests" defaultChecked />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="game-updates" className="text-base">Game Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when it's your turn in a campaign
                    </p>
                  </div>
                  <Switch id="game-updates" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}