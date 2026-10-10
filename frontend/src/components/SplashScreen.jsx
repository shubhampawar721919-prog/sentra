import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Cinematic intro with quick skip
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Buttery-smooth cinematic easing curve
  const cinematicEase = [0.16, 1, 0.3, 1];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cinematic-splash"
          onClick={() => { setIsVisible(false); onComplete(); }}
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.08,
            filter: "blur(14px)",
            transition: { duration: 0.8, ease: cinematicEase } 
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#0A0F1D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Lens Flare Glow in Cyan/Teal Accent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '120vw',
              height: '25vh',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.2) 0%, rgba(14, 165, 233, 0.1) 40%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(30px)'
            }}
          />

          <div style={{ position: 'relative', width: '100%', height: '110px', display: 'flex', justifyContent: 'center' }}>
            
            {/* The Horizon Line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: cinematicEase }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '20%',
                right: '20%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.9), transparent)',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.6)',
                transformOrigin: 'center',
                zIndex: 10
              }}
            />

            {/* Container for masking text rising from the horizon line */}
            <div style={{
              position: 'absolute',
              bottom: '50%',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              overflow: 'hidden',
              paddingTop: '20px'
            }}>
              <motion.h1
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 1.2, delay: 0.2, ease: cinematicEase }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '5vw',
                  fontWeight: 800,
                  letterSpacing: '0.35em',
                  color: '#FFFFFF',
                  margin: 0,
                  textTransform: 'uppercase',
                  paddingLeft: '0.35em',
                  lineHeight: 1
                }}
              >
                SENTRA
              </motion.h1>
            </div>

            {/* Container for subtitle falling below the horizon line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <motion.p
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.6, ease: cinematicEase }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.25em',
                  color: '#38BDF8',
                  margin: 0,
                  textTransform: 'uppercase',
                  paddingTop: '16px'
                }}
              >
                Trust the Signal. Detect the Fault.
              </motion.p>
            </div>
          </div>
          <div style={{ marginTop: '24px', fontSize: '11px', color: '#64748B', letterSpacing: '0.08em' }}>
            Click anywhere to enter console
          </div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}
