import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Loader2, Users, Send, Link2, Copy } from "lucide-react";
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
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

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      
      const [groupResult, invitationsResult, membersResult] = await Promise.all([
        supabase.from("expense_groups").select("*").eq("id", groupId).single(),
        supabase.from("group_invitations").select("*").eq("group_id", groupId),
        supabase
          .from("group_members")
          .select("*, profiles(*)")
          .eq("group_id", groupId),
      ]);

      if (groupResult.error) throw groupResult.error;
      
      setGroup(groupResult.data);
      setInvitations(invitationsResult.data || []);
      
      // Ensure creator is included in members list
      let allMembers = membersResult.data || [];
      const creatorId = groupResult.data?.created_by;
      const creatorIsMember = allMembers.some(m => m.user_id === creatorId);
      
      if (!creatorIsMember && creatorId) {
        // Fetch creator's profile
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", creatorId)
          .single();
        
        if (creatorProfile) {
          allMembers = [
            {
              user_id: creatorId,
              profiles: creatorProfile as any,
              group_id: groupId as string,
              id: crypto.randomUUID(),
              joined_at: new Date().toISOString(),
            },
            ...allMembers,
          ];
        }
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
      // Add user to group members
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
        });

      if (memberError) throw memberError;

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

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);

    try {
      // Insert invitation into database
      const { error } = await supabase
        .from("group_invitations")
        .insert({
          group_id: groupId,
          invited_email: inviteEmail.toLowerCase(),
          invited_by: user.id,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("This email has already been invited to this group");
        }
        throw error;
      }

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: inviteEmail.toLowerCase(),
          groupName: group?.name || "Expense Group",
          inviterName: user.email || "A member",
          groupId: groupId,
        },
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Invitation created",
          description: "Invitation saved but email sending failed. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation sent!",
          description: `Invitation email sent to ${inviteEmail}`,
        });
      }

      setInviteEmail("");
      fetchGroupData();
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

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
      <main className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {accepting && (
              <Card className="shadow-card border-primary/20 border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium">Joining group...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we add you to the group
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{group?.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Created {new Date(group?.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {group?.currency}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Members
                  </CardTitle>
                  <AddExpenseDialog
                    groupId={groupId!}
                    members={members}
                    onExpenseAdded={fetchExpenses}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No members yet</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {member.profiles?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.profiles?.full_name || member.profiles?.email}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
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
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>
                  Track and split expenses with your group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseList expenses={expenses} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Invite Friends
                </CardTitle>
                <CardDescription>
                  Send an invitation via email or share the link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/30 border border-border/50">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <code className="flex-1 text-sm truncate text-muted-foreground">
                      {window.location.origin}/group/{groupId}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyInviteLink}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Anyone with this link can request to join the group
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or send via email</span>
                  </div>
                </div>

                <form onSubmit={handleSendInvite} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={inviting}
                    />
                    <p className="text-sm text-muted-foreground">
                      Your friend will receive an invitation email. Ask them to accept the request to view group details.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={inviting}
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Friends invited who need to accept to view group details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invitations</p>
                ) : (
                  <div className="space-y-2">
                    {invitations
                      .filter(inv => inv.status === 'pending')
                      .map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-accent/30 text-sm"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{invitation.invited_email}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;
