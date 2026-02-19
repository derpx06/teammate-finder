import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sparkles, X } from 'lucide-react';

const navItems = [
  { label: 'Features', hash: '#features' },
  { label: 'How It Works', hash: '#how-it-works' },
  { label: 'Roadmaps', hash: '#roadmaps' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onHashClick = (event, hash) => {
    if (location.pathname === '/') {
      event.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4 pt-3">
      <nav
        className={`max-w-7xl 2xl:max-w-screen-2xl mx-auto rounded-2xl border transition-all duration-300 ${scrolled
          ? 'bg-white/95 border-slate-200 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-md'
          : 'bg-white/80 border-white/60 backdrop-blur-sm'
          }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles size={16} />
            </span>
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">CollabSphere</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.hash}
                href={item.hash}
                onClick={(event) => onHashClick(event, item.hash)}
                className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-colors shadow-sm"
            >
              Start Building
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isOpen ? (
          <div className="md:hidden px-4 pb-4 border-t border-slate-100">
            <div className="pt-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.hash}
                  href={item.hash}
                  onClick={(event) => onHashClick(event, item.hash)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3">
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="text-center px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="text-center px-3 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500"
              >
                Start
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
};

export default Navbar;
