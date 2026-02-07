import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { publicService } from '@/services/apiService'; // Removed as requested
import {
    Users,
    Clock,
    Calendar,
    CreditCard,
    CheckSquare,
    Settings,
    ChevronRight,
    Mail,
    User,
    Building2,
    Send,
    Sparkles,
    ShieldCheck,
    Zap,
    Globe,
    PieChart,
    ArrowRight,
    Shield,
    Smartphone,
    Headphones,
    Check,
    Menu,
    X,
    Briefcase,
    Search,
    Globe2,
    Play,
    ArrowUpRight,
    ExternalLink,
    Target,
    Database,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// --- HRM Focus Constants & Data ---

const NAV_LINKS = [
    { name: "Features", href: "#features" },
    { name: "Platform", href: "#solutions" },
    { name: "Industries", href: "#industries" },
    { name: "Resources", href: "#resources" },
];



const SECONDARY_NAV = [
    { name: "Contact us", href: "#demo-request" },
    { name: "Support", href: "#" }
]

const INDUSTRY_CARDS = [
    { title: "Financial Services", icon: <CreditCard className="w-5 h-5" /> },
    { title: "Retail & E-commerce", icon: <Briefcase className="w-5 h-5" /> },
    { title: "Manufacturing", icon: <Settings className="w-5 h-5" /> },
    { title: "Public Sector", icon: <Building2 className="w-5 h-5" /> },
    { title: "Healthcare", icon: <Shield className="w-5 h-5" /> },
    { title: "IT & Tech", icon: <Globe2 className="w-5 h-5" /> },
    { title: "Education", icon: <Target className="w-5 h-5" /> },
    { title: "Hospitality", icon: <Users className="w-5 h-5" /> }
];



const RESOURCE_CARDS = [
    {
        title: "The 2024 HR Compliance Report",
        category: "REPORT",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400"
    },
    {
        title: "Optimizing Payroll for Global Teams",
        category: "PLAYBOOK",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400"
    },
    {
        title: "Employee Engagement Strategies",
        category: "E-BOOK",
        image: "https://images.unsplash.com/photo-1522071823992-b48e0238c55a?auto=format&fit=crop&q=80&w=400"
    },
];

// --- Sub-components ---

const SectionHeader = ({ badge, title, subtitle, centered = true, dark = false }: any) => (
    <div className={`mb-16 ${centered ? 'text-center' : 'text-left'}`}>
        {badge && (
            <span className={`inline-block text-xs font-bold tracking-[0.1em] uppercase mb-4 ${dark ? 'text-blue-300' : 'text-blue-600'}`}>
                {badge}
            </span>
        )}
        <h2 className={`text-4xl md:text-5xl font-extrabold leading-tight mb-6 ${dark ? 'text-white' : 'text-[#032d60]'}`}>
            {title}
        </h2>
        {subtitle && (
            <p className={`text-xl max-w-3xl leading-relaxed ${centered ? 'mx-auto' : ''} ${dark ? 'text-blue-100' : 'text-[#032d60]/80'}`}>
                {subtitle}
            </p>
        )}
    </div>
);

// --- Main Component ---

export default function Landing() {
    const { settings } = useSystemSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const logo = settings?.company_logo_url || "/favicon.png";
    const companyName = settings?.company_name || "HR Harmony";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const form = e.currentTarget;

        const formData = new FormData(form);
        const name = formData.get('fullName');
        const email = formData.get('email');
        const company = formData.get('company');
        const message = formData.get('message');

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    company,
                    message,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Thank you! Your request has been sent successfully.");
                form.reset();
            } else {
                throw new Error(data.message || "Failed to send request.");
            }
        } catch (error: any) {
            console.error('Contact Form Error:', error);

            // Only fallback to mailto if it's an actual sending/network failure
            // and not a code error in our logic
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const subject = encodeURIComponent(`Demo Request from ${name}`);
                const body = encodeURIComponent(`Name: ${name}\nCompany: ${company}\nMessage: ${message}`);
                window.location.href = `mailto:catalyr06@gmail.com?subject=${subject}&body=${body}`;
                toast.info("Direct sending failed. Opening your email client instead.");
            } else if (!form.checkValidity()) {
                toast.error("Please check your form for errors.");
            } else {
                // If it's the Vite simulation or a successful backend mock, we don't mailto
                // But if we're here, something else broke.
                toast.error(error.message || "An unexpected error occurred.");
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
        <div className="min-h-screen bg-white font-sans text-[#032d60] selection:bg-[#0176d3] selection:text-white" id="top">

            {/* --- Top Banner --- */}
            {/* <div className="bg-[#5c0076] text-white py-2 px-6 text-center text-sm font-semibold relative z-[110]">
                <span className="flex items-center justify-center gap-2">
                    The next generation of HRM is here. Experience Pulse today.
                </span>
            </div> */}

            {/* --- Main Navigation --- */}
            <nav className={`fixed top-0 w-full z-[100] transition-all bg-white border-b border-zinc-100 py-3 ${scrolled ? 'shadow-sm' : ''}`}>
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-[#0176d3] flex items-center justify-center text-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-[#032d60] sm:block hidden">
                                {companyName}
                            </span>
                        </Link>


                        <div className="hidden lg:flex items-center gap-8">
                            {NAV_LINKS.map(link => (
                                <a key={link.name} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="text-[15px] font-semibold text-[#032d60] hover:text-[#0176d3]">
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden xl:flex items-center gap-6 text-[14px] font-semibold border-r border-zinc-200 pr-6 mr-2">
                            {SECONDARY_NAV.map(link => (
                                <a key={link.name} href={link.href} className="hover:text-[#0176d3] flex items-center gap-1.5 capitalize">
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-5">
                            <Link to="/login" className="hidden sm:block">
                                <button className="p-2 text-zinc-500 hover:text-[#0176d3] flex items-center gap-2 font-semibold">
                                    <User className="w-5 h-5" /> Login
                                </button>
                            </Link>
                            <Button
                                onClick={() => document.getElementById('demo-request')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-[#0176d3] hover:bg-[#015ba1] text-white font-bold px-6 py-5 h-auto text-[15px] rounded-lg shadow-none transition-all"
                            >
                                Request Demo
                            </Button>

                        </div>

                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-zinc-600">
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Mobile Menu --- */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="fixed top-[73px] left-0 w-full bg-white z-[90] border-b lg:hidden shadow-xl"
                    >
                        <div className="p-6 space-y-4">
                            {NAV_LINKS.map(link => (
                                <a key={link.name} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="block text-lg font-bold">
                                    {link.name}
                                </a>
                            ))}
                            <hr />
                            <Link to="/login" className="block text-lg font-bold">Login</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pt-[73px]">

                {/* --- Hero Section --- */}
                <section className="bg-[#032d60] text-white py-24 lg:py-32 relative overflow-hidden">
                    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10 text-center">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-[#00a1e0] uppercase tracking-[0.2em] font-black text-sm mb-6">World Class HRM Platform</p>
                            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-8">
                                The future of work is <span className="text-[#00a1e0]">unified</span>.
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-100/90 leading-relaxed mb-12 max-w-3xl mx-auto font-medium">
                                Empower your workforce with an integrated HRM system that handles payroll, attendance, and employee management in one place.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                                <Button
                                    onClick={() => document.getElementById('demo-request')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-[#0176d3] hover:bg-[#015ba1] text-white h-14 px-10 text-lg font-bold rounded-lg w-full sm:w-auto"
                                >
                                    Request a demo
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-white text-white hover:bg-white/10 h-14 px-10 text-lg font-bold rounded-lg w-full sm:w-auto bg-transparent"
                                >
                                    See Features
                                </Button>
                            </div>
                        </div>

                        {/* --- Hero Images/Icons --- */}
                        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto">
                            {[
                                { title: "Employee Directory", icon: <Users className="w-8 h-8" />, desc: "Centralized database for all staff." },
                                { title: "Smart Payroll", icon: <CreditCard className="w-8 h-8" />, desc: "Automated, error-free processing." },
                                { title: "Attendance Sync", icon: <Clock className="w-8 h-8" />, desc: "Real-time biometric integration." }
                            ].map((v, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl text-left hover:bg-white/10 transition-colors cursor-default">
                                    <div className="text-[#00a1e0] mb-6">{v.icon}</div>
                                    <h3 className="text-xl font-bold mb-2">{v.title}</h3>
                                    <p className="opacity-70">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- Core Features Grid --- */}
                <section id="features" className="py-24 bg-white">
                    <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
                        <div className="grid lg:grid-cols-2 gap-20 items-center mb-40">
                            <div>
                                <SectionHeader
                                    centered={false}
                                    badge="Unified HR"
                                    title="Manage your people, not just data."
                                    subtitle="Get all your core HRM tools in one unified workspace. We make employee management simple and efficient."
                                />
                                <ul className="space-y-6 mb-10">
                                    <li className="flex items-center gap-4 text-lg font-bold border-b border-zinc-50 pb-4">
                                        <div className="p-2 rounded-lg bg-blue-50 text-[#0176d3]"><User className="w-5 h-5" /></div>
                                        Digital Employee Records
                                    </li>
                                    <li className="flex items-center gap-4 text-lg font-bold border-b border-zinc-50 pb-4">
                                        <div className="p-2 rounded-lg bg-green-50 text-green-600"><Clock className="w-5 h-5" /></div>
                                        Automated Leave Tracking
                                    </li>
                                    <li className="flex items-center gap-4 text-lg font-bold border-b border-zinc-100 pb-4">
                                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600"><BarChart3 className="w-5 h-5" /></div>
                                        Performance Analytics
                                    </li>
                                </ul>
                                <Button className="bg-[#0176d3] text-white font-bold h-14 px-10 rounded-lg">Explore Core HR</Button>
                            </div>
                            <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-zinc-100">
                                <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1000" alt="Platform UI" className="w-full opacity-90" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent" />
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="order-2 lg:order-1 relative rounded-[40px] overflow-hidden shadow-2xl bg-[#032d60]">
                                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000" alt="Payroll" className="w-full opacity-70" />
                            </div>
                            <div className="order-1 lg:order-2">
                                <SectionHeader
                                    centered={false}
                                    badge="Payroll Excellence"
                                    title="Automated Payroll, Zero Compliance Risks"
                                    subtitle="Our engine handles complex tax slabs, deductions, and allowances automatically based on real-time attendance."
                                />
                                <p className="text-xl text-[#032d60]/80 mb-8 leading-relaxed font-medium">
                                    Say goodbye to manual error-prone spreadsheets. Process payroll for thousands of employees in minutes with full regulatory compliance.
                                </p>
                                <Button className="bg-[#0176d3] text-white font-bold h-14 px-10 rounded-lg">View Payroll Demo</Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Platform Wheel Section --- */}
                <section id="solutions" className="py-24 bg-[#f8f9fb] border-y border-zinc-200 overflow-hidden">
                    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 text-center">
                        <SectionHeader
                            title="The Integrated HRM Operating System"
                            subtitle="Experience a unified platform where every module works in perfect harmony."
                        />

                        <div className="relative max-w-5xl mx-auto mt-28">
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-blue-400/10 blur-[120px] rounded-full scale-150 -z-10" />

                            {/* The Circle Container */}
                            <div className="relative aspect-square max-w-[700px] mx-auto flex items-center justify-center p-8 md:p-12">
                                {/* Outermost Ring */}
                                <div className="absolute inset-0 border-[32px] border-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.05)]" />

                                {/* Main Colored Segments (CSS-based wheel) */}
                                <div className="w-full h-full rounded-full border-2 border-blue-50 relative flex items-center justify-center">
                                    {/* Inner Circle Content */}
                                    <div className="w-56 h-56 rounded-full bg-white shadow-2xl border border-blue-100 flex flex-col items-center justify-center z-20 text-center p-6 relative">
                                        <img src={logo} className="w-16 h-16 mb-4 object-contain opacity-80" alt="Logo" />
                                        <h4 className="text-2xl font-black text-[#032d60] leading-tight">Pulse 360</h4>
                                        <div className="mt-2 text-[10px] font-black text-[#0176d3] uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full">One Core Data</div>
                                    </div>

                                    {/* Floating Modules around the center */}
                                    {[
                                        { t: "Recruitment", i: <Briefcase className="w-5 h-5" />, pos: "top-[-5%] left-1/2 -translate-x-1/2", bg: "bg-rose-50", c: "text-rose-600" },
                                        { t: "Payroll", i: <CreditCard className="w-5 h-5" />, pos: "top-[15%] right-[0%]", bg: "bg-emerald-50", c: "text-emerald-600" },
                                        { t: "Attendance", i: <Clock className="w-5 h-5" />, pos: "bottom-[15%] right-[0%]", bg: "bg-amber-50", c: "text-amber-600" },
                                        { t: "Performance", i: <Target className="w-5 h-5" />, pos: "bottom-[-5%] left-1/2 -translate-x-1/2", bg: "bg-purple-50", c: "text-purple-600" },
                                        { t: "Learning", i: <Shield className="w-5 h-5" />, pos: "bottom-[15%] left-[0%]", bg: "bg-indigo-50", c: "text-indigo-600" },
                                        { t: "Core HR", i: <Users className="w-5 h-5" />, pos: "top-[15%] left-[0%]", bg: "bg-blue-50", c: "text-blue-600" }
                                    ].map((m, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.1 }}
                                            className={`absolute ${m.pos} bg-white px-6 py-4 rounded-2xl shadow-xl border border-zinc-100 flex items-center gap-4 z-30 cursor-pointer min-w-[180px]`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl ${m.bg} ${m.c} flex items-center justify-center shrink-0`}>
                                                {m.i}
                                            </div>
                                            <span className="font-black text-sm text-[#032d60]">{m.t}</span>
                                        </motion.div>
                                    ))}

                                    {/* Connecting Lines (SVG background) */}
                                    <svg className="absolute inset-0 w-full h-full -z-10 opacity-10" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#0176d3" strokeWidth="0.5" strokeDasharray="2 2" />
                                        <line x1="50" y1="50" x2="50" y2="10" stroke="#0176d3" strokeWidth="0.5" />
                                        <line x1="50" y1="50" x2="90" y2="50" stroke="#0176d3" strokeWidth="0.5" />
                                        <line x1="50" y1="50" x2="10" y2="50" stroke="#0176d3" strokeWidth="0.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* --- Industry Focus --- */}
                <section id="industries" className="py-24 bg-white">
                    <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
                        <SectionHeader
                            title="Solutions by Industry"
                            subtitle="Specialized workflows tailored to the needs of your business sector."
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
                            {INDUSTRY_CARDS.map((card, idx) => (
                                <div key={idx} className="bg-white border border-zinc-200 p-8 rounded-2xl hover:border-[#0176d3] hover:shadow-lg transition-all text-left">
                                    <div className="text-[#0176d3] mb-6">{card.icon}</div>
                                    <h4 className="font-black text-lg leading-tight">{card.title}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>



                {/* --- Resources Section --- */}
                <section id="resources" className="py-24 bg-[#f8f9fb]">
                    <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
                        <SectionHeader title="Latest Resources" />
                        <div className="grid md:grid-cols-3 gap-8">
                            {RESOURCE_CARDS.map((res, i) => (
                                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer border border-zinc-100">
                                    <img src={res.image} className="h-48 w-full object-cover grayscale transition-all group-hover:grayscale-0" alt={res.title} />
                                    <div className="p-8 flex flex-col justify-between flex-grow text-left">
                                        <div>
                                            <span className="text-xs font-black tracking-widest text-[#0176d3] uppercase">{res.category}</span>
                                            <h4 className="text-2xl font-bold text-[#032d60] mt-4 leading-tight group-hover:text-[#0176d3] transition-colors">{res.title}</h4>
                                        </div>
                                        <div className="mt-8 font-black text-[#0176d3] text-sm group-hover:underline flex items-center gap-1 uppercase tracking-widest">
                                            Read more <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>



                {/* --- FAQ --- */}

                <section id="faq" className="py-24 bg-white text-left border-t border-zinc-100">
                    <div className="max-w-4xl mx-auto px-6">
                        <h2 className="text-4xl font-black text-center mb-16">Questions? We have answers.</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {[
                                { q: "What is an HRM?", a: "Human Resource Management (HRM) refers to the strategic approach to the effective management of people in an organization so that they help the business to gain a competitive advantage." },
                                { q: "How secure is employee data?", a: "We use banking-grade encryption and ISO 27001 certified data centers to ensure your workforce data is always safe and private." },
                                { q: "Can we integrate biometric devices?", a: "Absolutely. Our Attendance module supports direct API integration with most ZKTeco and Hikvision biometric devices." },
                                { q: "Is there a demo available?", a: "Yes, you can request a live walkthrough with one of our product experts by filling out the form below." }
                            ].map((faq, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border-b border-zinc-200">
                                    <AccordionTrigger className="text-left font-bold text-xl py-6 hover:no-underline hover:text-[#0176d3]">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-zinc-600 text-lg pb-6 leading-relaxed">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* --- Demo Form --- */}
                <section id="demo-request" className="py-24 bg-[#f8f9fb]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-zinc-100">
                            <div className="lg:w-1/2 p-12 lg:p-20 bg-[#032d60] text-white text-left">
                                <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Request a Personalized Demo.</h2>
                                <p className="text-xl text-blue-100/80 mb-12">See how our HRM can help streamline your operations and empower your people.</p>
                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <Check className="text-[#00a1e0] w-6 h-6 shrink-0" />
                                        <div><p className="font-bold">Full feature walkthrough</p></div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Check className="text-[#00a1e0] w-6 h-6 shrink-0" />
                                        <div><p className="font-bold">Custom implementation plan</p></div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Check className="text-[#00a1e0] w-6 h-6 shrink-0" />
                                        <div><p className="font-bold">Dedicated support representative</p></div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 p-12 lg:p-20 bg-white text-left">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Full Name</Label><Input name="fullName" placeholder="John Doe" className="h-12 border-zinc-200 rounded-lg" required /></div>
                                        <div className="space-y-2"><Label>Company</Label><Input name="company" placeholder="Acme Inc." className="h-12 border-zinc-200 rounded-lg" required /></div>
                                    </div>
                                    <div className="space-y-2"><Label>Work Email</Label><Input name="email" type="email" placeholder="john@company.com" className="h-12 border-zinc-200 rounded-lg" required /></div>
                                    <div className="space-y-2"><Label>Message</Label><Textarea name="message" placeholder="How can we help?" className="min-h-[120px] border-zinc-200 rounded-lg resize-none" /></div>
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-[#0176d3] h-14 text-white font-bold text-lg rounded-lg shadow-xl shadow-blue-500/10">
                                        {isSubmitting ? "Sending..." : "Submit Request"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* --- Minimal Footer --- */}
            <footer className="bg-white pt-24 pb-12 text-left border-t border-zinc-100">
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-12">
                        <div>
                            <Link to="/" className="flex items-center gap-2 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[#0176d3] flex items-center justify-center text-white">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <span className="text-2xl font-black tracking-tighter text-[#032d60]">{companyName}</span>
                            </Link>
                            <p className="text-zinc-500 font-bold max-w-sm">The world's most intuitive integrated HRM platform for modern enterprises.</p>
                        </div>


                        <div className="flex flex-wrap gap-8 md:gap-12">
                            {NAV_LINKS.map(link => (
                                <a key={link.name} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="font-bold text-zinc-900 hover:text-[#0176d3] transition-colors">{link.name}</a>
                            ))}
                        </div>
                    </div>

                    <div className="pt-12 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-bold opacity-60">
                            <p>© {new Date().getFullYear()} {companyName}, Inc. All rights reserved.</p>
                            <a href="#" className="hover:underline">Legal</a>
                            <a href="#" className="hover:underline">Privacy Policy</a>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-black bg-[#f8f9fb] px-4 py-2 rounded-full border border-zinc-200">
                            <Globe2 className="w-4 h-4" /> WORLDWIDE (ENGLISH)
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
