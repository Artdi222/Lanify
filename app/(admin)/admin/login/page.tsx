"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight,
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { login, getMe } from "@/lib/api/auth";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { setCookie } from "cookies-next";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAdminStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(data.email, data.password);
      
      // Check if user is actually an admin
      const profile = await getMe(response.token);
      
      if (profile.role !== "admin") {
        throw new Error("You do not have administrative privileges.");
      }

      // Update store
      setAuth(response.token, profile);
      
      // Set cookie for middleware
      setCookie("lanify-admin-token", response.token, {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      toast.success("Welcome back, Administrator");
      router.push("/admin");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Invalid email or password";
      setError(errorMessage);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-border/50 bg-card/40 backdrop-blur-2xl shadow-2xl shadow-black/50">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-4 ring-1 ring-white/10">
              <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-heading font-bold glow-blue">LANIFY ADMIN</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to manage the beatmap repository
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@lanify.osu"
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Authenticate <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 text-center pb-8 pt-4">
            <p className="text-xs text-muted-foreground opacity-60">
              Authorized access only. All activities are logged.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
