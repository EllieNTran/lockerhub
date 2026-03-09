import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Lock, Mail } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authService from "@/features/auth/services/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await authService.login({ email, password });
      
      // Store tokens
      authService.storeTokens(response.accessToken, response.refreshToken);
      localStorage.setItem("userRole", response.user.role);
      
      // Redirect based on role
      navigate(response.user.role === "admin" ? "/admin" : "/user");
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResetSuccess("");
    
    try {
      // TODO: Implement password reset request
      // await authService.requestPasswordReset(email);
      setResetSuccess("Password reset link has been sent to your email.");
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setShowForgotPassword(!showForgotPassword);
    setError("");
    setResetSuccess("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNav={false} />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {showForgotPassword ? "Reset Password" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-center">
              {showForgotPassword 
                ? "Enter your email to receive a password reset link"
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-error/15 p-3 text-sm text-error">
                  {error}
                </div>
              )}
              {resetSuccess && (
                <div className="rounded-lg bg-success/15 p-3 text-sm text-success">
                  {resetSuccess}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-grey" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              {!showForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={toggleView}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (showForgotPassword ? "Sending..." : "Signing in...") 
                  : (showForgotPassword ? "Send Reset Link" : "Sign in")}
              </Button>
              {showForgotPassword ? (
                <button
                  type="button"
                  onClick={toggleView}
                  className="text-sm text-center text-grey"
                >
                  Back to{" "}
                  <span className="text-primary hover:underline font-medium">
                    Sign in
                  </span>
                </button>
              ) : (
                <p className="text-sm text-center text-grey">
                  Don't have an account?{" "}
                  <Link to="/" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
