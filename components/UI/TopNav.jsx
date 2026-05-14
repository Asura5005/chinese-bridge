'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function TopNav({ streak = null }) {
  const pathname = usePathname();
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();

  const navLinks = [
    { path: '/', label: '🏠 Главная' },
    { path: '/trainer', label: '🎯 Тренажёр' },
    { path: '/profile', label: '📊 Профиль' },
  ];

  // Добавляем админку только если это Aslan
  if (isAdmin) {
    navLinks.push({ path: '/admin-panel', label: '⚙️ Админка' });
  }

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,.93)", backdropFilter: "blur(20px)", borderBottom: `1px solid rgba(255,255,255,0.07)`, padding: "0 24px", display: "flex", alignItems: "center", height: 52, gap: 16 }}>

      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 8 }}>
        <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 20, color: '#C0392B' }}>桥</span>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "white" }} className="hide-on-mobile">ChineseBridge</span>
      </Link>

      <div style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto" }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link key={link.path} href={link.path} style={{ textDecoration: 'none' }}>
              <button style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: isActive ? "rgba(192,57,43,.15)" : "transparent", color: isActive ? "white" : "rgba(255,255,255,.45)", fontSize: 13, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
                {link.label}
              </button>
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {streak !== null && (
          <div style={{ background: "rgba(212,160,23,.12)", border: "1px solid rgba(212,160,23,.25)", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: '#D4A017' }}>
            🔥 {streak}
          </div>
        )}

        {/* Уведомления и Поддержка (Новые иконки) */}
        <div style={{ display: "flex", gap: 6 }}>
          <button title="Обновления сайта" style={{ width: 34, height: 34, borderRadius: "50%", background: '#181818', border: `1px solid rgba(255,255,255,0.07)`, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell size={16} />
          </button>
          <button title="Служба поддержки" style={{ width: 34, height: 34, borderRadius: "50%", background: '#181818', border: `1px solid rgba(255,255,255,0.07)`, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <MessageCircle size={16} />
          </button>
        </div>

        {/* Профиль или Вход */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", cursor: "pointer", border: isAdmin ? '2px solid #D4A017' : 'none' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: 'linear-gradient(135deg,#C0392B,#D4A017)', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "white" }}>
                  {user.email[0].toUpperCase()}
                </div>
              )}
            </Link>
            <button onClick={logout} title="Выйти" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><LogOut size={18} /></button>
          </div>
        ) : (
          <button onClick={loginWithGoogle} style={{ background: "#C0392B", color: "white", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Войти
          </button>
        )}
      </div>
    </div>
  );
}