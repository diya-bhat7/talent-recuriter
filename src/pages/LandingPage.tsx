import { Button } from "@/components/ui/button";
import { StraatixLogo } from "@/components/ui/StraatixLogo";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Globe, Users, Zap, ShieldCheck } from "lucide-react";
import { useState } from 'react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Link to="/">
                        <StraatixLogo className="h-10 w-auto" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-medium hover:text-sky-blue transition-colors">Home</Link>
                        <Link to="/about" className="text-sm font-medium hover:text-sky-blue transition-colors">About</Link>
                        <Link to="/careers" className="text-sm font-medium hover:text-sky-blue transition-colors">Careers</Link>
                        <Link to="/contact" className="text-sm font-medium hover:text-sky-blue transition-colors">Contact</Link>
                        <Link to="/insights" className="text-sm font-medium hover:text-sky-blue transition-colors">Insights</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-sm font-medium">Login</Button>
                        </Link>
                        <Link to="/register">
                            <Button className="btn-primary">Register</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
                <div className="orb orb-1 opacity-20" />
                <div className="orb orb-2 opacity-10" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center animate-fade-up">
                        <h1 className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight">
                            Technology GCoE.<br />
                            <span className="text-gradient">Delivered.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                            Straatix with its proven GCoE playbook is your single-window partner, from inception to scaling. We help clients achieve sustained remote engineering excellence.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register">
                                <Button className="btn-primary text-lg h-14 px-10 rounded-2xl">
                                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/contact">
                                <Button variant="outline" className="text-lg h-14 px-10 rounded-2xl border-straatix-blue/20 hover:bg-white/50 backdrop-blur-sm">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>


            {/* Interactive Service Offerings Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 animate-fade-up">
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-straatix-blue mb-6">Service Offerings</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            We specialize in setting-up and scaling GCoEs. Our services ensure a seamless transition and sustained engineering excellence. Explore our comprehensive range of offerings below.
                        </p>
                    </div>

                    <InteractivePlaybook />
                </div>
            </section>

            {/* About Section */}
            <section className="py-24 bg-alabaster">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-sky-blue/20 blur-3xl rounded-full" />
                                <div className="relative rounded-3xl overflow-hidden shadow-glow">
                                    <div className="aspect-video bg-gradient-to-br from-straatix-blue to-sky-blue flex items-center justify-center">
                                        <StraatixLogo variant="vertical" className="h-32 w-auto text-white/90" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 space-y-6 animate-fade-up">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-sky-blue">About Us</h2>
                            <h3 className="text-4xl font-display font-bold text-straatix-blue">Experienced Practitioners</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Founders have rich and diverse experiences in product, engineering and strategy consulting. We are experienced practitioners in setting up, scaling and leading technology GCoEs in India - from early unicorns to mega enterprise software companies.
                            </p>
                            <ul className="space-y-4 pt-6">
                                {features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-sky-blue shrink-0 mt-0.5" />
                                        <span className="text-lg font-medium text-straatix-blue/80">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Past Experiences Section (Moved to Bottom) */}
            <section className="py-16 border-y border-border/50 bg-white/50 backdrop-blur-sm overflow-hidden">
                <div className="container mx-auto px-4 relative">
                    <p className="text-center text-2xl font-display font-medium text-straatix-blue mb-12 uppercase tracking-widest">Team's Past Experiences</p>

                    <div className="flex w-full">
                        <div className="animate-marquee flex gap-12 md:gap-24 items-center whitespace-nowrap">
                            <LogoItems />
                            <LogoItems />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                        <div className="space-y-6 max-w-sm">
                            <StraatixLogo className="h-8 w-auto" />
                            <p className="text-muted-foreground leading-relaxed">
                                Building a Buzzworthy Employer Brand with Candidates. Partnering with you from inception to scaling.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                            <div className="space-y-4">
                                <h5 className="font-bold text-straatix-blue">Company</h5>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                                    <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                                    <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h5 className="font-bold text-straatix-blue">Legal</h5>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                                    <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Straatix Partners. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-muted-foreground">
                            <a href="#" className="hover:text-straatix-blue transition-colors">LinkedIn</a>
                            <a href="#" className="hover:text-straatix-blue transition-colors">Twitter</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const LogoItems = () => (
    <>
        {/* PWC Placeholder */}
        <div className="flex flex-col items-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-300 cursor-pointer">
            <span className="text-3xl font-black text-[#D04A02]">pwc</span>
        </div>
        {/* DealerSocket Placeholder */}
        <div className="flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-300 cursor-pointer">
            <div className="h-10 w-10 rounded-full border-4 border-straatix-blue flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-straatix-blue" />
            </div>
            <span className="text-2xl font-bold text-straatix-blue">DealerSocket</span>
        </div>
        {/* SAP Placeholder */}
        <div className="bg-[#008FD3] px-4 py-1.5 rounded-sm opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-300 cursor-pointer">
            <span className="text-2xl font-bold text-white italic">SAP</span>
        </div>
        {/* Insurity Placeholder */}
        <div className="flex items-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-300 cursor-pointer">
            <span className="text-2xl font-bold text-black">ins</span>
            <span className="text-2xl font-bold text-sky-blue">u</span>
            <span className="text-2xl font-bold text-black">rity</span>
        </div>
        {/* SAP Ariba Placeholder */}
        <div className="flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-300 cursor-pointer">
            <span className="text-2xl font-bold text-black">SAP Ariba</span>
            <div className="w-8 h-8 border-b-4 border-r-4 border-yellow-500 -rotate-45" />
        </div>
        {/* Google Cloud style placeholder */}
        <div className="flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-300 cursor-pointer">
            <div className="flex gap-0.5">
                <div className="w-2.5 h-6 bg-[#4285F4]" />
                <div className="w-2.5 h-6 bg-[#EA4335]" />
                <div className="w-2.5 h-6 bg-[#FBBC05]" />
                <div className="w-2.5 h-6 bg-[#34A853]" />
            </div>
            <span className="text-2xl font-medium text-gray-600">Google Cloud</span>
        </div>
    </>
);

const InteractivePlaybook = () => {
    const [activeTab, setActiveTab] = useState(0);

    const playbookItems = [
        {
            id: "inception",
            label: "Inception",
            icon: <Globe className="h-6 w-6" />,
            title: "Inception & Strategy",
            description: "We help you define the vision, roadmap, and operational blueprint for your GCoE. Our practitioner-led approach ensures a solid foundation from day one."
        },
        {
            id: "workspace",
            label: "Workspace",
            icon: <ShieldCheck className="h-6 w-6" />,
            title: "Operational Framework",
            description: "Setting up the right infrastructure, tools, and processes. We ensure your workspace is optimized for remote collaboration and engineering high-performance."
        },
        {
            id: "talent",
            label: "Talent",
            icon: <Users className="h-6 w-6" />,
            title: "Talent Acquisition & Growth",
            description: "Our expert advisory services enable you to attract, hire, engage and grow the right talent – helping you build your most strategic asset."
        },
        {
            id: "replicate",
            label: "Replicate Engineering Excellence",
            icon: <Zap className="h-6 w-6" />,
            title: "Sustained Excellence",
            description: "Coach remote teams for effective replication of product engineering process, practices and tools to achieve high sustained performance."
        },
    ];

    return (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 min-h-[500px]">
            {/* The Circle */}
            <div className="relative w-[350px] md:w-[450px] aspect-square flex items-center justify-center">
                {/* Center */}
                <div className="absolute z-20 w-44 h-44 md:w-56 md:h-56 bg-sky-blue rounded-full shadow-glow flex items-center justify-center text-center p-6 border-4 border-white">
                    <span className="text-xl md:text-2xl font-display font-black text-straatix-blue">
                        GCoE<br />Playbook
                    </span>
                </div>

                {/* Segments */}
                <div className="absolute inset-0 rounded-full border border-dashed border-sky-blue/30 scale-110" />

                {playbookItems.map((item, idx) => {
                    const isActive = activeTab === idx;
                    const rotation = (idx * 90) - 45; // Adjust start position

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(idx)}
                            className={`absolute w-full h-full transition-all duration-500`}
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            <div
                                className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 md:w-60 md:h-60 flex items-center justify-center rounded-full transition-all duration-300
                            ${isActive ? 'bg-sky-blue/30 scale-105' : 'bg-transparent hover:bg-sky-blue/10'} border-transparent`}
                                style={{ transform: `rotate(${-rotation}deg)` }} // Counter-rotate text
                            >
                                <span className={`text-sm md:text-base font-bold text-center px-8 transition-colors ${isActive ? 'text-straatix-blue' : 'text-muted-foreground'}`}>
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Content Card */}
            <div className="lg:w-1/3 w-full bg-white rounded-3xl p-10 shadow-soft border border-border/50 animate-fade-up min-h-[300px] flex flex-col justify-center">
                <div className="mb-6 p-4 rounded-xl bg-straatix-blue w-fit">
                    {playbookItems[activeTab].icon && (
                        <div className="text-white">
                            {playbookItems[activeTab].icon}
                        </div>
                    )}
                </div>
                <h4 className="text-3xl font-display font-bold text-straatix-blue mb-4">
                    {playbookItems[activeTab].title}
                </h4>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    {playbookItems[activeTab].description}
                </p>
            </div>
        </div>
    );
};

const services = [
    {
        title: "GCoE Setup",
        description: "End-to-end support for inception, setup and scaling of Global Centers of Excellence.",
        icon: <Globe className="h-8 w-8 text-sky-blue" />,
    },
    {
        title: "Product Coaching",
        description: "Coach remote teams for effective replication of product engineering process, practices and tools.",
        icon: <Zap className="h-8 w-8 text-sky-blue" />,
    },
    {
        title: "Scale & Strategy",
        description: "Experienced practitioners helping you lead technology GCoEs from unicorns to enterprises.",
        icon: <Users className="h-8 w-8 text-sky-blue" />,
    },
];

const features = [
    "Proven GCoE Playbook",
    "Practitioner’s Approach",
    "Strategy Consulting Background",
    "Deep Indian Tech Ecosystem Insights",
];

export default LandingPage;
