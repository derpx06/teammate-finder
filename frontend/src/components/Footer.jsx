import React from 'react';
import { Github, Linkedin, Mail, Sparkles, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerColumns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'How It Works', to: '/#how-it-works' },
      { label: 'Roadmaps', to: '/#roadmaps' },
      { label: 'Get Started', to: '/auth' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Find Teammates', to: '/auth' },
      { label: 'My Projects', to: '/auth' },
      { label: 'Project Chat', to: '/auth' },
      { label: 'Notifications', to: '/auth' },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-slate-200 bg-white">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-50/70 to-transparent pointer-events-none" />

      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 sm:py-14">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6 sm:p-8 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.8)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-semibold">Join the Network</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold">Build faster with people who match your ambition.</h3>
              <p className="mt-2 text-slate-200 max-w-2xl">
                Create your profile, discover collaborators, and organize execution with shared roadmaps.
              </p>
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-slate-900 hover:bg-cyan-100 transition w-fit"
            >
              <Sparkles size={16} />
              Create Free Account
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.3fr_1fr_1fr] gap-8 mt-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
                <Sparkles size={16} />
              </span>
              <span className="text-xl font-semibold text-slate-900">CollabSphere</span>
            </Link>
            <p className="mt-4 text-slate-600 max-w-md leading-relaxed">
              Collaboration workspace for builders who want better teammates, clearer planning, and faster product delivery.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Twitter, Github, Linkedin, Mail].map((Icon, index) => (
                <a
                  key={`social-${index}`}
                  href="#"
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-700 hover:border-blue-200 flex items-center justify-center transition-colors"
                  aria-label="Social link"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{column.heading}</h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-slate-700 hover:text-blue-700 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} CollabSphere. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-slate-700">Privacy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
            <a href="#" className="hover:text-slate-700">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
