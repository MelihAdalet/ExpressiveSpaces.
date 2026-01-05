
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  currentSize: number;
  type: 'circle' | 'squircle' | 'pill';
  rotation: number;
  rotationSpeed: number;
  opacity: number; // Store opacity separately to update color dynamically
  color: string;
}

const BackgroundShapes: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = width < 768 ? 20 : 45;
    const mouse = { x: -1000, y: -1000, active: false };
    let clickPulse = { x: -1000, y: -1000, active: false, frame: 0 };

    // Helper to get current theme color directly from CSS variables
    const getCurrentThemeColor = (opacity: number) => {
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      
      if (primary.startsWith('hsl')) {
        return primary.replace(')', `, ${opacity})`).replace('hsl', 'hsla');
      }
      if (primary.startsWith('rgb')) {
        return primary.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
      }
      return isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`;
    };

    const createParticle = (randomY = false): Particle => {
      const types: Particle['type'][] = ['circle', 'squircle', 'pill'];
      const size = Math.random() * 50 + 30;
      const opacity = Math.random() * 0.17 + 0.08;
      
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -size - Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 0.8 + 0.4,
        baseSize: size,
        currentSize: size,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        opacity: opacity,
        color: getCurrentThemeColor(opacity)
      };
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(true));
      }
    };

    const drawSquircle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const r = size / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + r);
      ctx.quadraticCurveTo(x + size, y + size, x + r, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    const drawPill = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const width = size;
      const height = size / 2;
      const r = height / 2;
      ctx.beginPath();
      ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
      ctx.arc(x + width - r, y + r, r, Math.PI * 1.5, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Get the primary color once per frame to update all particles
      // This allows them to shift colors during Rainbow Mode without jumping
      const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

      particles.forEach((p, i) => {
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotationSpeed;

        // Interaction Physics
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactRadius = 300;

        if (dist < interactRadius) {
          const proximity = 1 - (dist / interactRadius);
          const targetSize = p.baseSize * (1 + proximity * 0.5);
          p.currentSize += (targetSize - p.currentSize) * 0.1;
          const force = (interactRadius - dist) / interactRadius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.8;
          p.vy += Math.sin(angle) * force * 0.8;
        } else {
          p.currentSize += (p.baseSize - p.currentSize) * 0.05;
        }

        if (clickPulse.active) {
          const cdx = p.x - clickPulse.x;
          const cdy = p.y - clickPulse.y;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
          const shockRadius = 500;
          if (cDist < shockRadius) {
             const force = (shockRadius - cDist) / shockRadius;
             const angle = Math.atan2(cdy, cdx);
             p.vx += Math.cos(angle) * force * 5; 
             p.vy += Math.sin(angle) * force * 5;
          }
        }

        p.vx *= 0.96;
        if (p.vy < 0.2) p.vy += 0.02;
        if (p.vy > 2.5) p.vy *= 0.95;

        if (p.y > height + p.currentSize) {
          particles[i] = createParticle();
        }
        if (p.x > width + p.currentSize || p.x < -p.currentSize) {
          particles[i] = createParticle();
          particles[i].y = Math.random() * height;
        }

        // Update color dynamically from the current primary variable
        let colorStr = currentPrimary;
        if (colorStr.startsWith('hsl')) {
          colorStr = colorStr.replace(')', `, ${p.opacity})`).replace('hsl', 'hsla');
        } else if (colorStr.startsWith('rgb')) {
          colorStr = colorStr.replace(')', `, ${p.opacity})`).replace('rgb', 'rgba');
        }
        p.color = colorStr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.currentSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'squircle') {
          drawSquircle(ctx, -p.currentSize/2, -p.currentSize/2, p.currentSize);
        } else if (p.type === 'pill') {
          drawPill(ctx, -p.currentSize/2, -p.currentSize/4, p.currentSize);
        }
        
        ctx.restore();
      });

      if (clickPulse.active) {
        clickPulse.frame++;
        if (clickPulse.frame > 5) clickPulse.active = false;
      }

      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      clickPulse = { x: e.clientX, y: e.clientY, active: true, frame: 0 };
    };
    
    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    initParticles();
    const animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isDarkMode]); // Seed color removed to prevent jumping re-initialization

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

export default BackgroundShapes;
