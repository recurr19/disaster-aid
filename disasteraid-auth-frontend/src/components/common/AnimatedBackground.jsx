import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground({ variant = 'default' }) {
  if (variant === 'mesh') {
    return <MeshGradientBackground />;
  }
  
  if (variant === 'particles') {
    return <ParticleBackground />;
  }

  return <EmergencyPulseBackground />;
}

// Emergency Response Themed Background - Dramatic and impactful
function EmergencyPulseBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Emergency Beacon Lights - Rotating beams */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        animate={{ rotate: 360 }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-b from-red-500/30 via-red-500/10 to-transparent blur-xl" style={{ transformOrigin: 'top center' }} />
          <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent blur-xl" style={{ transformOrigin: 'top center', transform: 'rotate(120deg)' }} />
          <div className="absolute top-0 left-1/2 w-2 h-full bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent blur-xl" style={{ transformOrigin: 'top center', transform: 'rotate(240deg)' }} />
        </div>
      </motion.div>

      {/* Network Connection Lines - Representing coordination */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
          <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0)" />
            <stop offset="50%" stopColor="rgba(239, 68, 68, 0.4)" />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M 10,50 Q 200,10 400,50 T 800,50"
          stroke="url(#line-gradient-1)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 800,200 Q 600,150 400,200 T 10,200"
          stroke="url(#line-gradient-2)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </svg>

      {/* Emergency Response Zones */}
      {[
        { x: 15, y: 20, color: 'red', size: 32, delay: 0 },
        { x: 75, y: 30, color: 'blue', size: 24, delay: 0.5 },
        { x: 85, y: 65, color: 'emerald', size: 32, delay: 1 },
        { x: 20, y: 70, color: 'purple', size: 16, delay: 1.5 },
        { x: 50, y: 45, color: 'rose', size: 24, delay: 2 },
      ].map((zone, i) => (
        <motion.div
          key={`zone-${i}`}
          className="absolute"
          style={{ 
            left: `${zone.x}%`, 
            top: `${zone.y}%`,
            width: `${zone.size * 4}px`,
            height: `${zone.size * 4}px`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 0.8, 0.6],
          }}
          transition={{
            duration: 2,
            delay: zone.delay,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <div 
            className="w-full h-full rounded-full border-2 backdrop-blur-sm relative"
            style={{
              background: `radial-gradient(circle, ${
                zone.color === 'red' ? 'rgba(239, 68, 68, 0.2)' :
                zone.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' :
                zone.color === 'purple' ? 'rgba(168, 85, 247, 0.2)' :
                'rgba(244, 63, 94, 0.2)'
              } 0%, transparent 70%)`,
              borderColor: zone.color === 'red' ? 'rgba(239, 68, 68, 0.4)' :
                zone.color === 'blue' ? 'rgba(59, 130, 246, 0.4)' :
                zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.4)' :
                zone.color === 'purple' ? 'rgba(168, 85, 247, 0.4)' :
                'rgba(244, 63, 94, 0.4)',
            }}
          >
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{
                backgroundColor: zone.color === 'red' ? 'rgba(239, 68, 68, 0.3)' :
                  zone.color === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
                  zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.3)' :
                  zone.color === 'purple' ? 'rgba(168, 85, 247, 0.3)' :
                  'rgba(244, 63, 94, 0.3)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-lg"
              style={{
                backgroundColor: zone.color === 'red' ? 'rgb(239, 68, 68)' :
                  zone.color === 'blue' ? 'rgb(59, 130, 246)' :
                  zone.color === 'emerald' ? 'rgb(16, 185, 129)' :
                  zone.color === 'purple' ? 'rgb(168, 85, 247)' :
                  'rgb(244, 63, 94)',
                boxShadow: `0 0 10px ${
                  zone.color === 'red' ? 'rgba(239, 68, 68, 0.5)' :
                  zone.color === 'blue' ? 'rgba(59, 130, 246, 0.5)' :
                  zone.color === 'emerald' ? 'rgba(16, 185, 129, 0.5)' :
                  zone.color === 'purple' ? 'rgba(168, 85, 247, 0.5)' :
                  'rgba(244, 63, 94, 0.5)'
                }`,
              }}
            />
          </div>
        </motion.div>
      ))}

      {/* Data Flow Particles */}
      {[...Array(50)].map((_, i) => {
        const duration = 5 + Math.random() * 5;
        const delay = Math.random() * 5;
        const path = i % 4;
        
        let pathConfig;
        switch(path) {
          case 0:
            pathConfig = { x: ['-10%', '110%'], y: ['20%', '80%'] };
            break;
          case 1:
            pathConfig = { x: ['110%', '-10%'], y: ['30%', '70%'] };
            break;
          case 2:
            pathConfig = { x: ['20%', '80%'], y: ['110%', '-10%'] };
            break;
          default:
            pathConfig = { x: ['30%', '70%'], y: ['-10%', '110%'] };
        }
        
        return (
          <motion.div
            key={`flow-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/60 shadow-lg shadow-blue-400/50"
            style={{
              left: pathConfig.x[0],
              top: pathConfig.y[0],
            }}
            animate={{
              left: pathConfig.x,
              top: pathConfig.y,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.5, 1, 0.5],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "linear",
            }}
          />
        );
      })}

      {/* Emergency Vehicle Trails */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute h-0.5 w-96 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
          style={{
            left: '-25%',
            top: `${15 + i * 15}%`,
            transform: 'rotate(25deg)',
          }}
          animate={{
            left: ['-25%', '125%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Alert Indicators */}
      {[...Array(8)].map((_, i) => {
        const colorMap = {
          0: { bg: 'rgb(239, 68, 68)', shadow: 'rgba(239, 68, 68, 0.8)' },
          1: { bg: 'rgb(59, 130, 246)', shadow: 'rgba(59, 130, 246, 0.8)' },
          2: { bg: 'rgb(16, 185, 129)', shadow: 'rgba(16, 185, 129, 0.8)' },
          3: { bg: 'rgb(245, 158, 11)', shadow: 'rgba(245, 158, 11, 0.8)' },
        };
        const color = colorMap[i % 4];
        
        return (
          <motion.div
            key={`alert-${i}`}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${10 + i * 11}%`,
              top: `${5 + (i % 2) * 90}%`,
              backgroundColor: color.bg,
              boxShadow: `0 0 20px ${color.shadow}`,
            }}
            animate={{
              opacity: [1, 0.3, 1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Massive gradient orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-0 -right-40 w-[700px] h-[700px] bg-gradient-to-br from-red-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -60, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 60, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Radar sweep */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.15) 60deg, transparent 120deg)',
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Tech grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 80%)',
        }}
      />
    </div>
  );
}

function MeshGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(239, 68, 68, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)`,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 border border-blue-400/10 rounded-lg backdrop-blur-sm"
          style={{ left: `${(i * 23) % 100}%`, top: `${(i * 31) % 100}%` }}
          animate={{ rotate: [0, 180, 360], y: [0, -50, 0], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 20 + i * 2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-lg shadow-blue-400/50"
          style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 3, ease: "easeInOut" }}
        />
      ))}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`connection-${i}`}
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent origin-left"
          style={{ left: `${(i * 20) % 90}%`, top: `${(i * 15) % 90}%`, width: '150px', transform: `rotate(${i * 24}deg)` }}
          animate={{ scaleX: [0, 1, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2, ease: "easeInOut" }}
        />
      ))}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-blue-300/60 rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -200, 0], x: [-30, 30, -30], opacity: [0, 1, 0] }}
          transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
