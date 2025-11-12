import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground({ variant = 'default' }) {
  if (variant === 'mesh') {
    return <MeshGradientBackground />;
  }
  
  if (variant === 'particles') {
    return <ParticleBackground />;
  }

  return <DefaultBackground />;
}

// Default animated background for landing page
function DefaultBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-purple-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 60, 0],
          y: [0, 40, 0],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-rose-500/20 via-red-400/15 to-orange-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 60, 0],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-1/3 w-[550px] h-[550px] bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 50, 0],
          y: [0, -50, 0],
          rotate: [0, 120, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Medium floating orbs */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-400/25 to-purple-500/25 rounded-full blur-2xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -80, 0],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-pink-400/25 to-rose-500/25 rounded-full blur-2xl"
        animate={{
          x: [0, -120, 0],
          y: [0, 70, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      {/* Floating particles with varied colors */}
      {[...Array(30)].map((_, i) => {
        const colors = [
          'bg-blue-400/40',
          'bg-red-400/40',
          'bg-emerald-400/40',
          'bg-purple-400/40',
          'bg-rose-400/40',
          'bg-cyan-400/40',
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() > 0.5 ? 'w-2 h-2' : 'w-1.5 h-1.5';
        
        return (
          <motion.div
            key={i}
            className={`absolute ${size} ${randomColor} rounded-full`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150 - Math.random() * 100, 0],
              x: [-20 + Math.random() * 40, 20 + Math.random() * 40, -20 + Math.random() * 40],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 12 + Math.random() * 15,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Animated lines/connections */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
          style={{
            left: `${i * 15}%`,
            top: `${20 + i * 10}%`,
            width: '200px',
          }}
          animate={{
            x: [0, 100, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Subtle grid pattern with animation */}
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '100px 100px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Radial glow effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Scattered light spots */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`spot-${i}`}
          className="absolute w-3 h-3 bg-white/20 rounded-full blur-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Mesh gradient background for auth pages
function MeshGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 60%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 90% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)
          `,
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating squares */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 border border-blue-400/10 rounded-lg backdrop-blur-sm"
          style={{
            left: `${(i * 23) % 100}%`,
            top: `${(i * 31) % 100}%`,
          }}
          animate={{
            rotate: [0, 180, 360],
            y: [0, -50, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 20 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Particle background for Register page
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Network nodes */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-lg shadow-blue-400/50"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 23) % 100}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Connecting lines */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`connection-${i}`}
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent origin-left"
          style={{
            left: `${(i * 20) % 90}%`,
            top: `${(i * 15) % 90}%`,
            width: '150px',
            transform: `rotate(${i * 24}deg)`,
          }}
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing particles */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-blue-300/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -200, 0],
            x: [-30, 30, -30],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
