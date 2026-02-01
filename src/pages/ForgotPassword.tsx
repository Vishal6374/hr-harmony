import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Loader from '@/components/ui/Loader';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { authService } from '@/services/apiService';

export default function ForgotPassword() {
    const { settings } = useSystemSettings();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const navigate = useNavigate(); // Not using navigate for now

    const bgImage = settings?.login_bg_url || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80";
    const logo = settings?.login_logo_url || settings?.company_logo_url || "/favicon.png";
    const companyName = settings?.company_name || "Catalyr HRMS";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            toast.success('Password reset link sent to your email!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-background">
            {/* Left Side - Premium Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-blue-950/95 to-black z-10" />
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.6 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        src={bgImage}
                        alt="Office"
                        className="w-full h-full object-cover"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative z-20 flex items-center gap-3"
                >
                    <div className="">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {companyName}
                    </span>
                </motion.div>

                <div className="relative z-20">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                    >
                        <h2 className="text-4xl font-bold leading-tight mb-6">
                            Forgot Your Password? <br />
                            <span className="text-blue-400">No Worries.</span>
                        </h2>
                        <p className="text-lg text-blue-100/80 mb-8 max-w-md leading-relaxed">
                            We'll send you a link to reset your password and get you back on track.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="relative z-20 pt-12 border-t border-white/10"
                >
                    <p className="text-sm italic text-blue-100/60">
                        "{companyName} - Secure and Reliable."
                    </p>
                </motion.div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-zinc-50/50 dark:bg-zinc-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[420px] space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>

                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Reset Password</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Enter your email address and we'll send you a link to reset your password.</p>
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

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader size="small" variant="white" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Send Reset Link <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
