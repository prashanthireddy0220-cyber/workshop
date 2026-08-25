import React, { useEffect, useState } from 'react';

const PageLoader = ({ isLoading = false, duration = 800, onComplete }) => {
  const [visible, setVisible] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setFadeOut(false);
    } else if (visible) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setFadeOut(false);
        if (onComplete) onComplete();
      }, 700); // duration of opacity fade out
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`page-loader-overlay ${fadeOut ? 'fade-out' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'all'
      }}
    >
      {/* Background Circuit Animation Lines (Left & Right Connecting to Center) */}
      <svg
        className="circuit-bg-svg"
        viewBox="0 0 1400 800"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.65
        }}
      >
        <defs>
          <linearGradient id="circuitGradLeft" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="60%" stopColor="#F97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="circuitGradRight" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Left Side Circuit Lines extending toward center */}
        <path
          d="M 0 250 L 350 250 L 480 370 L 620 370"
          fill="none"
          stroke="url(#circuitGradLeft)"
          strokeWidth="2"
          className="circuit-line circuit-line-left-1"
        />
        <path
          d="M 0 550 L 300 550 L 450 430 L 620 430"
          fill="none"
          stroke="url(#circuitGradLeft)"
          strokeWidth="1.8"
          className="circuit-line circuit-line-left-2"
        />
        <circle cx="620" cy="370" r="3.5" fill="#F97316" className="circuit-node" />
        <circle cx="620" cy="430" r="3.5" fill="#38BDF8" className="circuit-node" />

        {/* Right Side Circuit Lines extending toward center */}
        <path
          d="M 1400 250 L 1050 250 L 920 370 L 780 370"
          fill="none"
          stroke="url(#circuitGradRight)"
          strokeWidth="2"
          className="circuit-line circuit-line-right-1"
        />
        <path
          d="M 1400 550 L 1100 550 L 950 430 L 780 430"
          fill="none"
          stroke="url(#circuitGradRight)"
          strokeWidth="1.8"
          className="circuit-line circuit-line-right-2"
        />
        <circle cx="780" cy="370" r="3.5" fill="#38BDF8" className="circuit-node" />
        <circle cx="780" cy="430" r="3.5" fill="#F97316" className="circuit-node" />
      </svg>

      {/* Center Branding Content */}
      <div
        className="loader-center-branding"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          animation: 'centerPulse 2.4s ease-in-out infinite alternate'
        }}
      >
        {/* Logo Image */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(56,189,248,0.1) 70%, transparent 100%)',
              filter: 'blur(16px)',
              animation: 'glowPulse 2s ease-in-out infinite alternate'
            }}
          />
          <img
            src="/logo.svg"
            alt="KARE IEEE Education Society"
            style={{
              height: '80px',
              width: 'auto',
              position: 'relative',
              zIndex: 3,
              filter: 'drop-shadow(0 0 15px rgba(249, 115, 22, 0.4))'
            }}
          />
        </div>

        {/* Text Branding */}
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              color: '#FFFFFF',
              letterSpacing: '0.08em',
              marginBottom: '4px',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
            }}
          >
            KARE IEEE
          </h2>
          <p
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
              color: '#F97316',
              letterSpacing: '0.22em',
              textTransform: 'uppercase'
            }}
          >
            EDUCATION SOCIETY
          </p>
        </div>

        {/* Minimal Subtle Loading Bar */}
        <div
          style={{
            width: '180px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginTop: '32px',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #F97316 0%, #38BDF8 100%)',
              borderRadius: '9999px',
              animation: 'loaderProgress 1.4s ease-in-out infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
