import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Auth component mounted");
    
    // Get return URL from query params
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("returnUrl") || "/";
    console.log("Return URL:", returnUrl);

    // Check if user is already logged in
    console.log("Checking for existing session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Existing session:", session ? "Found" : "None");
      if (session) {
        console.log("Navigating to:", returnUrl);
        navigate(returnUrl);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change - Event:", event, "Session:", session ? "Present" : "None");
      if (session) {
        console.log("Navigating to:", returnUrl);
        navigate(returnUrl);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      console.log("=== Google Sign-In Started ===");
      setLoading(true);
      
      const params = new URLSearchParams(window.location.search);
      const returnUrl = (params.get("returnUrl") || "/").trim();
      console.log("Step 1 - Return URL:", returnUrl);
      
      const redirectTo = `${window.location.origin.trim()}${returnUrl}`;
      console.log("Step 2 - Full redirect URL:", redirectTo);
      console.log("Step 3 - Redirect URL length:", redirectTo.length);
      console.log("Step 4 - Redirect URL contains whitespace:", /\s/.test(redirectTo));
      
      console.log("Step 5 - Calling supabase.auth.signInWithOAuth...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
        },
      });

      if (error) {
        console.error("Step 6 - OAuth Error:", error);
        throw error;
      }
      
      console.log("Step 7 - OAuth call successful, redirecting to Google...");
    } catch (error: any) {
      console.error("=== Sign-In Error ===", error);
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="space-y-2 md:space-y-3 text-center p-4 md:p-6">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <path d="M12 18V6" />
            </svg>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SplitEase
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Split expenses with friends, track who owes what, and settle up easily
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 text-sm md:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
