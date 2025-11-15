import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    currency: string;
    created_at: string;
  };
  memberCount: number;
}

const GroupCard = ({ group, memberCount }: GroupCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-card transition-all duration-200 hover:scale-[1.02] border-border/50 bg-card active:scale-[0.98]"
      onClick={() => navigate(`/group/${group.id}`)}
    >
      <CardHeader className="pb-3 p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base md:text-lg font-semibold truncate flex-1">{group.name}</CardTitle>
          <Badge variant="secondary" className="text-xs md:text-sm shrink-0">
            {group.currency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs md:text-sm text-muted-foreground">
            <Users className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
          </div>
          <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;
