import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) { navigate('/dashboard'); } else { setError('Invalid email or password'); }
    } catch { setError('An error occurred.'); } finally { setIsLoading(false); }
  };

  const fillCredentials = (type: 'hr' | 'employee') => {
    if (type === 'hr') { setEmail('hr@company.com'); setPassword('hr123'); }
    else { setEmail('john.smith@company.com'); setPassword('emp123'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/favicon.png" alt="Catalyr Logo" className="w-12 h-12 object-contain" />
          <div><h1 className="text-2xl font-bold text-foreground">Catalyr</h1><p className="text-sm text-muted-foreground">Human Resource Management</p></div>
        </div>
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive" className="py-2"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required /></div></div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</Button>
            </form>
            {/* <div className="mt-6 pt-6 border-t"><p className="text-xs text-center text-muted-foreground mb-3">Demo Credentials</p><div className="grid grid-cols-2 gap-3"><Button variant="outline" size="sm" onClick={() => fillCredentials('hr')} className="text-xs">HR Login</Button><Button variant="outline" size="sm" onClick={() => fillCredentials('employee')} className="text-xs">Employee Login</Button></div></div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
