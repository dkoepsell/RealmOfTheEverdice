import { Character } from '@shared/schema';
import PartyPlanningBoard from './party-planning-board';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PartyPlanningProps {
  campaignId: number;
  characters?: Character[];
}

export function PartyPlanning({ campaignId, characters = [] }: PartyPlanningProps) {
  // This component now serves as a wrapper for our new party planning board
  // The characters prop is kept for backwards compatibility
  return (
    <div className="flex flex-col h-full">
      {/* Alert banner to inform users about the migration to the new system */}
      <Alert className="mb-4 mx-4 mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Enhanced Party Planning</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>We've upgraded to a new party planning system with real-time collaboration.</span>
          <Button 
            variant="link" 
            className="px-0" 
            onClick={() => window.open('https://realm-of-everdice.notion.site/Party-Planning-Guide-e9a7b6f1d8f7483aa58d1b3d6a5b7f4e', '_blank')}
          >
            Learn More
          </Button>
        </AlertDescription>
      </Alert>
      
      {/* New Party Planning Board Component */}
      <div className="flex-grow overflow-auto px-2">
        <PartyPlanningBoard campaignId={campaignId} />
      </div>
    </div>
  );
}