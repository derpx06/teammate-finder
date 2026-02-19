import React from 'react';
import { ArrowRight, Check, Compass, Play, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const metricCards = [
  { value: '12k+', label: 'Builders onboarded' },
  { value: '93%', label: 'Team-match relevance' },
  { value: '4.8/5', label: 'Collaboration rating' },
];

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-44 -left-20 w-[520px] h-[520px] rounded-full bg-cyan-200/45 blur-3xl animate-pulse-slow" />
        <div className="absolute -right-28 top-20 w-[540px] h-[540px] rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-[420px] h-[420px] rounded-full bg-amber-100/60 blur-3xl" />
      </div>

      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div className="animate-rise-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-3 py-1.5 text-xs font-semibold text-cyan-800">
              <Sparkles size={14} />
              Real teammate intelligence for product teams
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.07] tracking-tight text-slate-900">
              Build with the right
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
                people from day one.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
              CollabSphere helps you launch faster by matching verified skills to project needs,
              turning roadmaps into real team execution, and keeping collaboration in one shared space.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_16px_35px_-20px_rgba(14,116,255,0.9)] hover:brightness-105 transition"
              >
                Start Free
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/85 px-6 py-3 text-sm sm:text-base font-semibold text-slate-700 hover:bg-white transition"
              >
                <Play size={15} />
                Watch Product Walkthrough
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Verified skill profiles
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Group chat per project
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                Collaborative roadmap editing
              </span>
            </div>
          </div>

          <div className="animate-rise-in animate-delay-200">
            <div className="relative rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl p-5 sm:p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Live Blueprint</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Roadmap + Talent Board</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold">
                  <Users size={12} />
                  9 Contributors
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { phase: 'Phase 1', title: 'Scope + Architecture', weeks: 'W1-W2', team: 'PM, Backend Lead' },
                  { phase: 'Phase 2', title: 'Core Product Build', weeks: 'W3-W6', team: 'Full Stack, Design' },
                  { phase: 'Phase 3', title: 'QA + Launch Sprint', weeks: 'W7-W8', team: 'QA, Growth' },
                ].map((item, index) => (
                  <div
                    key={item.phase}
                    className={`rounded-2xl border p-3.5 ${index === 1
                      ? 'bg-blue-50/75 border-blue-200'
                      : 'bg-white border-slate-200'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.phase}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{item.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{item.team}</p>
                      </div>
                      <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        {item.weeks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute -bottom-6 -left-5 rounded-2xl border border-cyan-200 bg-white px-3.5 py-2.5 shadow-md animate-float-soft">
                <p className="text-xs font-semibold text-slate-500">Smart Match</p>
                <p className="text-sm font-bold text-cyan-700 inline-flex items-center gap-1">
                  <Compass size={14} />
                  97% fit
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-14 grid sm:grid-cols-3 gap-3 sm:gap-4">
          {metricCards.map((metric, index) => (
            <div
              key={metric.label}
              className={`animate-rise-in rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm ${index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : ''
                }`}
            >
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{metric.value}</p>
              <p className="text-sm text-slate-600 mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
