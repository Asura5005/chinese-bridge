'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from '@/lib/AuthContext';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const C = {
    crimson: "#C0392B",
    crimsonL: "#E74C3C",
    gold: "#D4A017",
    ink: "#0D0D0D",
    ink2: "#161616",
    ink3: "#1E1E1E",
    paper: "#FAF7F2",
    sage: "#5D8A6E",
    sageL: "#7EC89A",
    dim: "rgba(255,255,255,0.07)",
    dimmer: "rgba(255,255,255,0.04)",
};

const BG_CHARS = ["学", "语", "桥", "好", "汉", "中", "你", "我", "明", "天", "友", "路"];

function Field({ label, type = "text", value, onChange, placeholder, error, icon, rightEl }) {
    const [focused, setFocused] = useState(false);
    const [show, setShow] = useState(false);
    const isPassword = type === "password";

    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.4)", textTransform: "uppercase", marginBottom: 7 }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                {icon && (
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: .4 }}>
                        {icon}
                    </span>
                )}
                <input
                    type={isPassword && show ? "text" : type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    autoComplete={isPassword ? "current-password" : "off"}
                    style={{
                        width: "100%",
                        background: focused ? "rgba(255,255,255,.06)" : C.dimmer,
                        border: `1.5px solid ${error ? C.crimson : focused ? "rgba(255,255,255,.25)" : C.dim}`,
                        borderRadius: 14,
                        padding: `14px ${isPassword || rightEl ? "44px" : "16px"} 14px ${icon ? "42px" : "16px"}`,
                        color: "white",
                        fontSize: 15,
                        fontFamily: "'DM Sans',sans-serif",
                        outline: "none",
                        transition: "all .2s",
                    }}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.35)", cursor: "pointer", fontSize: 17, padding: 0, lineHeight: 1 }}>
                        {show ? "🙈" : "👁️"}
                    </button>
                )}
                {rightEl && !isPassword && (
                    <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                        {rightEl}
                    </div>
                )}
            </div>
            {error && (
                <div style={{ fontSize: 12, color: "#E87060", marginTop: 5, paddingLeft: 4 }}>⚠ {error}</div>
            )}
        </div>
    );
}

function SocialBtn({ icon, label, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: hov ? "rgba(255,255,255,.07)" : C.dimmer,
                border: `1.5px solid ${hov ? "rgba(255,255,255,.2)" : C.dim}`,
                borderRadius: 14, padding: "12px 10px",
                color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 500,
                fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                transition: "all .2s",
            }}>
            <span style={{ fontSize: 18 }}>{icon}</span> {label}
        </button>
    );
}

function StrengthBar({ password }) {
    const score = (() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    })();
    const labels = ["", "Слабый", "Средний", "Хороший", "Сильный"];
    const colors = ["", "#E87060", "#E8C050", C.sageL, C.sageL];

    if (!password) return null;

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= score ? colors[score] : "rgba(255,255,255,.08)", transition: "background .3s" }} />
                ))}
            </div>
            <div style={{ fontSize: 11, color: colors[score] || "rgba(255,255,255,.3)" }}>
                {labels[score]}
            </div>
        </div>
    );
}

// ─── CSS — только добавлены мобильные стили ────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Noto+Serif+SC:wght@300;400;700&display=swap');

  .auth-root * { box-sizing: border-box; margin:0; padding:0; }
  .auth-root input::placeholder { color: rgba(255,255,255,.2); }
  .auth-root input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 100px #1E1E1E inset !important;
    -webkit-text-fill-color: white !important;
  }

  @keyframes floatUp {
    0%   { transform: translateY(0)   rotate(var(--r)); opacity:.03; }
    50%  { transform: translateY(-30px) rotate(var(--r)); opacity:.06; }
    100% { transform: translateY(0)   rotate(var(--r)); opacity:.03; }
  }
  @keyframes slideIn {
    from { opacity:0; transform: translateX(30px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; transform: translateY(12px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shake {
    0%,100%{ transform:translateX(0) }
    20%    { transform:translateX(-8px) }
    40%    { transform:translateX(8px) }
    60%    { transform:translateX(-5px) }
    80%    { transform:translateX(5px) }
  }

  .anim-slide  { animation: slideIn .38s cubic-bezier(.4,0,.2,1) both; }
  .anim-fade   { animation: fadeIn  .35s ease both; }
  .anim-shake  { animation: shake   .4s ease; }

  .submit-btn {
    width:100%; padding:16px; border-radius:16px;
    background: #C0392B; color:white; border:none;
    font-family:'Playfair Display',serif; font-size:17px; font-weight:700;
    cursor:pointer; letter-spacing:.3px;
    transition: all .22s;
    position:relative; overflow:hidden;
  }
  .submit-btn::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg,rgba(255,255,255,.12),transparent);
    opacity:0; transition:opacity .2s;
  }
  .submit-btn:hover:not(:disabled)::after { opacity:1; }
  .submit-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow: 0 14px 36px rgba(192,57,43,.45);
  }
  .submit-btn:disabled { opacity:.6; cursor:default; }

  .tab-btn {
    flex:1; padding:10px; border:none; background:transparent;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; border-radius:12px; transition:all .2s; letter-spacing:.2px;
  }
  .tab-btn.active  { background:#C0392B; color:white; box-shadow:0 6px 20px rgba(192,57,43,.35); }
  .tab-btn.inactive{ color:rgba(255,255,255,.4); }
  .tab-btn.inactive:hover { color:rgba(255,255,255,.7); }

  .lang-opt {
    display:flex; align-items:center; gap:6px;
    padding:6px 12px; border-radius:10px;
    cursor:pointer; font-size:13px; font-weight:500;
    color:rgba(255,255,255,.45); transition:all .15s;
    border:1.5px solid transparent;
  }
  .lang-opt:hover { color:white; background:rgba(255,255,255,.05); }
  .lang-opt.active { color:white; border-color:rgba(192,57,43,.5); background:rgba(192,57,43,.12); }

  .float-char {
    position:absolute; font-family:'Noto Serif SC',serif;
    animation: floatUp var(--dur) ease-in-out infinite;
    animation-delay: var(--delay);
    user-select:none; pointer-events:none;
  }

  /* ════════════════════════════
     МОБАЙЛ — только стили, 
     логика не тронута
  ════════════════════════════ */
  @media (max-width: 768px) {

    /* Скрываем левую декоративную панель */
    .auth-left-panel {
      display: none !important;
    }

    /* Форма занимает весь экран */
    .auth-grid {
      grid-template-columns: 1fr !important;
    }
    .auth-right-panel {
      padding: 28px 20px 40px !important;
      min-height: 100vh;
    }

    /* Кнопка "Назад" ближе к краю */
    .auth-back-btn {
      top: 16px !important;
      left: 16px !important;
    }

    /* Логотип мобайл — показываем вместо левой панели */
    .auth-mobile-logo {
      display: flex !important;
    }

    /* Языки — компактнее */
    .auth-lang-row {
      flex-wrap: wrap !important;
      justify-content: center !important;
      gap: 4px !important;
      margin-bottom: 20px !important;
    }
    .lang-opt {
      padding: 4px 8px !important;
      font-size: 11px !important;
    }

    /* Заголовок */
    .auth-heading {
      font-size: 22px !important;
    }
    .auth-sub {
      font-size: 13px !important;
    }

    /* Кнопка сабмит */
    .submit-btn {
      font-size: 15px !important;
      padding: 14px !important;
      border-radius: 14px !important;
    }

    /* Кнопки целей обучения — меньше отступы */
    .goal-btn {
      padding: 6px 10px !important;
      font-size: 11px !important;
    }
  }

  @media (max-width: 400px) {
    .auth-right-panel {
      padding: 20px 14px 36px !important;
    }
    .auth-heading {
      font-size: 19px !important;
    }
    .tab-btn {
      font-size: 13px !important;
      padding: 9px 6px !important;
    }
  }
`;

const LANGS = [
    { code: "ru", flag: "🇷🇺", label: "Русский" },
    { code: "uz", flag: "🇺🇿", label: "O'zbek" },
    { code: "en", flag: "🇬🇧", label: "English" },
    { code: "zh", flag: "🇨🇳", label: "中文" },
];

const T = {
    ru: {
        login: "Войти", register: "Регистрация",
        welcome: "С возвращением", welcomeSub: "Продолжи учить китайский 🎯",
        join: "Присоединиться", joinSub: "Создай аккаунт и начни бесплатно",
        email: "Email", emailPh: "твой@email.com",
        password: "Пароль", passPh: "Минимум 8 символов",
        confirm: "Подтверди пароль", confirmPh: "Повтори пароль",
        name: "Имя", namePh: "Как тебя зовут?",
        forgot: "Забыл пароль?",
        noAcc: "Нет аккаунта?", hasAcc: "Уже есть аккаунт?",
        orWith: "или войти через",
        submit_login: "Войти в аккаунт →",
        submit_reg: "Создать аккаунт →",
        terms: "Регистрируясь, ты соглашаешься с условиями использования",
        loading: "Загружаем...",
        errEmail: "Введи корректный email",
        errPass: "Минимум 8 символов",
        errConfirm: "Пароли не совпадают",
        errName: "Введи своё имя",
        goal: "Цель обучения", goalPh: "Зачем учишь китайский?",
        goals: ["Путешествие в Китай 🧳", "Учёба в университете 📚", "Бизнес 💼", "Интерес к культуре 🎋", "Другое"],
    },
    uz: {
        login: "Kirish", register: "Ro'yxatdan o'tish",
        welcome: "Xush kelibsiz", welcomeSub: "Xitoy tilini o'rganishni davom eting 🎯",
        join: "Qo'shilish", joinSub: "Hisob yarating va bepul boshlang",
        email: "Email", emailPh: "sizning@email.com",
        password: "Parol", passPh: "Kamida 8 belgi",
        confirm: "Parolni tasdiqlang", confirmPh: "Parolni qaytaring",
        name: "Ism", namePh: "Ismingiz nima?",
        forgot: "Parolni unutdingizmi?",
        noAcc: "Hisobingiz yo'qmi?", hasAcc: "Hisobingiz bormi?",
        orWith: "yoki orqali kiring",
        submit_login: "Hisobga kirish →",
        submit_reg: "Hisob yaratish →",
        terms: "Ro'yxatdan o'tib, foydalanish shartlariga rozisiz",
        loading: "Yuklanmoqda...",
        errEmail: "To'g'ri email kiriting",
        errPass: "Kamida 8 belgi",
        errConfirm: "Parollar mos kelmaydi",
        errName: "Ismingizni kiriting",
        goal: "O'quv maqsadi", goalPh: "Nima uchun xitoy tilini o'rganasiz?",
        goals: ["Xitoyga sayohat 🧳", "Universitetda o'qish 📚", "Biznes 💼", "Madaniyatga qiziqish 🎋", "Boshqa"],
    },
    en: {
        login: "Log In", register: "Register",
        welcome: "Welcome back", welcomeSub: "Continue your Chinese journey 🎯",
        join: "Join us", joinSub: "Create your free account today",
        email: "Email", emailPh: "your@email.com",
        password: "Password", passPh: "At least 8 characters",
        confirm: "Confirm Password", confirmPh: "Repeat your password",
        name: "Full Name", namePh: "What's your name?",
        forgot: "Forgot password?",
        noAcc: "No account yet?", hasAcc: "Already have an account?",
        orWith: "or continue with",
        submit_login: "Sign in →",
        submit_reg: "Create account →",
        terms: "By registering you agree to our Terms of Service",
        loading: "Loading...",
        errEmail: "Enter a valid email",
        errPass: "At least 8 characters",
        errConfirm: "Passwords don't match",
        errName: "Enter your name",
        goal: "Learning Goal", goalPh: "Why are you learning Chinese?",
        goals: ["Travel to China 🧳", "University Studies 📚", "Business 💼", "Cultural Interest 🎋", "Other"],
    },
    zh: {
        login: "登录", register: "注册",
        welcome: "欢迎回来", welcomeSub: "继续学习中文 🎯",
        join: "加入我们", joinSub: "今天创建您的免费账户",
        email: "邮箱", emailPh: "您的@邮箱.com",
        password: "密码", passPh: "至少8个字符",
        confirm: "确认密码", confirmPh: "重复您的密码",
        name: "姓名", namePh: "您叫什么名字？",
        forgot: "忘记密码？",
        noAcc: "还没有账户？", hasAcc: "已有账户？",
        orWith: "或通过以下方式",
        submit_login: "登录账户 →",
        submit_reg: "创建账户 →",
        terms: "注册即表示同意服务条款",
        loading: "加载中...",
        errEmail: "请输入有效邮箱",
        errPass: "至少8个字符",
        errConfirm: "密码不匹配",
        errName: "请输入姓名",
        goal: "学习目标", goalPh: "为什么学中文？",
        goals: ["前往中国旅行 🧳", "大学学习 📚", "商务 💼", "文化兴趣 🎋", "其他"],
    },
};

export default function AuthPage() {
    const router = useRouter();
    const { loginWithGoogle } = useAuth();

    const [tab, setTab] = useState("login");
    const [lang, setLang] = useState("ru");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);
    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [name, setName] = useState("");
    const [goal, setGoal] = useState("");
    const [errors, setErrors] = useState({});

    const t = T[lang];

    const validate = () => {
        const e = {};
        if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = t.errEmail;
        if (!password || password.length < 8) e.password = t.errPass;
        if (tab === "register") {
            if (step === 1 && !name) e.name = t.errName;
            if (step === 2 && password !== confirm) e.confirm = t.errConfirm;
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── ВСЯ ЛОГИКА ТВОЯ — НЕ ТРОНУТА ──────────────────────
    const handleSubmit = async () => {
        if (!validate()) { setShakeKey(k => k + 1); return; }
        if (tab === "register" && step === 1) { setStep(2); return; }

        setLoading(true);

        try {
            if (tab === "register") {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', result.user.uid), {
                    uid: result.user.uid,
                    name: name,
                    email: email,
                    goal: goal || "Учёба",
                    xp: 0,
                    streak: 0,
                    hskLevel: 1,
                    role: email === 'aslanjumaboev007@gmail.com' ? 'admin' : 'student',
                    joinDate: new Date().toISOString()
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }

            setLoading(false);
            setSuccess(true);

            setTimeout(() => {
                router.push('/profile');
            }, 2000);

        } catch (error) {
            console.error("Auth Error:", error);
            setLoading(false);
            alert("Ошибка! Проверь правильность данных или такой пользователь уже существует.");
        }
    };

    const handleGoogleClick = async () => {
        try {
            await loginWithGoogle();
            setSuccess(true);
            setTimeout(() => {
                router.push('/profile');
            }, 2000);
        } catch (err) {
            console.error("Google Auth Error:", err);
        }
    };

    const switchTab = (t) => {
        setTab(t); setErrors({}); setStep(1);
        setEmail(""); setPassword(""); setConfirm(""); setName(""); setGoal("");
        setSuccess(false);
    };
    // ───────────────────────────────────────────────────────

    if (success) {
        return (
            <>
                <style>{css}</style>
                <div className="auth-root" style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div className="anim-fade" style={{ textAlign: "center", maxWidth: 360 }}>
                        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 900, color: C.gold, marginBottom: 10 }}>
                            {tab === "login" ? "Добро пожаловать!" : "Аккаунт создан!"}
                        </div>
                        <div style={{ fontSize: 15, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>
                            {tab === "login" ? `С возвращением, ${email}` : `Привет, ${name}! 你好！`}
                        </div>
                        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 48, color: C.crimson, margin: "16px 0" }}>
                            欢迎
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginBottom: 28 }}>
                            Перенаправляем в Профиль...
                        </div>
                        <div style={{ width: 40, height: 40, border: `3px solid rgba(255,255,255,.1)`, borderTop: `3px solid ${C.crimson}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{css}</style>
            <div className="auth-root">

                {/* ── Кнопка назад ── */}
                <Link
                    href="/"
                    className="auth-back-btn"
                    style={{ position: "absolute", top: 32, left: 32, color: "rgba(255,255,255,0.4)", textDecoration: "none", zIndex: 10, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                >
                    <span style={{ fontSize: 18 }}>←</span> На главную
                </Link>

                {/* ── Мобайл: логотип вместо левой панели ── */}
                <div
                    className="auth-mobile-logo"
                    style={{
                        display: "none", /* показывается только на мобайле через CSS */
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        paddingTop: 60,
                        paddingBottom: 8,
                    }}
                >
                    <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 28, color: C.crimson }}>桥</span>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "white" }}>ChineseBridge</span>
                </div>

                {/* ── Основная сетка ── */}
                <div
                    className="auth-grid"
                    style={{
                        minHeight: "100vh",
                        background: C.ink,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >

                    {/* ── ЛЕВАЯ ПАНЕЛЬ (декоративная, скрывается на мобайле) ── */}
                    <div
                        className="auth-left-panel"
                        style={{ position: "relative", background: C.ink2, borderRight: `1px solid ${C.dim}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, overflow: "hidden" }}
                    >
                        {BG_CHARS.map((ch, i) => (
                            <div key={i} className="float-char" style={{
                                fontSize: 60 + (i % 4) * 30,
                                color: "rgba(255,255,255,1)",
                                top: `${8 + (i * 7.5) % 85}%`,
                                left: `${5 + (i * 11) % 80}%`,
                                "--r": `${(i % 3 - 1) * 12}deg`,
                                "--dur": `${6 + (i % 4)}s`,
                                "--delay": `${-(i * 1.1)}s`,
                            }}>
                                {ch}
                            </div>
                        ))}

                        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 48 }}>
                                <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 32, color: C.crimson }}>桥</span>
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "white" }}>ChineseBridge</span>
                            </div>
                            <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 110, lineHeight: 1, color: "white", marginBottom: 10, textShadow: `0 0 60px rgba(192,57,43,.3)` }}>
                                {tab === "login" ? "欢迎" : "开始"}
                            </div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: "rgba(255,255,255,.45)", marginBottom: 40 }}>
                                {tab === "login" ? '"Welcome back"' : '"Let\'s begin"'}
                            </div>
                            {["🎯 Умные тесты", "🔊 Аудио тоны", "📊 Прогресс", "🏆 Рейтинг", "✍️ Иероглифы"].map((f, i) => (
                                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.05)", border: `1px solid ${C.dim}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "rgba(255,255,255,.6)", margin: 4 }}>
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── ПРАВАЯ ПАНЕЛЬ (форма) ── */}
                    <div
                        className="auth-right-panel"
                        style={{ display: "flex", flexDirection: "column", padding: "40px 56px", overflowY: "auto" }}
                    >
                        {/* Выбор языка */}
                        <div className="auth-lang-row" style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginBottom: 32 }}>
                            {LANGS.map(l => (
                                <div key={l.code} className={`lang-opt ${lang === l.code ? "active" : ""}`} onClick={() => setLang(l.code)}>
                                    {l.flag} {l.label}
                                </div>
                            ))}
                        </div>

                        {/* Табы войти/регистрация */}
                        <div className="auth-tab-row" style={{ display: "flex", gap: 4, background: C.ink3, borderRadius: 16, padding: 5, marginBottom: 36, border: `1px solid ${C.dim}` }}>
                            <button className={`tab-btn ${tab === "login" ? "active" : "inactive"}`} onClick={() => switchTab("login")}>{t.login}</button>
                            <button className={`tab-btn ${tab === "register" ? "active" : "inactive"}`} onClick={() => switchTab("register")}>{t.register}</button>
                        </div>

                        {/* Заголовок + степпер */}
                        <div className="anim-slide" key={tab} style={{ marginBottom: 32 }}>
                            <div className="auth-heading" style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 900, letterSpacing: -.5, color: "white", marginBottom: 6 }}>
                                {tab === "login" ? t.welcome : t.join}
                            </div>
                            <div className="auth-sub" style={{ fontSize: 15, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>
                                {tab === "login" ? t.welcomeSub : t.joinSub}
                            </div>
                            {tab === "register" && (
                                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                                    {[1, 2].map(s => (
                                        <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: step >= s ? C.crimson : C.ink3, border: `1.5px solid ${step >= s ? C.crimson : C.dim}`, color: step >= s ? "white" : "rgba(255,255,255,.3)", transition: "all .3s" }}>
                                                {step > s ? "✓" : s}
                                            </div>
                                            <div style={{ fontSize: 12, color: step >= s ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.25)" }}>
                                                {s === 1 ? "Профиль" : "Безопасность"}
                                            </div>
                                            {s < 2 && <div style={{ width: 24, height: 1, background: step > 1 ? C.crimson : C.dim, transition: "background .3s" }} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Форма */}
                        <div className={shakeKey ? "anim-shake" : ""} key={`form-${tab}-${step}-${shakeKey}`}>

                            {tab === "login" && (
                                <>
                                    <Field label={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPh} error={errors.email} icon="✉️" />
                                    <Field label={t.password} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passPh} error={errors.password} icon="🔒" />
                                    <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
                                        <button style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{t.forgot}</button>
                                    </div>
                                </>
                            )}

                            {tab === "register" && step === 1 && (
                                <>
                                    <Field label={t.name} value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} error={errors.name} icon="👤" />
                                    <Field label={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPh} error={errors.email} icon="✉️" />
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.4)", textTransform: "uppercase", marginBottom: 8 }}>{t.goal}</label>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                            {t.goals.map(g => (
                                                <button
                                                    key={g}
                                                    className="goal-btn"
                                                    onClick={() => setGoal(g)}
                                                    style={{ padding: "7px 13px", borderRadius: 20, border: `1.5px solid ${goal === g ? C.crimson : C.dim}`, background: goal === g ? "rgba(192,57,43,.15)" : "transparent", color: goal === g ? "white" : "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .18s" }}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {tab === "register" && step === 2 && (
                                <>
                                    <Field label={t.password} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passPh} error={errors.password} icon="🔒" />
                                    <StrengthBar password={password} />
                                    <Field label={t.confirm} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t.confirmPh} error={errors.confirm} icon="🔐" />
                                </>
                            )}

                            <button className="submit-btn" disabled={loading} onClick={handleSubmit} style={{ marginTop: 4 }}>
                                {loading
                                    ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                        <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
                                        {t.loading}
                                    </span>
                                    : tab === "login" ? t.submit_login : step === 1 ? "Далее →" : t.submit_reg
                                }
                            </button>

                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px" }}>
                                <div style={{ flex: 1, height: 1, background: C.dim }} />
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", whiteSpace: "nowrap" }}>{t.orWith}</span>
                                <div style={{ flex: 1, height: 1, background: C.dim }} />
                            </div>

                            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                                <SocialBtn icon="🇬" label="Войти через Google" onClick={handleGoogleClick} />
                            </div>

                            <div style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,.4)" }}>
                                {tab === "login" ? t.noAcc : t.hasAcc}{" "}
                                <button
                                    onClick={() => switchTab(tab === "login" ? "register" : "login")}
                                    style={{ background: "none", border: "none", color: C.crimson, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}
                                >
                                    {tab === "login" ? t.register : t.login}
                                </button>
                            </div>

                            {tab === "register" && (
                                <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 16, lineHeight: 1.5 }}>
                                    {t.terms}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
