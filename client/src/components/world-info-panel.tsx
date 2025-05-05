import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Campaign, Character, Quest, Adventure, Npc } from "@shared/schema";

interface CharacterSummary {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
}

interface WorldInfoPanelProps {
  campaign: Campaign;
  partyMembers: CharacterSummary[];
  currentAdventure: Adventure;
  currentLocation?: string;
  quests: Quest[];
}

export const WorldInfoPanel = ({
  campaign,
  partyMembers,
  currentAdventure,
  currentLocation = "Unknown",
  quests
}: WorldInfoPanelProps) => {
  // Calculate health percentage
  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };
  
  // Get appropriate class icon
  const getClassIcon = (characterClass: string) => {
    switch (characterClass.toLowerCase()) {
      case "paladin":
        return "user-shield";
      case "wizard":
        return "hat-wizard";
      case "druid":
        return "leaf";
      case "rogue":
        return "skull";
      case "cleric":
        return "heart";
      case "fighter":
        return "sword";
      case "ranger":
        return "bow-arrow";
      case "bard":
        return "music";
      case "warlock":
        return "moon";
      case "monk":
        return "hand-fist";
      default:
        return "user";
    }
  };
  
  // Get background color based on class
  const getClassColor = (characterClass: string) => {
    switch (characterClass.toLowerCase()) {
      case "paladin":
        return "bg-secondary text-white";
      case "wizard":
        return "bg-primary text-white";
      case "druid":
        return "bg-accent text-darkBrown";
      case "rogue":
        return "bg-darkBrown text-white";
      case "cleric":
        return "bg-success text-white";
      default:
        return "bg-accent text-darkBrown";
    }
  };
  
  // Get danger level based on adventure
  const getDangerLevel = () => {
    // This would normally be derived from the adventure data
    return "High";
  };
  
  // Determine if a quest is a main quest
  const isMainQuest = (quest: Quest) => {
    return quest.isMainQuest;
  };
  
  // Calculate quest progress
  const getQuestProgress = (quest: Quest) => {
    // This is a placeholder - in a real app you'd track actual progress
    return quest.isMainQuest ? "Main Quest" : "Side Quest • 1/3 Completed";
  };

  return (
    <div className="w-full lg:w-1/4 bg-parchment border-l border-accent overflow-y-auto">
      <div className="p-4">
        {/* Party Members */}
        <div className="mb-6">
          <h2 className="text-xl font-medieval text-secondary mb-3">Party Members</h2>
          <div className="space-y-2">
            {partyMembers.map((member) => (
              <div key={member.id} className="flex items-center p-2 rounded-lg hover:bg-accent/10 cursor-pointer">
                <div className={`w-10 h-10 ${getClassColor(member.class)} rounded-full flex items-center justify-center mr-3`}>
                  <i className={`fas fa-${getClassIcon(member.class)}`}></i>
                </div>
                <div className="flex-grow">
                  <div className="font-bold">{member.name}</div>
                  <div className="text-sm">Lvl {member.level} {member.race} {member.class}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`${member.hp === member.maxHp ? 'text-success' : member.hp < member.maxHp / 2 ? 'text-destructive' : 'text-accent'} font-bold`}>
                    {member.hp}/{member.maxHp}
                  </div>
                  <div className="w-12 bg-darkBrown/20 rounded-full h-2">
                    <div 
                      className={`${member.hp === member.maxHp ? 'bg-success' : member.hp < member.maxHp / 2 ? 'bg-destructive' : 'bg-accent'} rounded-full h-2`} 
                      style={{ width: `${getHealthPercentage(member.hp, member.maxHp)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Current Location */}
        <Card className="medieval-border rounded-lg mb-6 bg-parchment">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-medieval text-primary">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="font-bold">Region:</span>
              <span className="ml-1">{campaign.setting || "Unknown Lands"}</span>
            </div>
            <div className="mb-2">
              <span className="font-bold">Current Area:</span>
              <span className="ml-1">{currentLocation}</span>
            </div>
            <div className="mb-4">
              <span className="font-bold">Danger Level:</span>
              <span className="ml-1 text-destructive">{getDangerLevel()}</span>
            </div>
            
            {/* This would be a map of the area */}
            <div className="w-full h-40 bg-accent/20 rounded-lg flex items-center justify-center text-accent/50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </div>
          </CardContent>
        </Card>
        
        {/* Quest Tracker */}
        <Card className="medieval-border rounded-lg bg-parchment">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-medieval text-secondary">Active Quests</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Main Quest */}
            {quests.filter(isMainQuest).map((quest) => (
              <div key={quest.id} className="mb-4">
                <div className="flex items-center mb-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-accent mr-2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <h4 className="font-bold">{quest.title}</h4>
                </div>
                <p className="text-sm mb-1">
                  {quest.description}
                </p>
                <div className="text-xs italic text-right">Main Quest</div>
              </div>
            ))}
            
            {/* Side Quests */}
            <div className="space-y-3">
              {quests.filter(q => !isMainQuest(q)).map((quest) => (
                <div key={quest.id}>
                  <div className="flex items-center mb-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-secondary mr-2"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <h4 className="font-bold">{quest.title}</h4>
                  </div>
                  <p className="text-sm mb-1">
                    {quest.description}
                  </p>
                  <div className="text-xs italic text-right">{getQuestProgress(quest)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorldInfoPanel;
