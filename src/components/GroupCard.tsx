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
      className="cursor-pointer hover:shadow-card transition-all duration-200 hover:scale-[1.02] border-border/50 bg-card"
      onClick={() => navigate(`/group/${group.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {group.currency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;
