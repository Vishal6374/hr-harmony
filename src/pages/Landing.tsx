import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Clock,
    Calendar,
    CreditCard,
    Settings,
    ChevronRight,
    Mail,
    User,
    Building2,
    Send,
    Zap,
    PieChart,
    ArrowRight,
    Shield,
    Check,
    Menu,
    X,
    Briefcase,
    Target,
    BarChart3,
    TrendingUp,
    FileText,
    Award,
    Sparkles,
    Phone,
    Globe,
    PlayCircle,
    CheckCircle2,
    Layers,
    Workflow,
    Linkedin,
    Instagram,
    MapPin,
    UserCog,
    Lock,
    Database,
    Eye,
    FileCheck,
    UserCheck,
    LayoutDashboard,
    ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// Logo Component
const CatalyrLogo = ({ className = "w-9 h-9" }: { className?: string }) => (
    <div className={`${className} rounded-lg bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center shadow-sm relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
        <span className="text-white font-bold text-lg relative z-10">C</span>
    </div>
);

const NAV_LINKS = [
    { name: "Product", href: "#product" },
    { name: "Solutions", href: "#solutions" },
    { name: "Customers", href: "#customers" },
    { name: "Resources", href: "#resources" },
];

const CAPABILITIES = [
    {
        icon: <Users className="w-7 h-7" />,
        title: "Employee Management",
        description: "Complete employee lifecycle management from hire to retire with digital records and self-service portals.",
        color: "from-violet-500 to-purple-600",
        tag: "CORE"
    },
    {
        icon: <Clock className="w-7 h-7" />,
        title: "Time & Attendance",
        description: "Biometric integration, shift management, and real-time attendance tracking with automated notifications.",
        color: "from-blue-500 to-cyan-600",
        tag: "POPULAR"
    },
    {
        icon: <CreditCard className="w-7 h-7" />,
        title: "Payroll Automation",
        description: "Intelligent payroll processing with tax calculations, compliance management, and instant payslip generation.",
        color: "from-emerald-500 to-teal-600",
        tag: "CORE"
    },
    {
        icon: <Calendar className="w-7 h-7" />,
        title: "Leave Management",
        description: "Smart leave policies, approval workflows, balance tracking, and calendar integration.",
        color: "from-orange-500 to-red-600",
        tag: "POPULAR"
    },
    {
        icon: <BarChart3 className="w-7 h-7" />,
        title: "Analytics & Insights",
        description: "Real-time dashboards, custom reports, and predictive analytics for data-driven HR decisions.",
        color: "from-pink-500 to-rose-600",
        tag: "ENTERPRISE"
    },
    {
        icon: <Shield className="w-7 h-7" />,
        title: "Security & Compliance",
        description: "Enterprise-grade security, role-based access control, audit trails, and regulatory compliance.",
        color: "from-indigo-500 to-blue-600",
        tag: "ENTERPRISE"
    }
];

const BENEFITS = [
    { icon: <Zap className="w-5 h-5" />, title: "Deploy in Days", desc: "Quick setup with minimal IT overhead" },
    { icon: <Shield className="w-5 h-5" />, title: "Enterprise Security", desc: "Bank-level encryption and compliance" },
    { icon: <Layers className="w-5 h-5" />, title: "Scalable Platform", desc: "Grows from 10 to 10,000+ employees" },
    { icon: <Workflow className="w-5 h-5" />, title: "Custom Workflows", desc: "Tailored to your business processes" }
];

export default function Landing() {
    const { settings } = useSystemSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVideoModalOpen) {
                setIsVideoModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isVideoModalOpen]);

    const companyName = settings?.company_name || "Catalyr HRMS";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get('fullName'),
                    email: formData.get('email'),
                    company: formData.get('company'),
                    message: formData.get('message'),
                }),
            });

            if (response.ok) {
                toast.success("Thank you! Our team will contact you shortly.");
                form.reset();
            } else {
                throw new Error("Failed to send request.");
            }
        } catch (error: any) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const subject = encodeURIComponent(`Demo Request - ${formData.get('company')}`);
                const body = encodeURIComponent(`Name: ${formData.get('fullName')}\nCompany: ${formData.get('company')}\nEmail: ${formData.get('email')}\n\nMessage:\n${formData.get('message')}`);
                window.location.href = `mailto:catalyr06@gmail.com?subject=${subject}&body=${body}`;
                toast.info("Opening your email client...");
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white font-sans antialiased">
            {/* Top Utility Bar - Salesforce Style */}
            <div className="bg-slate-900 text-white border-b border-slate-800">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-10 text-xs">
                        <div className="flex items-center gap-6">
                            <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-slate-300 transition-colors">
                                <Phone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">+91 123 456 7890</span>
                            </a>
                            <a href="mailto:catalyr06@gmail.com" className="flex items-center gap-2 hover:text-slate-300 transition-colors">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">catalyr06@gmail.com</span>
                            </a>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="#" className="hover:text-slate-300 transition-colors hidden md:inline">Support</a>
                            <a href="#" className="hover:text-slate-300 transition-colors hidden md:inline">Documentation</a>
                            <Link to="/login" className="flex items-center gap-1.5 hover:text-slate-300 transition-colors font-medium">
                                <User className="w-3.5 h-3.5" />
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
                <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <CatalyrLogo />
                            <span className="text-lg font-semibold text-slate-900 tracking-tight">{companyName}</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            {NAV_LINKS.map(link => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={(e) => scrollToSection(e, link.href)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="hidden lg:flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-sm font-medium text-slate-700 hover:text-slate-900"
                            >
                                Watch Demo
                            </Button>
                            <Button
                                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm text-sm font-medium px-5"
                            >
                                Request Demo
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden bg-white border-t border-slate-200"
                        >
                            <div className="px-6 py-4 space-y-1">
                                {NAV_LINKS.map(link => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        onClick={(e) => scrollToSection(e, link.href)}
                                        className="block px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <div className="pt-4 border-t border-slate-200 space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center"
                                        onClick={() => {
                                            document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Watch Demo
                                    </Button>
                                    <Button
                                        className="w-full bg-slate-900 hover:bg-slate-800 justify-center"
                                        onClick={() => {
                                            document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Request Demo
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative bg-gradient-to-b from-slate-50 via-white to-white py-16 lg:py-24 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />

                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            {/* Left Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-6">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Enterprise HR Platform
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                                    Run Your Entire Workforce on
                                    <span className="block bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mt-2">One Intelligent HR Platform</span>
                                </h1>

                                <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
                                    From attendance to payroll — automated, secure, and scalable. Built for Indian enterprises.
                                </p>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                                    <Button
                                        onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                        size="lg"
                                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 text-base px-8 h-12 font-medium group"
                                    >
                                        Request Demo
                                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setIsVideoModalOpen(true)}
                                        className="text-base px-8 h-12 font-medium border-slate-300 hover:bg-slate-50"
                                    >
                                        <PlayCircle className="w-4 h-4 mr-2" />
                                        Watch Overview
                                    </Button>
                                </div>

                                {/* Trust Signal Strip */}
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="font-semibold">Made in India 🇮🇳</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="font-semibold">ISO-ready Security</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="font-semibold">500+ Companies</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="font-semibold">Biometric-ready</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Visual */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="relative rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-8 shadow-2xl">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { icon: <Users className="w-6 h-6" />, label: "Employee Hub", value: "10K+", color: "from-violet-500 to-purple-600" },
                                            { icon: <Clock className="w-6 h-6" />, label: "Uptime", value: "99.9%", color: "from-blue-500 to-cyan-600" },
                                            { icon: <CreditCard className="w-6 h-6" />, label: "Payroll", value: "Auto", color: "from-emerald-500 to-teal-600" },
                                            { icon: <BarChart3 className="w-6 h-6" />, label: "Analytics", value: "Real-time", color: "from-orange-500 to-red-600" }
                                        ].map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                                                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                                            >
                                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-4`}>
                                                    {item.icon}
                                                </div>
                                                <div className="text-2xl font-bold text-slate-900 mb-1">{item.value}</div>
                                                <div className="text-xs font-medium text-slate-600">{item.label}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Product Capabilities */}
                <section id="product" className="py-20 lg:py-28 bg-white">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                Complete HR Suite in One Platform
                            </h2>
                            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                                Everything you need to manage your workforce efficiently, from hiring to retirement.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {CAPABILITIES.map((capability, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-400 hover:shadow-2xl transition-all duration-300"
                                >
                                    {/* Tag */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${capability.tag === 'CORE' ? 'bg-violet-100 text-violet-700' :
                                            capability.tag === 'POPULAR' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {capability.tag}
                                        </span>
                                    </div>

                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${capability.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {capability.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{capability.title}</h3>
                                    <p className="text-slate-600 leading-relaxed mb-4">{capability.description}</p>

                                    {/* View workflow link - appears on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                            View workflow
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Subtle glow effect on hover */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section - NEW */}
                <section className="py-20 lg:py-28 bg-slate-50">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                How Catalyr Works
                            </h2>
                            <p className="text-lg text-slate-600">
                                Get started in 4 simple steps. From onboarding to insights, everything is automated.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Connection Line */}
                            <div className="absolute top-12 left-0 right-0 h-0.5 bg-slate-200 hidden lg:block"
                                style={{ left: '10%', right: '10%' }} />

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                                {[
                                    {
                                        step: "01",
                                        icon: <UserCheck className="w-6 h-6" />,
                                        title: "Onboard Employees",
                                        description: "Add employees, set roles, departments, and access permissions in minutes."
                                    },
                                    {
                                        step: "02",
                                        icon: <Clock className="w-6 h-6" />,
                                        title: "Sync Attendance",
                                        description: "Connect biometric devices or use manual entry. Real-time sync across all systems."
                                    },
                                    {
                                        step: "03",
                                        icon: <CreditCard className="w-6 h-6" />,
                                        title: "Auto Payroll & Compliance",
                                        description: "Automated salary calculation, tax deductions, and statutory compliance reports."
                                    },
                                    {
                                        step: "04",
                                        icon: <BarChart3 className="w-6 h-6" />,
                                        title: "Insights & Reports",
                                        description: "Real-time dashboards, custom reports, and actionable workforce analytics."
                                    }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: idx * 0.15 }}
                                        className="relative"
                                    >
                                        {/* Step Number Circle */}
                                        <div className="flex justify-center mb-6">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center shadow-lg z-10 relative">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-slate-900">{item.step}</div>
                                                    </div>
                                                </div>
                                                {/* Icon Badge */}
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-lg z-20">
                                                    {item.icon}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases by Role Section - NEW */}
                <section className="py-20 lg:py-28 bg-white">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                Built for Everyone in Your Organization
                            </h2>
                            <p className="text-lg text-slate-600">
                                Tailored experiences for every role — from admins to employees.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: <UserCog className="w-6 h-6" />,
                                    role: "Admin",
                                    tagline: "Full control & compliance",
                                    color: "from-violet-500 to-purple-600",
                                    features: [
                                        "System configuration",
                                        "User management",
                                        "Audit logs & security",
                                        "Compliance reports"
                                    ]
                                },
                                {
                                    icon: <Briefcase className="w-6 h-6" />,
                                    role: "HR",
                                    tagline: "Payroll, attendance, leave",
                                    color: "from-blue-500 to-cyan-600",
                                    features: [
                                        "Employee onboarding",
                                        "Payroll processing",
                                        "Leave approvals",
                                        "Performance tracking"
                                    ]
                                },
                                {
                                    icon: <User className="w-6 h-6" />,
                                    role: "Employee",
                                    tagline: "Self-service portal",
                                    color: "from-emerald-500 to-teal-600",
                                    features: [
                                        "View payslips",
                                        "Apply for leave",
                                        "Check attendance",
                                        "Update profile"
                                    ]
                                },
                                {
                                    icon: <LayoutDashboard className="w-6 h-6" />,
                                    role: "Management",
                                    tagline: "Reports & analytics",
                                    color: "from-orange-500 to-red-600",
                                    features: [
                                        "Workforce analytics",
                                        "Cost analysis",
                                        "Department insights",
                                        "Trend forecasting"
                                    ]
                                }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {item.icon}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{item.role}</h3>
                                    <p className="text-sm text-slate-600 mb-4">{item.tagline}</p>

                                    {/* Features - shown on hover */}
                                    <div className="space-y-2 max-h-0 group-hover:max-h-48 overflow-hidden transition-all duration-300">
                                        {item.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-2 text-sm text-slate-700">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Gradient overlay on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Solutions Section - Enterprise Scale */}
                <section id="solutions" className="py-20 lg:py-28 bg-slate-50">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                    Built for Enterprise Scale
                                </h2>
                                <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                                    Our platform is designed to grow with your organization, providing the flexibility and power you need at every stage.
                                </p>

                                <div className="space-y-6">
                                    {BENEFITS.map((benefit, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                                {benefit.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">{benefit.title}</h4>
                                                <p className="text-slate-600 text-sm">{benefit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="mt-10 bg-slate-900 hover:bg-slate-800 text-white group"
                                >
                                    Learn More
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                                    <h3 className="text-xl font-bold text-slate-900 mb-6">Impact Metrics</h3>
                                    <div className="space-y-6">
                                        {[
                                            {
                                                label: "Implementation Time",
                                                value: "2-4 weeks",
                                                progress: 85,
                                                tooltip: "From planning to go-live"
                                            },
                                            {
                                                label: "User Adoption Rate",
                                                value: "94%",
                                                progress: 94,
                                                tooltip: "94% adoption within 30 days"
                                            },
                                            {
                                                label: "Time Saved",
                                                value: "40 hrs/month",
                                                progress: 75,
                                                tooltip: "Average HR team time savings"
                                            },
                                            {
                                                label: "ROI Achievement",
                                                value: "6 months",
                                                progress: 90,
                                                tooltip: "Typical payback period"
                                            }
                                        ].map((stat, idx) => (
                                            <div key={idx} className="group relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-slate-700">{stat.label}</span>
                                                    <span className="text-sm font-bold text-slate-900">{stat.value}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${stat.progress}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full"
                                                    />
                                                </div>
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                    {stat.tooltip}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Before/After Comparison */}
                                    <div className="mt-8 pt-8 border-t border-slate-200">
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500 mb-2">Before HRMS</div>
                                                <div className="text-2xl font-bold text-red-600">15+ hrs</div>
                                                <div className="text-xs text-slate-600">Manual payroll</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500 mb-2">After Catalyr</div>
                                                <div className="text-2xl font-bold text-emerald-600">2 hrs</div>
                                                <div className="text-xs text-slate-600">Automated</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Customers Section */}
                <section id="customers" className="py-20 lg:py-28 bg-white">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                Trusted by Leading Organizations
                            </h2>
                            <p className="text-lg text-slate-600">
                                Join hundreds of companies that have transformed their HR operations with our platform.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { stat: "500+", label: "Active Companies", icon: <Building2 className="w-6 h-6" /> },
                                { stat: "50,000+", label: "Employees Managed", icon: <Users className="w-6 h-6" /> },
                                { stat: "99.9%", label: "System Uptime", icon: <Shield className="w-6 h-6" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
                                        {item.icon}
                                    </div>
                                    <div className="text-4xl font-bold text-slate-900 mb-2">{item.stat}</div>
                                    <div className="text-slate-600 font-medium">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Security & Compliance Section - NEW */}
                <section id="security" className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />

                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold mb-6">
                                <Shield className="w-3.5 h-3.5" />
                                Enterprise-Grade Security
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
                                Security & Compliance Built-In
                            </h2>
                            <p className="text-lg text-slate-300">
                                Your data is protected with bank-level security and compliance standards.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <Lock className="w-6 h-6" />,
                                    title: "Role-Based Access Control",
                                    description: "Granular permissions for every user role. Control who sees what, down to field level."
                                },
                                {
                                    icon: <FileCheck className="w-6 h-6" />,
                                    title: "Audit Logs",
                                    description: "Complete activity tracking. Every action logged with timestamp and user details."
                                },
                                {
                                    icon: <Database className="w-6 h-6" />,
                                    title: "Data Encryption",
                                    description: "AES-256 encryption at rest and TLS 1.3 in transit. Your data is always protected."
                                },
                                {
                                    icon: <Shield className="w-6 h-6" />,
                                    title: "Biometric Compliance",
                                    description: "Secure biometric data handling compliant with Indian privacy regulations."
                                },
                                {
                                    icon: <FileText className="w-6 h-6" />,
                                    title: "Payroll Statutory Support",
                                    description: "Built-in support for PF, ESI, PT, TDS, and other Indian statutory requirements."
                                },
                                {
                                    icon: <Eye className="w-6 h-6" />,
                                    title: "Regular Security Audits",
                                    description: "Quarterly penetration testing and security assessments by certified experts."
                                }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Compliance Badges */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
                            {[
                                "ISO 27001 Ready",
                                "GDPR Compliant",
                                "SOC 2 Type II",
                                "Indian IT Act 2000"
                            ].map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-medium">{badge}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Resources Section */}
                <section id="resources" className="py-20 lg:py-28 bg-slate-50">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                                Why Choose {companyName}?
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: <Award className="w-6 h-6" />, title: "Lifetime License", desc: "One-time investment, no recurring fees" },
                                { icon: <Settings className="w-6 h-6" />, title: "Custom Setup", desc: "Tailored to your business needs" },
                                { icon: <Phone className="w-6 h-6" />, title: "Dedicated Support", desc: "24/7 assistance from our team" },
                                { icon: <Zap className="w-6 h-6" />, title: "Quick Deployment", desc: "Go live in weeks, not months" }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-4">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Demo Request Section */}
                <section id="demo" className="py-20 lg:py-28 bg-white">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="grid lg:grid-cols-5">
                                {/* Left Side - Benefits */}
                                <div className="lg:col-span-2 p-10 lg:p-12 text-white">
                                    <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                                        See how our platform can transform your HR operations. Our team will provide a personalized walkthrough.
                                    </p>

                                    <div className="space-y-4 mb-10">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">What's Included</h3>
                                        {[
                                            "Personalized product demonstration",
                                            "Custom implementation roadmap",
                                            "Pricing and licensing options",
                                            "Technical requirements review"
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <span className="text-slate-200">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* What happens next */}
                                    <div className="pt-8 border-t border-white/10">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">What Happens Next?</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">We contact you in 24 hours</div>
                                                    <div className="text-xs text-slate-400">Our team reaches out to schedule</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">Personalized walkthrough</div>
                                                    <div className="text-xs text-slate-400">30-45 min demo tailored to your needs</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">Pricing discussion</div>
                                                    <div className="text-xs text-slate-400">Custom quote based on your requirements</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Form */}
                                <div className="lg:col-span-3 bg-white p-10 lg:p-12">
                                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-slate-900">
                                        Request a Demo
                                    </h2>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 mb-2 block">
                                                    Full Name *
                                                </Label>
                                                <Input
                                                    id="fullName"
                                                    name="fullName"
                                                    placeholder="John Doe"
                                                    required
                                                    className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2 block">
                                                    Work Email *
                                                </Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="john@company.com"
                                                    required
                                                    className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="company" className="text-sm font-semibold text-slate-700 mb-2 block">
                                                Company Name *
                                            </Label>
                                            <Input
                                                id="company"
                                                name="company"
                                                placeholder="Acme Corporation"
                                                required
                                                className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="message" className="text-sm font-semibold text-slate-700 mb-2 block">
                                                Message (Optional)
                                            </Label>
                                            <Textarea
                                                id="message"
                                                name="message"
                                                placeholder="Tell us about your requirements..."
                                                className="min-h-[120px] resize-none border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-base font-semibold shadow-lg group"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Sending...
                                                </span>
                                            ) : (
                                                <>
                                                    Submit Request
                                                    <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </Button>

                                        <p className="text-xs text-slate-500 text-center">
                                            By submitting this form, you agree to our privacy policy.
                                        </p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:14px_24px]" />

                <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative">
                    {/* Main Footer Content */}
                    <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {/* Company Info */}
                        <div>
                            <Link to="/" className="flex items-center gap-3 mb-6 group">
                                <CatalyrLogo className="w-10 h-10" />
                                <span className="text-xl font-semibold group-hover:text-slate-300 transition-colors">{companyName}</span>
                            </Link>
                            <p className="text-slate-400 leading-relaxed max-w-sm">
                                Enterprise-grade HRMS platform designed to streamline your workforce management and drive business growth.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Product</h3>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#product" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Features</a></li>
                                <li><a href="#solutions" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Solutions</a></li>
                                <li><a href="#demo" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Request Demo</a></li>
                                {/* <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Integrations</a></li> */}
                                <li><a href="#security" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Security</a></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Resources</h3>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Documentation</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">API Reference</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Help Center</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Privacy Policy</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">Terms of Service</a></li>

                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact</h3>
                            <div className="space-y-3 mb-6">
                                <a href="mailto:catalyr06@gmail.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    <Mail className="w-4 h-4" />
                                    <span>catalyr06@gmail.com</span>
                                </a>
                                <a href="tel:+919791757215" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    <Phone className="w-4 h-4" />
                                    <span>+91 97917 57215</span>
                                </a>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>Sankagiri</span>
                                </div>
                            </div>

                            {/* Social Icons */}
                            <div className="flex items-center gap-3">
                                <a href="https://www.linkedin.com/company/catalyr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group">
                                    <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </a>
                                <a href="https://www.catalyr.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group">
                                    <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </a>
                                <a href="https://www.instagram.com/catalyr_/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group">
                                    <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="py-8 border-t border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                                <span>© {new Date().getFullYear()} {companyName}. All rights reserved.</span>
                                {/* <a href="#" className="hover:text-white transition-colors hover:underline">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors hover:underline">Terms of Service</a>
                                <a href="#" className="hover:text-white transition-colors hover:underline">Cookie Policy</a> */}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400">Built with</span>
                                <span className="text-red-500 animate-pulse">❤️</span>
                                <span className="text-slate-400">in India</span>
                                <span className="text-slate-400">• v1.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Video Modal */}
            <AnimatePresence>
                {isVideoModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsVideoModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3, type: "spring", damping: 25 }}
                            className="relative w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsVideoModalOpen(false)}
                                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all group"
                            >
                                <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                            </button>

                            {/* Video Container */}
                            <div className="relative aspect-video bg-black">
                                {/* Replace this with your actual video URL */}
                                <iframe
                                    className="w-full h-full"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                                    title="Product Overview Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-t border-white/10">
                                <h3 className="text-xl font-bold text-white mb-2">Catalyr HRMS Overview</h3>
                                <p className="text-slate-400 text-sm">
                                    See how our platform transforms workforce management for modern enterprises.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
