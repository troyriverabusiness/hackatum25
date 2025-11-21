import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import watermarkSvg from '../../watermark.svg';

const Navbar = ({ onJoinClick, onPartnersClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleJoinClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/students');
  };

  const handlePartnersClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/partners');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.header
      style={{ backgroundColor, borderColor }}
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl transition-colors"
    >
      <div className="section-container flex items-center justify-between py-5">
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
        
        {/* Desktop buttons */}
        <nav className="hidden md:flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/students')}
            className={`btn-primary ${isActive('/students') ? 'opacity-100' : ''}`}
          >
            <span>For Students</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/partners')}
            className={`btn-partners ${isActive('/partners') ? 'opacity-100' : ''}`}
          >
            <span>For Partners</span>
          </motion.button>
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
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/students');
                }}
                className="btn-primary w-full"
              >
                <span>For Students</span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/partners');
                }}
                className="btn-partners w-full"
              >
                <span>For Partners</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;

