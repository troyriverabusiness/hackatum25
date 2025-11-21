import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  const vantaRef = useRef(null);

  useEffect(() => {
    let vantaEffect;
    let isCancelled = false;

    async function initializeVanta() {
      if (typeof window === 'undefined' || !vantaRef.current) return;

      try {
        const [vantaModule, threeModule] = await Promise.all([
          import('vanta/dist/vanta.net.min.js'),
          import('three'),
        ]);

        const VANTA = vantaModule.default || vantaModule;
        const THREE = threeModule.default || threeModule;

        if (isCancelled || !vantaRef.current) {
          return;
        }

        vantaEffect = VANTA({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x60a7ee,
          backgroundColor: 0x020817,
          points: 18.0,
          maxDistance: 22.0,
          spacing: 18.0,
          showLines: true,
        });
        
        // Force update Vanta color if needed
        if (vantaEffect && vantaEffect.setOptions) {
          vantaEffect.setOptions({ color: 0x60a7ee });
        }
      } catch (error) {
        console.error('Failed to initialize animated background', error);
      }
    }

    initializeVanta();

    return () => {
      isCancelled = true;
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div ref={vantaRef} className="absolute inset-0" style={{ opacity: 0.25, filter: 'saturate(0.6)' }} />
      <motion.div
        className="absolute inset-0 bg-gradient-mesh"
        animate={{ opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl"
        style={{ 
          background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.45), rgba(96, 167, 238, 0.65), rgba(153, 202, 250, 0.55), rgba(255, 255, 255, 0.35))',
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, 10, -25, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-12 right-1/4 h-[32rem] w-[32rem] rounded-full blur-[140px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.4), rgba(153, 202, 250, 0.6), rgba(255, 255, 255, 0.3))',
        }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 15, -20, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full blur-[130px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(153, 202, 250, 0.4), rgba(96, 167, 238, 0.3))',
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, -20, 10, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full blur-[90px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(96, 167, 238, 0.35), rgba(153, 202, 250, 0.3))',
        }}
        animate={{
          x: [0, 12, -14, 0],
          y: [0, -18, 22, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full blur-[100px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(153, 202, 250, 0.3), rgba(96, 167, 238, 0.25))',
        }}
        animate={{
          x: [0, -15, 18, 0],
          y: [0, 20, -15, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 h-72 w-72 rounded-full blur-[110px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(96, 167, 238, 0.3), rgba(153, 202, 250, 0.25))',
        }}
        animate={{
          x: [0, 20, -15, 0],
          y: [0, -25, 18, 0],
          scale: [1, 0.95, 1.08, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 h-56 w-56 rounded-full blur-[95px]"
        style={{ 
          background: 'linear-gradient(120deg, rgba(153, 202, 250, 0.35), rgba(96, 167, 238, 0.3))',
        }}
        animate={{
          x: [0, 25, -20, 0],
          y: [0, -30, 15, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

export default AnimatedBackground;

