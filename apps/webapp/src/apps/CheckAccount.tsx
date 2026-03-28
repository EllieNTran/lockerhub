import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { useCheckAccount, useRequestPasswordReset } from '@/services/auth';

type AccountStatus = {
  exists: boolean;
  requiresActivation?: boolean;
  name?: string;
  email?: string;
  message: string;
};

const CheckAccount = () => {
  const [email, setEmail] = useState('');
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState('');

  const checkAccountMutation = useCheckAccount();
  const requestPasswordResetMutation = useRequestPasswordReset();

  const handleCheck = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setAccountStatus(null);

    checkAccountMutation.mutate(email, {
      onSuccess: (result) => {
        setAccountStatus(result);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Failed to check account status.');
      },
    });
  };

  const handleRequestActivation = async () => {
    requestPasswordResetMutation.mutate(email, {
      onSuccess: () => {
        toast.success('Activation link has been sent to your email. Please check your inbox.');
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to send activation email.');
      },
    });
  };

  const renderStatusCard = () => {
    if (!accountStatus) return null;

    if (!accountStatus.exists) {
      return (
        <div className="rounded-lg border border-grey/20 p-4 space-y-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/15">
              <CheckCircle className="h-5 w-5 text-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-dark-blue">Account Not Found</h3>
              <p className="text-sm text-grey mt-1">{accountStatus.message}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="flex-1">
              <Button className="w-full">Create Account</Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">Login Instead</Button>
            </Link>
          </div>
        </div>
      );
    }

    if (accountStatus.requiresActivation) {
      return (
        <div className="rounded-lg border border-dark-blue p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-dark-blue">Activation Required</h3>
              <p className="text-sm text-grey mt-1">{accountStatus.message}</p>
            </div>
          </div>
          <Button
            onClick={handleRequestActivation}
            disabled={requestPasswordResetMutation.isPending}
            className="w-full"
          >
            {requestPasswordResetMutation.isPending ? 'Sending...' : 'Send Activation Email'}
          </Button>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <XCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-dark-blue">Account Already Exists</h3>
            <p className="text-sm text-grey mt-1">{accountStatus.message}</p>
          </div>
        </div>
        <Link to="/">
          <Button className="w-full">Go to Login</Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNav={false} />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Search className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check Your Account</CardTitle>
            <CardDescription className="text-center">
              See if you're already registered in our system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCheck}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red/15 p-3 text-sm text-red">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
              {renderStatusCard()}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!accountStatus && (
                <Button type="submit" className="w-full" disabled={checkAccountMutation.isPending}>
                  {checkAccountMutation.isPending ? 'Checking...' : 'Check Account Status'}
                </Button>
              )}
              {accountStatus && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full hover:bg-secondary hover:text-white hover:border-secondary"
                  onClick={() => {
                    setAccountStatus(null);
                    setEmail('');
                    setError('');
                  }}
                >
                  Check Another Email
                </Button>
              )}
              <p className="text-sm text-center text-grey">
                Want to create a new account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CheckAccount;
