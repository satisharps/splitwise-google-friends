import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { consumePendingReturnUrl, useAuthSession } from "@/hooks/use-auth-session";

const Index = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;

    if (user) {
      navigate(consumePendingReturnUrl(), { replace: true });
      return;
    }

    navigate("/auth", { replace: true });
  }, [isReady, navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
