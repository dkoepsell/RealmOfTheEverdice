import { useOnlineStatus, OnlineStatus } from "@/hooks/use-online-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Circle, 
  Clock, 
  AlertCircle, 
  XCircle,
  ChevronDown
} from "lucide-react";

export const OnlineStatusSelector = () => {
  const {
    currentStatus,
    updateStatusMutation
  } = useOnlineStatus();

  const handleUpdateStatus = (status: OnlineStatus) => {
    updateStatusMutation.mutate(status);
  };

  const renderStatusIcon = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return <Circle className="h-3 w-3 fill-green-500 text-green-500" />;
      case "away":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "busy":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "offline":
        return <XCircle className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const renderStatusText = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "away":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "busy":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "offline":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      default:
        return "";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`gap-2 ${getStatusColor(currentStatus)}`}>
          {renderStatusIcon(currentStatus)}
          <span className="text-xs">{renderStatusText(currentStatus)}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Set Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          onClick={() => handleUpdateStatus("online")}
        >
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          Online
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          onClick={() => handleUpdateStatus("away")}
        >
          <Clock className="h-3 w-3 text-yellow-500" />
          Away
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          onClick={() => handleUpdateStatus("busy")}
        >
          <AlertCircle className="h-3 w-3 text-red-500" />
          Busy
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          onClick={() => handleUpdateStatus("offline")}
        >
          <XCircle className="h-3 w-3 text-gray-500" />
          Offline
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// This component can be used to display another user's status
export const OnlineStatusBadge = ({ userId }: { userId: number }) => {
  const { isUserOnline, getUserStatus } = useOnlineStatus();
  
  const status = getUserStatus(userId);
  
  const getStatusColor = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "away":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "busy":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "offline":
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };
  
  const renderStatusIcon = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return <Circle className="h-2 w-2 fill-green-500 text-green-500" />;
      case "away":
        return <Clock className="h-2 w-2 text-yellow-500" />;
      case "busy":
        return <AlertCircle className="h-2 w-2 text-red-500" />;
      case "offline":
        return <XCircle className="h-2 w-2 text-gray-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Badge variant="outline" className={`gap-1 py-0 px-2 h-5 text-xs ${getStatusColor(status)}`}>
      {renderStatusIcon(status)}
      <span>{status}</span>
    </Badge>
  );
};