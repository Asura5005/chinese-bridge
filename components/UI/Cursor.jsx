'use client'
import { useEffect, useState } from 'react';

export default function Cursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [ringPosition, setRingPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setTimeout(() => {
        setRingPosition({ x: e.clientX, y: e.clientY });
      }, 80);
    };

    const handleMouseOver = (e) => {
      if (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button' || e.target.closest('a') || e.target.closest('button')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  },[]);

  return (
    <>
      <div 
        style={{
          position: 'fixed', width: 12, height: 12, background: isHovered ? 'var(--gold)' : 'var(--crimson)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 9999,
          transition: 'transform 0.15s ease, background 0.2s',
          transform: `translate(-50%, -50%) scale(${isHovered ? 2 : 1})`,
          left: position.x, top: position.y,
          display: typeof window !== 'undefined' && window.innerWidth < 900 ? 'none' : 'block'
        }} 
      />
      <div 
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9998, borderRadius: '50%',
          border: `1.5px solid ${isHovered ? 'rgba(212,160,23,0.4)' : 'rgba(192,57,43,0.5)'}`,
          width: isHovered ? 60 : 36, height: isHovered ? 60 : 36,
          transition: 'width 0.2s, height 0.2s, border-color 0.2s',
          transform: 'translate(-50%, -50%)',
          left: ringPosition.x, top: ringPosition.y,
          display: typeof window !== 'undefined' && window.innerWidth < 900 ? 'none' : 'block'
        }} 
      />
    </>
  );
}