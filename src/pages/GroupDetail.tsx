import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Users, Link2, Copy } from "lucide-react";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { ExpenseList } from "@/components/ExpenseList";

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInvitation, setPendingInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Redirect to auth with return URL
        navigate(`/auth?returnUrl=/group/${groupId}`);
      } else {
        setUser(session.user);
      }
    });
  }, [navigate, groupId]);

  const fetchGroupData = async (isRetry = false) => {
    try {
      setLoading(true);
      
      const [groupResult, invitationsResult, membersResult] = await Promise.all([
        supabase.from("expense_groups").select("*").eq("id", groupId).single(),
        supabase.from("group_invitations").select("*").eq("group_id", groupId),
        supabase
          .from("group_members")
          .select("*")
          .eq("group_id", groupId),
      ]);

      if (groupResult.error) {
        // If user can't view the group, automatically add them as a member
        if (groupResult.error.code === 'PGRST116' && !isRetry && user?.id) {
          try {
            const { error: memberError } = await supabase
              .from("group_members")
              .insert({
                group_id: groupId,
                user_id: user.id,
              });

            if (!memberError) {
              toast({
                title: "Welcome to the group!",
                description: "You've been added to this group",
              });
              // Retry fetching with the new membership
              return fetchGroupData(true);
            }
          } catch (addError) {
            console.error("Error adding user to group:", addError);
          }
        }
        throw groupResult.error;
      }
      
      setGroup(groupResult.data);
      setInvitations(invitationsResult.data || []);
      
      // Merge members with their profiles explicitly (avoid relying on implicit FK)
      const rawMembers = (membersResult.data || []) as any[];
      const creatorId = groupResult.data?.created_by as string | undefined;

      const userIds = Array.from(new Set([
        ...rawMembers.map((m: any) => m.user_id),
        ...(creatorId ? [creatorId] : []),
      ]));

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

      let allMembers: any[] = rawMembers.map((m: any) => ({
        ...m,
        profiles: profileMap.get(m.user_id) || null,
      }));

      const creatorIsMember = rawMembers.some((m: any) => m.user_id === creatorId);
      if (!creatorIsMember && creatorId) {
        allMembers = [
          {
            user_id: creatorId,
            profiles: profileMap.get(creatorId) || null,
            group_id: groupId as string,
            id: crypto.randomUUID(),
            joined_at: new Date().toISOString(),
          } as any,
          ...allMembers,
        ];
      }

      setMembers(allMembers);

      // Check if current user has a pending invitation
      if (user?.email) {
        const userInvitation = invitationsResult.data?.find(
          (inv) => inv.invited_email === user.email && inv.status === "pending"
        );
        setPendingInvitation(userInvitation);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
      toast({
        title: "Error loading group",
        description: "Could not load group details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch related data separately
      const expensesWithDetails = await Promise.all(
        (expensesData || []).map(async (expense) => {
          const [payerResult, splitsResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name, email")
              .eq("user_id", expense.paid_by)
              .single(),
            supabase
              .from("expense_splits")
              .select(`
                user_id,
                amount,
                profiles(display_name, email)
              `)
              .eq("expense_id", expense.id),
          ]);

          return {
            ...expense,
            payer_profile: payerResult.data,
            expense_splits: splitsResult.data || [],
          };
        })
      );

      setExpenses(expensesWithDetails);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error loading expenses",
        description: "Could not load expenses",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user && groupId) {
      fetchGroupData();
      fetchExpenses();
    }
  }, [user, groupId]);

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/group/${groupId}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copied!",
      description: "Share this link with friends to invite them to the group",
    });
  };

  const handleAcceptInvitation = async () => {
    if (!pendingInvitation || !user) return;

    setAccepting(true);

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      // Only add user if not already a member
      if (!existingMember) {
        const { error: memberError } = await supabase
          .from("group_members")
          .insert({
            group_id: groupId,
            user_id: user.id,
          });

        if (memberError) throw memberError;
      }

      // Update invitation status
      const { error: inviteError } = await supabase
        .from("group_invitations")
        .update({ status: "accepted" })
        .eq("id", pendingInvitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Welcome to the group!",
        description: "You've successfully joined the group",
      });

      setPendingInvitation(null);
      fetchGroupData();
    } catch (error: any) {
      toast({
        title: "Error accepting invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  // Auto-accept invitation when user arrives with pending invitation
  useEffect(() => {
    if (user && pendingInvitation && !loading && !accepting) {
      handleAcceptInvitation();
    }
  }, [user, pendingInvitation, loading]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
        <Header user={user} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <Header user={user} />
      <main className="container py-4 px-4 md:py-8 md:px-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 md:mb-6 -ml-2 md:-ml-3"
        >
          <ArrowLeft className="mr-1.5 md:mr-2 h-4 w-4" />
          <span className="text-sm md:text-base">Back to Groups</span>
        </Button>

        <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="space-y-4 md:space-y-6">
            {accepting && (
              <Card className="shadow-card border-primary/20 border-2">
                <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                  <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mb-3 md:mb-4" />
                    <p className="text-base md:text-lg font-medium">Joining group...</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      Please wait while we add you to the group
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card border-border/50">
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl truncate">{group?.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs md:text-sm">
                      Created {new Date(group?.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1 w-fit">
                    {group?.currency}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader className="p-4 md:p-6 pb-4 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg mb-0">
                  <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Invite Link
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="space-y-2.5 md:space-y-3">
                  <div className="flex items-center gap-2 p-2.5 md:p-3 rounded-lg bg-accent/30 border border-border/50">
                    <Link2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                    <code className="flex-1 text-[11px] sm:text-xs truncate text-muted-foreground leading-relaxed">
                      {window.location.origin}/group/{groupId}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyInviteLink}
                      className="flex-shrink-0 h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-accent"
                    >
                      <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground text-center leading-relaxed">
                    Share this link with friends to invite them
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader className="p-4 md:p-6 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    Members ({members.length})
                  </CardTitle>
                </div>
                <AddExpenseDialog
                  groupId={groupId!}
                  members={members}
                  onExpenseAdded={fetchExpenses}
                />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-3">
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-xs md:text-sm text-center py-4">No members yet</p>
                ) : (
                  <div className="space-y-2 md:space-y-2.5">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-lg bg-accent/50">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm md:text-base shrink-0">
                          {member.profiles?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-medium truncate leading-tight">
                            {member.profiles?.display_name || member.profiles?.email}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate leading-tight mt-0.5">
                            {member.profiles?.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader className="p-4 md:p-6 pb-3 md:pb-6">
                <CardTitle className="text-base sm:text-lg">Expenses</CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">
                  Track and split expenses with your group
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <ExpenseList expenses={expenses} currency={group?.currency || "USD"} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;
