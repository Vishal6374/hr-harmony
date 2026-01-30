import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, ChevronRight, UserCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '@/components/ui/Loader';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back to Catalyr!');
        navigate('/dashboard');
      } else {
        toast.error('Access denied. Please check your credentials.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (type: 'hr' | 'employee') => {
    if (type === 'hr') {
      setEmail('hr@company.com');
      setPassword('hr123');
    } else {
      setEmail('john.smith@company.com');
      setPassword('emp123');
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side - Premium Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Animation/Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-blue-950/95 to-black z-10" />
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80"
            alt="Modern Office"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-20 flex items-center gap-3"
        >
          <div className="">
            <img src="/favicon.png" alt="Catalyr Logo" className="w-8 h-8" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Catalyr HRMS
          </span>
        </motion.div>

        {/* Content */}
        <div className="relative z-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold leading-tight mb-6">
              The Intelligent Way to <br />
              <span className="text-blue-400">Manage Your Workforce.</span>
            </h2>
            <p className="text-lg text-blue-100/80 mb-8 max-w-md leading-relaxed">
              Experience a seamless HR management journey. From attendance to payroll,
              everything you need in one powerful platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm text-blue-200/60 font-medium">
              Join 5,000+ teams worldwide
            </p>
          </motion.div>
        </div>

        {/* Footer Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="relative z-20 pt-12 border-t border-white/10"
        >
          <p className="text-sm italic text-blue-100/60">
            "Catalyr has completely transformed our HR processes. Highly recommended for any growing enterprise."
          </p>
          <p className="mt-2 text-sm font-semibold">— Founder @ Catalyr</p>
        </motion.div>
      </div>

      {/* Right Side - Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-zinc-50/50 dark:bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] space-y-8"
        >
          <div className="text-center lg:text-left">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <img src="/favicon.png" alt="Catalyr Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold">Catalyr HRMS</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome back</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Enter your work email to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Work Email</Label>
              <div className="group relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-blue-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Enter your password" className="text-zinc-700 dark:text-zinc-300">Password</Label>
                {/* <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 hover:underline">Forgot password?</a> */}
              </div>
              <div className="group relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-blue-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader size="small" variant="white" />
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Quick Access Section
          <div className="pt-4">
            <button
              onClick={() => setShowQuickAccess(!showQuickAccess)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mx-auto lg:mx-0"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Need help signing in? Try Guest Access
            </button>

            <AnimatePresence>
              {showQuickAccess && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4 grid grid-cols-2 gap-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                    onClick={() => fillCredentials('hr')}
                  >
                    <UserCheck className="w-4 h-4 mr-2 text-blue-500" />
                    HR Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                    onClick={() => fillCredentials('employee')}
                  >
                    <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
                    Employee
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed px-8">
            By signing in, you agree to our <br />
            <a href="#" className="underline underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
