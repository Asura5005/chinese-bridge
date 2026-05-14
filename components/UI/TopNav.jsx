'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';

export default function TopNav({ streak = null }) {
  const pathname = usePathname();
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: '🏠 Главная' },
    { path: '/trainer', label: '🎯 Тренажёр' },
    { path: '/profile', label: '📊 Профиль' },
  ];

  if (isAdmin) {
    navLinks.push({ path: '/admin-panel', label: '⚙️ Админка' });
  }

  return (
    <>
      <style>{`
        .topnav-links { display: flex; gap: 4px; flex: 1; overflow-x: auto; }
        .topnav-desktop-icons { display: flex; gap: 6px; }
        .topnav-brand-text { display: inline; }
        .topnav-mobile-menu {
          display: none;
          position: fixed;
          top: 52px;
          left: 0;
          right: 0;
          background: rgba(10,10,10,0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 8px 16px 16px;
          z-index: 99;
          flex-direction: column;
          gap: 4px;
        }
        .topnav-mobile-menu.open { display: flex; }
        .topnav-hamburger { display: none; }

        @media (max-width: 600px) {
          .topnav-links { display: none; }
          .topnav-desktop-icons { display: none; }
          .topnav-brand-text { display: none; }
          .topnav-hamburger { display: flex; }
        }
      `}</style>

      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,10,.93)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 16px",
        display: "flex", alignItems: "center",
        height: 52, gap: 12
      }}>

        {/* Логотип */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 20, color: '#C0392B' }}>桥</span>
          <span className="topnav-brand-text" style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "white" }}>
            ChineseBridge
          </span>
        </Link>

        {/* Десктопные ссылки */}
        <div className="topnav-links">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link key={link.path} href={link.path} style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: "6px 14px", borderRadius: 20, border: "none",
                  background: isActive ? "rgba(192,57,43,.15)" : "transparent",
                  color: isActive ? "white" : "rgba(255,255,255,.45)",
                  fontSize: 13, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap"
                }}>
                  {link.label}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Правая часть */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>

          {/* Стрик */}
          {streak !== null && (
            <div style={{
              background: "rgba(212,160,23,.12)",
              border: "1px solid rgba(212,160,23,.25)",
              borderRadius: 20, padding: "4px 10px",
              fontSize: 12, fontWeight: 600, color: '#D4A017', flexShrink: 0
            }}>
              🔥 {streak}
            </div>
          )}

          {/* Иконки — скрыты на мобайл */}
          <div className="topnav-desktop-icons">
            <button title="Обновления сайта" style={{ width: 34, height: 34, borderRadius: "50%", background: '#181818', border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bell size={16} />
            </button>
            <button title="Служба поддержки" style={{ width: 34, height: 34, borderRadius: "50%", background: '#181818', border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <MessageCircle size={16} />
            </button>
          </div>

          {/* Аватар / Войти */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", cursor: "pointer", border: isAdmin ? '2px solid #D4A017' : 'none' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: 'linear-gradient(135deg,#C0392B,#D4A017)', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "white" }}>
                    {user.email[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <button onClick={logout} title="Выйти" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={loginWithGoogle} style={{ background: "#C0392B", color: "white", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              Войти
            </button>
          )}

          {/* Гамбургер — только мобайл */}
          <button
            className="topnav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", alignItems: "center", justifyContent: "center", padding: 4 }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      <div className={`topnav-mobile-menu${menuOpen ? ' open' : ''}`}>
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link key={link.path} href={link.path} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
              <button style={{
                width: "100%", padding: "11px 16px", borderRadius: 12, border: "none",
                background: isActive ? "rgba(192,57,43,.15)" : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,.55)",
                fontSize: 14, cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 8,
                borderLeft: isActive ? "2px solid #C0392B" : "2px solid transparent"
              }}>
                {link.label}
              </button>
            </Link>
          );
        })}

        {/* Bell и Chat внутри мобильного меню */}
        <div style={{ display: "flex", gap: 8, padding: "8px 4px 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4 }}>
          <button title="Обновления" style={{ flex: 1, height: 38, borderRadius: 10, background: '#181818', border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
            <Bell size={15} /> Обновления
          </button>
          <button title="Поддержка" style={{ flex: 1, height: 38, borderRadius: 10, background: '#181818', border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
            <MessageCircle size={15} /> Поддержка
          </button>
        </div>
      </div>
    </>
  );
}