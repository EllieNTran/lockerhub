import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Lock, Mail } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useRequestPasswordReset, storeTokens } from "@/services/auth";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [showActivationPrompt, setShowActivationPrompt] = useState(false);

  const loginMutation = useLogin();
  const requestPasswordResetMutation = useRequestPasswordReset();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (response) => {
          storeTokens(response.accessToken, response.refreshToken);
          localStorage.setItem("userRole", response.user.role);
          navigate(response.user.role === "admin" ? "/admin" : "/user");
        },
        onError: (err) => {
          const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again.";
          if (errorMessage.includes("not activated")) {
            setShowActivationPrompt(true);
          }
          setError(errorMessage);
        },
      }
    );
  };

  const handleForgotPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");

    requestPasswordResetMutation.mutate(email, {
      onSuccess: () => {
        setResetSuccess("Password reset link has been sent to your email.");
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to send reset email.");
      },
    });
  };

  const handleRequestActivation = async () => {
    setError("");
    setResetSuccess("");

    requestPasswordResetMutation.mutate(email, {
      onSuccess: () => {
        setResetSuccess("Activation link has been sent to your email. Please check your inbox.");
        setShowActivationPrompt(false);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to send activation email.");
      },
    });
  };

  const toggleView = () => {
    setShowForgotPassword(!showForgotPassword);
    setError("");
    setResetSuccess("");
    setPassword("");
    setShowActivationPrompt(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNav={false} />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {showForgotPassword ? "Reset Password" : "Login"}
            </CardTitle>
            <CardDescription className="text-center">
              {showForgotPassword && "Enter your email to receive a password reset link"}
            </CardDescription>
            {!showForgotPassword && (
              <p className="text-sm text-center text-grey mt-2">
                Pre-registered staff?{" "}
                <Link to="/check-account" className="text-primary hover:underline font-medium">
                  Check your account status
                </Link>
              </p>
            )}
          </CardHeader>
          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red/15 p-3 text-sm text-red">
                  {error}
                  {showActivationPrompt && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={handleRequestActivation}
                        disabled={requestPasswordResetMutation.isPending}
                        className="w-full"
                        variant="outline"
                      >
                        {requestPasswordResetMutation.isPending ? "Sending..." : "Send Activation Email"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {resetSuccess && (
                <div className="rounded-lg bg-green/15 p-3 text-sm text-green">
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
              <Button type="submit" className="w-full" disabled={loginMutation.isPending || requestPasswordResetMutation.isPending}>
                {loginMutation.isPending || requestPasswordResetMutation.isPending
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
                  <Link to="/signup" className="text-primary hover:underline font-medium">
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

export default Login;
