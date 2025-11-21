import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, CalendarIcon, BoltIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import watermarkSvg from '../../watermark.svg';

const StudentsNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [100, 200],
    ['rgba(2, 8, 23, 0)', 'rgba(2, 8, 23, 0.78)']
  );
  const borderColor = useTransform(
    scrollY,
    [100, 200],
    ['rgba(148, 163, 184, 0)', 'rgba(148, 163, 184, 0.35)']
  );

  const tabs = [
    { 
      key: 'for-you', 
      label: 'For You', 
      icon: ClockIcon, 
      path: '/students/for-you' 
    },
    { 
      key: 'events', 
      label: 'Events', 
      icon: CalendarIcon, 
      path: '/students/events' 
    },
    { 
      key: 'hackathons', 
      label: 'Hackathons', 
      icon: BoltIcon, 
      path: '/students/hackathons' 
    },
    { 
      key: 'scholarships', 
      label: 'Scholarships', 
      icon: SparklesIcon, 
      path: '/students/scholarships' 
    },
  ];

  return (
    <motion.header
      style={{ backgroundColor, borderColor }}
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl transition-colors"
    >
      <div className="section-container flex items-center justify-between py-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="flex items-center gap-4"
          >
            <img 
              src={watermarkSvg} 
              alt="Blau Tech" 
              className="h-10 w-auto"
            />
            <span className="text-xl font-semibold text-white tracking-[0.4em]">
              BLAU TECH
            </span>
          </motion.div>
        </Link>
        
        {/* Desktop navigation tabs */}
        <nav className="hidden md:flex items-center">
          <div className="inline-flex rounded-2xl border border-white/20 bg-white/5 p-2 backdrop-blur-sm">
            {tabs.map(({ key, label, icon: Icon, path }) => {
              const isActive = location.pathname === path;
              return (
                <NavLink
                  key={key}
                  to={path}
                  className={`relative flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl"
          >
            <div className="section-container py-4 flex flex-col gap-3">
              {tabs.map(({ key, label, icon: Icon, path }, index) => {
                const isActive = location.pathname === path;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <NavLink
                      to={path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white'
                          : 'border border-white/20 bg-white/5 text-white/70 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default StudentsNavbar;

