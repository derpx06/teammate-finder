import React from 'react';
import { BrainCircuit, GitBranch, MessageCircleHeart, Radar, ShieldCheck, Star } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Credibility',
    description: 'Followers, stars, and profile signals surface contributors with proven momentum.',
    tone: 'from-emerald-500/15 to-emerald-100',
    iconColor: 'text-emerald-700',
  },
  {
    icon: Radar,
    title: 'Semantic Teammate Match',
    description: 'Search by intent and role gaps, not just keywords, to find higher-fit collaborators.',
    tone: 'from-blue-500/15 to-blue-100',
    iconColor: 'text-blue-700',
  },
  {
    icon: BrainCircuit,
    title: 'Virtual CTO Planning',
    description: 'Generate role plans, project phases, and execution guidance in one guided flow.',
    tone: 'from-cyan-500/15 to-cyan-100',
    iconColor: 'text-cyan-700',
  },
  {
    icon: GitBranch,
    title: 'Source Code Visibility',
    description: 'Attach repositories directly to projects so teammates can inspect code instantly.',
    tone: 'from-amber-500/15 to-amber-100',
    iconColor: 'text-amber-700',
  },
  {
    icon: MessageCircleHeart,
    title: 'Project Group Chat',
    description: 'Each project gets a dedicated team channel to keep decisions and delivery in sync.',
    tone: 'from-rose-500/15 to-rose-100',
    iconColor: 'text-rose-700',
  },
  {
    icon: Star,
    title: 'Collaborative Roadmaps',
    description: 'Owners and members can edit roadmap phases together as priorities evolve.',
    tone: 'from-indigo-500/15 to-indigo-100',
    iconColor: 'text-indigo-700',
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-20 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(240,249,255,0.55))]" />

      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="max-w-3xl animate-rise-in">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Platform Capabilities</p>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Everything needed to assemble, align, and ship with confidence.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            CollabSphere combines matching, planning, credibility signals, and communication so your team can focus on execution.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`animate-rise-in rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.55)] hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 transition-all ${index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : ''
                  }`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.tone} border border-white/70 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
