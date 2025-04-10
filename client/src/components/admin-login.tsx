import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function AdminLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { loginMutation } = useAuth();

  const handleAdminLogin = async () => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({
        username: "admin",
        password: "admin123" // This is a placeholder, update with the actual admin password
      });
      
      toast({
        title: "Admin Login Successful",
        description: "You are now logged in as an admin."
      });
    } catch (error) {
      toast({
        title: "Admin Login Failed",
        description: "Please check the admin credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline"
      onClick={handleAdminLogin}
      disabled={isLoading}
    >
      {isLoading ? "Logging in..." : "Login as Admin"}
    </Button>
  );
}