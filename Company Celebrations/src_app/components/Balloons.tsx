import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Balloon {
  id: string;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

const balloonColors = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#FFE66D', // yellow
  '#95E1D3', // mint
  '#FF8C94', // pink
  '#A8E6CF', // light green
  '#FFD3B6', // peach
  '#8E7CC3', // purple
];

export function Balloons() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [screenHeight, setScreenHeight] = useState(800); // Default height

  useEffect(() => {
    // Set screen height safely
    if (typeof window !== 'undefined') {
      setScreenHeight(window.innerHeight);
    }

    // Generate random balloons (reduced from 15 to 10 for performance)
    const timestamp = Date.now();
    const newBalloons: Balloon[] = [];
    for (let i = 0; i < 10; i++) {
      newBalloons.push({
        id: `balloon-${timestamp}-${i}`,
        x: Math.random() * 100,
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
      });
    }
    setBalloons(newBalloons);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
      {balloons.map((balloon) => (
        <motion.div
          key={balloon.id}
          className="absolute"
          style={{
            left: `${balloon.x}%`,
            bottom: '-120px',
          }}
          animate={{
            y: [0, -(screenHeight + 200)],
            x: [0, Math.sin(balloon.x) * 50],
          }}
          transition={{
            duration: balloon.duration,
            delay: balloon.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
            {/* Balloon body */}
            <ellipse
              cx="30"
              cy="35"
              rx="25"
              ry="30"
              fill={balloon.color}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
            />
            {/* Highlight */}
            <ellipse
              cx="20"
              cy="25"
              rx="8"
              ry="10"
              fill="rgba(255,255,255,0.4)"
            />
            {/* String */}
            <path
              d="M 30 65 Q 28 70, 30 75 Q 32 70, 30 65"
              stroke={balloon.color}
              strokeWidth="1"
              fill="none"
            />
            {/* Knot */}
            <circle cx="30" cy="65" r="2" fill={balloon.color} />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
