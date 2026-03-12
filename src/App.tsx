import React, { useState, useEffect, Suspense } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

const LeadModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; scope?: string }>({});

  useEffect(() => {
    const handleOpen = () => {
      setErrors({});
      setIsOpen(true);
    };
    window.addEventListener('open-lead-modal', handleOpen);
    return () => window.removeEventListener('open-lead-modal', handleOpen);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-md cursor-pointer"
        onClick={closeModal}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] p-8 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>

        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Initiate System Audit</h2>
          <p className="text-gray-400 text-sm">Provide your business telemetry. We'll analyze your digital bottlenecks.</p>
        </div>

        <div className="space-y-4 relative z-10">
          <div>
            <input
              id="lead-name"
              type="text"
              placeholder="COMMANDER NAME"
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 ${errors.name ? 'border-red-500' : 'border-white/10'
                }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <input
              id="lead-email"
              type="email"
              placeholder="COMM LINK / EMAIL"
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 ${errors.email ? 'border-red-500' : 'border-white/10'
                }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <select id="interest-tag" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
              <option value="WaaS Engine" className="bg-[#0B0F19]">WaaS Engine</option>
              <option value="Custom AI Architecture" className="bg-[#0B0F19]">Custom AI Architecture</option>
              <option value="Digital Strategy" className="bg-[#0B0F19]">Digital Strategy</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

          <div>
            <textarea
              id="lead-scope"
              placeholder="PROJECT SCOPE"
              rows={3}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 ${errors.scope ? 'border-red-500' : 'border-white/10'
                }`}
            ></textarea>
            {errors.scope && <p className="text-red-500 text-xs mt-1">{errors.scope}</p>}
          </div>

          <button
            id="transmit-btn"
            type="button"
            className="w-full mt-4 font-black uppercase text-sm py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white text-black hover:bg-purple-500 hover:text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] relative z-50 pointer-events-auto"
            onClick={async () => {
              const nameInput = document.getElementById('lead-name') as HTMLInputElement;
              const emailInput = document.getElementById('lead-email') as HTMLInputElement;
              const scopeInput = document.getElementById('lead-scope') as HTMLTextAreaElement;

              const nameVal = nameInput?.value.trim() ?? '';
              const emailVal = emailInput?.value.trim() ?? '';
              const scopeVal = scopeInput?.value.trim() ?? '';
              const tagVal = (document.getElementById('interest-tag') as HTMLSelectElement)?.value || 'WaaS Engine';

              // Validate
              const newErrors: { name?: string; email?: string; scope?: string } = {};
              if (!nameVal) newErrors.name = 'Name is required.';
              if (!emailVal) newErrors.email = 'Email is required.';
              if (!scopeVal) newErrors.scope = 'Project scope is required.';

              if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
              }

              setErrors({});
              const btn = document.getElementById('transmit-btn') as HTMLButtonElement;
              if (btn) btn.innerText = 'Processing...';

              try {
                await addDoc(collection(db, 'leads'), {
                  name: nameVal,
                  email: emailVal,
                  scope: scopeVal,
                  interestTag: tagVal,
                  timestamp: new Date()
                });
              } catch (error) {
                console.error("Firebase bypassed:", error);
              } finally {
                window.location.assign('https://calendar.app.google/YQ9z17s9n56J9GwL9');
              }
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const openModal = (e?: React.MouseEvent) => {
  e?.preventDefault();
  window.dispatchEvent(new Event('open-lead-modal'));
};

const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#0B0F19] text-white font-sans selection:bg-purple-500 overflow-x-hidden relative">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0B0F19]/50 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-6 md:px-12 py-6">
          <div className="text-xl md:text-2xl font-black tracking-tighter italic">
            WAITAMINUTE<span className="text-purple-500">.</span>DIGITAL
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-400 items-center">
            <a href="#packages" className="hover:text-white transition-all">Packages</a>
            <a href="#solutions" className="hover:text-white transition-all">AI Solutions</a>
            <button
              onClick={openModal}
              className="text-purple-400 border border-purple-400/30 px-4 py-1.5 rounded-full hover:bg-purple-400 hover:text-black transition-all"
            >
              Get Audit
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0B0F19] px-6 py-5 flex flex-col gap-5 text-xs font-bold uppercase tracking-widest">
            <a
              href="#packages"
              className="text-gray-400 hover:text-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Packages
            </a>
            <a
              href="#solutions"
              className="text-gray-400 hover:text-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI Solutions
            </a>
            <button
              onClick={() => { setMobileMenuOpen(false); openModal(); }}
              className="text-left text-purple-400 border border-purple-400/30 px-4 py-2 rounded-full hover:bg-purple-400 hover:text-black transition-all w-fit"
            >
              Get Audit
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-8 items-center pt-12 pb-20">

        {/* Left: Messaging */}
        <div className="space-y-8 z-10">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Production-First AI Agency
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
              ARCHITECT YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                UNFAIR ADVANTAGE.
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md leading-relaxed font-medium">
              We engineer AI-driven revenue engines and automated workflows. Stop settling for static "flyers" that don't convert. <br />
              <span className="text-white">Built for the Mobile, AL corridor and scalable globally.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={openModal}
              className="px-10 py-5 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-purple-500 hover:text-white transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              Deploy Your Solution
            </button>
            <a
              href="#packages"
              className="inline-flex items-center justify-center px-10 py-5 border border-white/20 rounded-xl font-bold uppercase text-sm hover:bg-white/5 transition-all"
            >
              View WaaS Tiers
            </a>
          </div>
        </div>

        {/* Right: The 3D Robot */}
        <div className="relative h-[450px] md:h-[600px] lg:h-[750px] w-full rounded-[2rem] overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,1)] flex items-center justify-center">
          <Suspense fallback={<div className="text-gray-500 animate-pulse font-bold tracking-widest text-sm uppercase">Loading 3D Engine...</div>}>
            <Spline
              scene="https://prod.spline.design/CAVjc9oPFRsHN1xi/scene.splinecode"
              className="w-full h-full"
            />
          </Suspense>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>
      </section>

      {/* WaaS Tiers Section (Bento Grid) */}
      <section id="packages" className="container mx-auto px-6 md:px-12 py-24 scroll-mt-20">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">ENGINEERED TIERS.</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Stop renting basic websites. Deploy high-performance <span className="text-white">Website as a Service (WaaS)</span> solutions designed for scalable revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* Tier 1: The Digital Footprint */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 flex flex-col hover:bg-zinc-900/80 transition-all duration-300">
            <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">The Digital Footprint</h3>
            <p className="text-gray-400 text-sm mb-2">Establish initial dominance. Perfect for essential local presence.</p>
            <p className="text-pink-400/80 text-xs font-bold italic mb-4">Wix won't manage your Google Business Profile. We do.</p>
            <div className="mb-6">
              <span className="text-3xl font-black">$49</span><span className="text-gray-400">/mo</span>
              <div className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">($150-$250 Setup)</div>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> Next-Gen Landing Page
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> Local SEO Foundation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> Google Business Profile (GBP) Baseline
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> Secure Managed Hosting
              </li>
            </ul>
            <a
              href="https://buy.stripe.com/4gMbJ2f1mfhkgaL7V19bO00"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl border border-white/20 font-bold uppercase text-xs hover:bg-white hover:text-black transition-all block text-center"
            >
              Deploy Footprint
            </a>
          </div>

          {/* Tier 2: The Production-First Engine (Most Popular) */}
          <div className="relative bg-[#0B0F19]/50 backdrop-blur-lg border border-white/10 rounded-3xl p-8 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.37)] md:-rotate-1 md:hover:rotate-0 transition-all duration-300 transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-black text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              Most Popular Engine
            </div>
            <h3 className="text-2xl font-black tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              The Production-First Engine
            </h3>
            <p className="text-gray-400 text-sm mb-2">Deep operational integration. Engineered to convert traffic to capital.</p>
            <p className="text-pink-400/80 text-xs font-bold italic mb-4">GoDaddy doesn't do SEO strategy. We do.</p>
            <div className="mb-6">
              <span className="text-3xl font-black">$149</span><span className="text-gray-400">/mo</span>
              <div className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">($499-$750 Setup)</div>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-pink-500 shrink-0">✔</span> Multi-page Ecosystem Architecture
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 shrink-0">✔</span> Advanced SEO & Strategy Implementations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 shrink-0">✔</span> Ongoing GBP Optimization
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 shrink-0">✔</span> Dynamic Lead Capture Integrations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 shrink-0">✔</span> Analytics & Heatmap Configuration
              </li>
            </ul>
            <a
              href="https://buy.stripe.com/8x26oI2eAc580bN2AH9bO01"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl bg-purple-500 text-white font-black uppercase text-xs hover:bg-pink-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] block text-center"
            >
              Deploy Engine
            </a>
          </div>

          {/* Tier 3: The Waitaminute Growth Suite */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 flex flex-col hover:bg-zinc-900/80 transition-all duration-300">
            <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">The Waitaminute Growth Suite</h3>
            <p className="text-gray-400 text-sm mb-2">Fully autonomous tech-stack. Eliminate operational bottlenecks.</p>
            <p className="text-pink-400/80 text-xs font-bold italic mb-4">No DIY platform automates your leads into your CRM. We do.</p>
            <div className="mb-6">
              <span className="text-3xl font-black">$299+</span><span className="text-gray-400">/mo</span>
              <div className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">($1,200-$1,500 Setup)</div>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> E-Commerce & Complex Data Architecture
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> Custom Zapier / API Workflows
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> Autonomous AI Service Automations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 shrink-0">✔</span> CRM Integration & Pipeline Build
              </li>
            </ul>
            <a
              href="https://buy.stripe.com/28E3cwbPa5GK0bN6QX9bO02"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl border border-white/20 font-bold uppercase text-xs hover:bg-white hover:text-black transition-all block text-center"
            >
              Deploy Suite
            </a>
          </div>

        </div>
      </section>

      {/* Selected Masterpieces Section (Portfolio) */}
      <section id="solutions" className="container mx-auto px-6 md:px-12 py-24 scroll-mt-20">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase">
            Selected Masterpieces
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Showcasing high-impact digital experiences built for speed, scale, and ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: AI MUSIC PLATFORM */}
          <a
            href="https://djwaitaminute.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative bg-[#0B0F19]/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8 overflow-hidden hover:-translate-y-2 transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)] flex flex-col h-[400px] justify-end"
          >
            {/* Background Image / Gradient Mock */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/20 to-pink-900/20 group-hover:scale-105 transition-transform duration-700"></div>
            {/* Neon Glow Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-[60px] group-hover:bg-pink-500/40 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] group-hover:bg-purple-500/40 transition-all duration-500"></div>

            <div className="relative z-10">
              <div className="inline-block px-3 py-1 mb-4 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                Live Deployment
              </div>
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-500 transition-all duration-300">
                djwaitaminute
              </h3>
              <p className="text-gray-400 text-sm font-medium">
                An immersive neon-lit interface designed for high engagement.
              </p>
            </div>
          </a>

          {/* Card 2: HUNCHO FEST */}
          <a
            href="https://hunchofest.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative bg-[#0B0F19]/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8 overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(56,189,248,0.15)] flex flex-col h-[400px] justify-end cursor-pointer"
          >
            {/* Background Image / Gradient Mock */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-900/30 via-slate-900/50 to-blue-900/20 group-hover:scale-105 transition-transform duration-700"></div>
            {/* Trust Blue Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-[60px] group-hover:bg-sky-500/30 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-500"></div>

            <div className="relative z-10">
              <div className="inline-block px-3 py-1 mb-4 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                Live Deployment
              </div>
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-500 transition-all duration-300">
                FESTIVAL DIGITAL HUB: Huncho Fest
              </h3>
              <p className="text-slate-300 text-sm font-medium">
                A high-energy, dynamic digital experience designed to drive ticket sales and engage audiences, built for speed and cultural impact.
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Local Markets Bar */}
      <div className="border-y border-white/5 py-12 bg-[#050810]/50">
        <div className="container mx-auto px-12 flex flex-wrap justify-center md:justify-between gap-8 items-center opacity-30 font-black text-sm uppercase tracking-[0.3em]">
          <span>Mobile</span>
          <span className="text-purple-500">•</span>
          <span>Prichard</span>
          <span className="text-purple-500">•</span>
          <span>Pensacola</span>
          <span className="text-purple-500">•</span>
          <span>New Orleans</span>
        </div>
      </div>

      {/* Render Lead capture modal overlay outside main flow */}
      <LeadModal />
    </div>
  );
};

export default App;
