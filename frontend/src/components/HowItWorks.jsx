import React from 'react';
import { ArrowRight, Compass, GitPullRequest, MapPinned } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: Compass,
    title: 'Describe your project idea',
    detail: 'Start with your concept and required outcomes. Virtual CTO scaffolds a practical plan.',
  },
  {
    icon: MapPinned,
    title: 'Match teammates + shape roadmap',
    detail: 'Find relevant builders, connect, and collaboratively edit phases with clear ownership.',
  },
  {
    icon: GitPullRequest,
    title: 'Build and ship in sync',
    detail: 'Use project chat, role workflows, and source-code links to keep delivery visible.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center max-w-3xl mx-auto animate-rise-in">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">How It Works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            From raw idea to organized team execution.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600">
            Built for hackathon crews, startup teams, and community builders who need speed without chaos.
          </p>
        </div>

        <div className="mt-12 relative">
          <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-cyan-200 via-blue-300 to-amber-200 -z-10" />
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className={`animate-rise-in rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm ${index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : ''
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
                      <Icon size={18} />
                    </span>
                    <span className="text-xs font-semibold text-slate-500 rounded-full border border-slate-200 px-2 py-1">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{step.detail}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div id="roadmaps" className="mt-10 sm:mt-12 animate-rise-in animate-delay-200">
          <div className="rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-semibold">Roadmaps + Collaboration</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Align teammates around one living execution plan.</h3>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Every project gets a shared roadmap and group chat so decisions, ownership, and delivery stay connected.
              </p>
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-cyan-500 hover:brightness-105 transition w-fit"
            >
              Try it now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
