import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export default function FinishSignIn() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const { completeSignInWithEmailLink } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    // Check if we have the email stored from the original device
    const email = window.localStorage.getItem("emailForSignIn");
    
    if (email) {
      // We have the email, try to complete sign-in
      finishSignInWithEmail(email);
    } else {
      // No email found, ask user to provide it
      setNeedsEmail(true);
      setIsLoading(false);
    }
  }, []);

  const finishSignInWithEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await completeSignInWithEmailLink(email);
      // Sign-in successful, redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error completing sign-in:", error);
      setError(error.message || "Failed to sign in. The link may be invalid or expired.");
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    await finishSignInWithEmail(values.email);
  };

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-500">Sign-in Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{error}</p>
          <Button 
            onClick={() => navigate("/signin")} 
            className="w-full"
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (needsEmail) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Please enter the email address you used to request the sign-in link.</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Complete Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Completing Sign In</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
} 