import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCampaignSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import { AddCharacterDialog } from "@/components/add-character-dialog";
import { Dice5, MapPin, Users, BookOpen, Wand2, Loader2, UserPlus } from "lucide-react";

// Campaign settings
const settings = [
  "Forgotten Realms",
  "Eberron",
  "Greyhawk",
  "Dragonlance",
  "Ravenloft",
  "Dark Sun",
  "Planescape",
  "Homebrew",
  "Custom"
];

// Extend the insert schema with validation rules
const campaignSchema = insertCampaignSchema
  .extend({
    // Add form-specific fields
    confirmCreate: z.boolean().optional(),
  })
  .refine((data) => data.confirmCreate === true, {
    message: "You must confirm campaign creation",
    path: ["confirmCreate"],
  });

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignCreation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddCharacterDialog, setShowAddCharacterDialog] = useState(false);
  const [newCampaignId, setNewCampaignId] = useState<number | null>(null);

  // Initialize form with default values
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      dmId: user?.id || 0,
      name: "",
      description: "",
      setting: "Forgotten Realms",
      status: "active",
      isAiDm: true, // Default to AI DM
      confirmCreate: false,
    },
  });

  // Campaign creation mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: CampaignFormValues) => {
      // Remove confirmCreate field before sending to API
      const { confirmCreate, ...campaign } = campaignData;

      // Force dmId to be the current user's ID
      campaign.dmId = user?.id || 0;

      const res = await apiRequest("POST", "/api/campaigns", campaign);
      return await res.json();
    },
    onSuccess: (campaign) => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      
      // Store the new campaign ID and show the character dialog
      console.log("Campaign created successfully:", campaign);
      setNewCampaignId(campaign.id);
      
      // Add a small delay to ensure state update before showing dialog
      setTimeout(() => {
        setShowAddCharacterDialog(true);
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Generate random campaign mutation
  const generateCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate/campaign", {});
      return await res.json();
    },
    onSuccess: (data) => {
      // Update form with generated data
      form.reset({
        ...form.getValues(),
        name: data.name,
        description: data.description,
        setting: data.setting || "Homebrew",
        confirmCreate: true,
      });
      
      setIsGenerating(false);
      
      toast({
        title: "Campaign Generated",
        description: "A new campaign world has been created! Review and submit to begin your adventure.",
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: `Failed to generate campaign: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Generate random campaign
  const handleGenerateCampaign = () => {
    setIsGenerating(true);
    generateCampaignMutation.mutate();
  };

  // Handle form submission
  const onSubmit = (values: CampaignFormValues) => {
    createCampaignMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Add Character Dialog - opens after campaign creation */}
        <AddCharacterDialog
          campaignId={newCampaignId || 0}
          open={showAddCharacterDialog}
          onOpenChange={(open) => {
            setShowAddCharacterDialog(open);
            // If dialog is closed without adding a character, navigate to campaign
            if (!open && newCampaignId) {
              navigate(`/campaigns/${newCampaignId}`);
            }
          }}
          onCharacterAdded={() => {
            // Navigate to the new campaign after adding a character
            if (newCampaignId) {
              navigate(`/campaigns/${newCampaignId}`);
            }
          }}
        />
            
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-medieval text-primary mb-2">Create Your Campaign</h1>
            <p className="text-muted-foreground">Craft a world of adventure for your players</p>
          </header>

          <Card className="medieval-border bg-parchment">
            <CardHeader>
              <CardTitle className="text-2xl font-medieval text-secondary">Campaign Creation</CardTitle>
              <CardDescription>
                Fill out the details below to create your new campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-parchment border-accent"
                              placeholder="Enter your campaign's name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="setting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setting</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "Forgotten Realms"}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-parchment border-accent">
                                <SelectValue placeholder="Select a setting" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border border-accent z-50">
                              {settings.map((setting) => (
                                <SelectItem key={setting} value={setting}>
                                  {setting}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isAiDm"
                      render={({ field }) => (
                        <FormItem className="bg-parchment border border-accent rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <FormLabel className="font-medieval text-lg">Dungeon Master Mode</FormLabel>
                              <FormDescription className="text-sm text-muted-foreground">
                                Choose between AI Dungeon Master or run it yourself
                              </FormDescription>
                            </div>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <span className={field.value ? "text-muted-foreground" : "font-semibold"}>Human</span>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <span className={!field.value ? "text-muted-foreground" : "font-semibold"}>AI</span>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            className="resize-none h-24 bg-parchment border-accent"
                            placeholder="Describe your campaign's world and storyline..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmCreate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 accent-primary mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Confirm Campaign Creation</FormLabel>
                          <FormDescription>
                            I'm ready to begin my adventure as Dungeon Master
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full md:w-auto"
                      onClick={handleGenerateCampaign}
                      disabled={isGenerating || createCampaignMutation.isPending}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Random Campaign
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={createCampaignMutation.isPending || isGenerating}
                    >
                      {createCampaignMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Campaign"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-parchment p-4 rounded-lg border border-accent text-center">
              <Dice5 className="mx-auto h-10 w-10 text-primary mb-2" />
              <h3 className="font-medieval text-lg mb-1">Adventure Awaits</h3>
              <p className="text-sm text-muted-foreground">Create exciting encounters and challenges for your players</p>
            </div>
            
            <div className="bg-parchment p-4 rounded-lg border border-accent text-center">
              <MapPin className="mx-auto h-10 w-10 text-primary mb-2" />
              <h3 className="font-medieval text-lg mb-1">Build Your World</h3>
              <p className="text-sm text-muted-foreground">Craft unique locations, kingdoms, and dungeons to explore</p>
            </div>
            
            <div className="bg-parchment p-4 rounded-lg border border-accent text-center">
              <Users className="mx-auto h-10 w-10 text-primary mb-2" />
              <h3 className="font-medieval text-lg mb-1">Manage Players</h3>
              <p className="text-sm text-muted-foreground">Invite players and guide their characters through your story</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}