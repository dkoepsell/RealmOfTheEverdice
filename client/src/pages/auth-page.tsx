import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Extend the insert schema with validation rules
const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }).optional().or(z.literal("")),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment bg-parchment-texture">
      <div className="w-full max-w-6xl flex flex-col md:flex-row shadow-lg rounded-lg overflow-hidden">
        {/* Form Section */}
        <div className="md:w-1/2 bg-parchment p-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-medieval text-primary mb-2">Dragon's Realm</h1>
            <p className="text-muted-foreground">Your D&D companion for epic adventures</p>
          </div>

          <Card className="bg-parchment/90 medieval-border" style={{ position: 'relative', zIndex: 1 }}>
            <CardHeader>
              <CardTitle className="text-2xl font-medieval text-primary">
                {isLogin ? "Welcome Back, Adventurer!" : "Join the Adventure"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Sign in to continue your epic journey"
                  : "Create an account to begin your adventures"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLogin ? (
                // Login Form
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              className="flex h-10 w-full rounded-md border border-accent bg-parchment px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pointer-events-auto"
                              placeholder="Enter your username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              type="password"
                              className="flex h-10 w-full rounded-md border border-accent bg-parchment px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pointer-events-auto"
                              placeholder="Enter your password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              ) : (
                // Register Form
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              className="flex h-10 w-full rounded-md border border-accent bg-parchment px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pointer-events-auto"
                              placeholder="Choose a username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="bg-parchment border-accent relative z-10"
                              placeholder="Enter your email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              className="bg-parchment border-accent relative z-10"
                              placeholder="Create a password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              className="bg-parchment border-accent relative z-10"
                              placeholder="Confirm your password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-secondary text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                onClick={toggleForm}
                className="w-full hover:bg-accent/20"
              >
                {isLogin ? "Need an account? Register" : "Already have an account? Login"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Hero Section */}
        <div className="md:w-1/2 bg-darkBrown text-parchment p-8 flex flex-col justify-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-medieval text-accent mb-6">Adventure Awaits</h2>
            <div className="space-y-4 mb-6 text-parchment font-medium">
              <div className="flex items-start">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent h-6 w-6 mr-2 mt-1 flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <p>Create and manage characters with full D&D character sheets</p>
              </div>
              <div className="flex items-start">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent h-6 w-6 mr-2 mt-1 flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <p>AI-driven adventures that adapt to your choices and actions</p>
              </div>
              <div className="flex items-start">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent h-6 w-6 mr-2 mt-1 flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <p>Interactive dice rolling with realistic animations</p>
              </div>
              <div className="flex items-start">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent h-6 w-6 mr-2 mt-1 flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <p>Campaign management for Dungeon Masters and players</p>
              </div>
            </div>
            <div className="text-center py-4 font-medieval text-xl text-accent">
              "The adventure of a lifetime begins with a single roll of the dice."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
