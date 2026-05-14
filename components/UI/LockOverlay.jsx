'use client'
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function LockOverlay({ title = "Требуется регистрация" }) {
  const { loginWithGoogle } = useAuth();
  
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.4)', borderRadius: 'inherit' }}>
      <div style={{ background: '#161616', padding: '30px 40px', borderRadius: 24, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(192,57,43,0.15)', color: '#C0392B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={32} />
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, maxWidth: 280, lineHeight: 1.5 }}>
          Войди через Google, чтобы открыть весь функционал, сохранять прогресс и соревноваться с друзьями.
        </p>
        <button onClick={loginWithGoogle} style={{ background: '#C0392B', color: 'white', border: 'none', borderRadius: 20, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(192,57,43,0.4)'}} onMouseLeave={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'}}>
          <span style={{ fontSize: 18 }}>G</span> Войти бесплатно
        </button>
      </div>
    </div>
  );
}