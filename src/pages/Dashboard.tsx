import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import GroupCard from "@/components/GroupCard";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuthSession();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      navigate("/auth?returnUrl=/dashboard", { replace: true });
    }
  }, [isReady, navigate, user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expense_groups")
        .select(`
          *,
          group_members(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady && user) {
      fetchGroups();
    }
  }, [isReady, user]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <Header user={user} />
      <main className="container py-4 px-4 md:py-8 md:px-6">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Your Groups</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage and track expenses with your friends
              </p>
            </div>
            <div className="shrink-0">
              <CreateGroupDialog onGroupCreated={fetchGroups} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 px-4 md:py-12">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 md:w-10 md:h-10 text-accent-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                Create your first group to start splitting expenses
              </p>
              <div className="flex justify-center">
                <CreateGroupDialog onGroupCreated={fetchGroups} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  memberCount={group.group_members?.[0]?.count || 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
