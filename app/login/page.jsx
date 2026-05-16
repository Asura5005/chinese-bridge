'use client'
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from '@/lib/AuthContext';
import { auth, db } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    OAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const EMAILJS_PUBLIC_KEY = "ВАШ_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "ВАШ_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "ВАШ_TEMPLATE_ID";
const OTP_EXPIRES_MIN = 10;

let emailjsLoaded = false;
async function loadEmailJS() {
    if (typeof window === 'undefined') return;
    if (window.emailjs) { emailjsLoaded = true; return; }
    if (emailjsLoaded) return;
    await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
        s.onload = () => { window.emailjs.init(EMAILJS_PUBLIC_KEY); emailjsLoaded = true; res(); };
        s.onerror = rej;
        document.head.appendChild(s);
    });
}

async function sendOTP(email, name) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + OTP_EXPIRES_MIN * 60 * 1000;

    const oldQ = query(collection(db, "otpCodes"), where("email", "==", email));
    const oldSnap = await getDocs(oldQ);
    await Promise.all(oldSnap.docs.map(d => deleteDoc(d.ref)));

    await addDoc(collection(db, "otpCodes"), { email, code, expires, used: false });

    await loadEmailJS();
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,
        to_name: name || email,
        code,
        expires_min: OTP_EXPIRES_MIN,
    });

    return code;
}

async function verifyOTP(email, inputCode) {
    const q = query(
        collection(db, "otpCodes"),
        where("email", "==", email),
        where("code", "==", inputCode),
        where("used", "==", false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return { ok: false, reason: "wrong" };

    const otpDoc = snap.docs[0];
    if (Date.now() > otpDoc.data().expires) {
        await deleteDoc(otpDoc.ref);
        return { ok: false, reason: "expired" };
    }

    await deleteDoc(otpDoc.ref);
    return { ok: true };
}

const C = {
    crimson: "#C0392B", crimsonL: "#E74C3C", gold: "#D4A017",
    ink: "#0D0D0D", ink2: "#161616", ink3: "#1E1E1E",
    paper: "#FAF7F2", sage: "#5D8A6E", sageL: "#7EC89A",
    dim: "rgba(255,255,255,0.07)", dimmer: "rgba(255,255,255,0.04)",
};

const BG_CHARS = ["学", "语", "桥", "好", "汉", "中", "你", "我", "明", "天", "友", "路"];

function OTPInput({ value, onChange, error }) {
    const inputs = useRef([]);

    const handleKey = (e, i) => {
        if (e.key === "Backspace") {
            if (!value[i] && i > 0) {
                inputs.current[i - 1]?.focus();
                onChange(value.slice(0, i - 1));
            } else {
                onChange(value.slice(0, i));
            }
            return;
        }
        if (e.key === "ArrowLeft" && i > 0) { inputs.current[i - 1]?.focus(); return; }
        if (e.key === "ArrowRight" && i < 5) { inputs.current[i + 1]?.focus(); return; }
    };

    const handleChange = (e, i) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (!raw) { onChange(value.slice(0, i)); return; }
        const digit = raw[raw.length - 1];
        const newVal = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, 6);
        onChange(newVal);
        if (i < 5) inputs.current[i + 1]?.focus();
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
        e.preventDefault();
    };

    return (
        <div>
            <style>{`
        .otp-cell {
          width: 48px; height: 58px;
          border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: white; font-size: 24px; font-weight: 700;
          text-align: center; outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
          caret-color: transparent;
        }
        .otp-cell:focus {
          border-color: rgba(192,57,43,0.7);
          background: rgba(192,57,43,0.06);
          box-shadow: 0 0 0 3px rgba(192,57,43,0.15);
        }
        .otp-cell.filled {
          border-color: rgba(192,57,43,0.5);
          background: rgba(192,57,43,0.08);
        }
        .otp-cell.error {
          border-color: rgba(232,112,96,0.7);
          background: rgba(232,112,96,0.06);
          animation: shake .35s ease;
        }
        @media (max-width: 400px) {
          .otp-cell { width: 40px; height: 50px; font-size: 20px; border-radius: 11px; }
        }
      `}</style>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                        key={i}
                        ref={el => inputs.current[i] = el}
                        className={`otp-cell${value[i] ? " filled" : ""}${error ? " error" : ""}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value[i] || ""}
                        onChange={e => handleChange(e, i)}
                        onKeyDown={e => handleKey(e, i)}
                        onPaste={handlePaste}
                        onFocus={e => e.target.select()}
                    />
                ))}
            </div>
            {error && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#E87060", marginTop: 8 }}>⚠ {error}</div>
            )}
        </div>
    );
}

function OTPTimer({ expiresAt, onExpire }) {
    const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now()));

    useEffect(() => {
        const id = setInterval(() => {
            const remaining = Math.max(0, expiresAt - Date.now());
            setLeft(remaining);
            if (remaining === 0) { clearInterval(id); onExpire?.(); }
        }, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const mm = String(Math.floor(left / 60000)).padStart(2, "0");
    const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
    const pct = (left / (OTP_EXPIRES_MIN * 60 * 1000)) * 100;

    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, marginBottom: 6 }}>
                <svg width="60" height="60" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                    <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="30" cy="30" r="26" fill="none"
                        stroke={left < 30000 ? "#E87060" : "#C0392B"}
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 26}`}
                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: left < 30000 ? "#E87060" : "rgba(255,255,255,0.7)", fontVariantNumeric: "tabular-nums" }}>
                    {mm}:{ss}
                </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                Код действителен {mm}:{ss}
            </div>
        </div>
    );
}

function Field({ label, type = "text", value, onChange, placeholder, error, icon }) {
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
                        borderRadius: 14, padding: `14px ${isPassword ? "44px" : "16px"} 14px ${icon ? "42px" : "16px"}`,
                        color: "white", fontSize: 15, fontFamily: "'DM Sans',sans-serif",
                        outline: "none", transition: "all .2s", boxSizing: "border-box",
                    }}
                />
                {isPassword && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.35)", cursor: "pointer", fontSize: 17, padding: 0, lineHeight: 1 }}>
                        {show ? "🙈" : "👁️"}
                    </button>
                )}
            </div>
            {error && <div style={{ fontSize: 12, color: "#E87060", marginTop: 5, paddingLeft: 4 }}>⚠ {error}</div>}
        </div>
    );
}

function SocialBtn({ icon, label, onClick, disabled, badge }) {
    const [hov, setHov] = useState(false);
    return (
        <button type="button" onClick={onClick} disabled={disabled}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
                background: hov && !disabled ? "rgba(255,255,255,.07)" : C.dimmer,
                border: `1.5px solid ${hov && !disabled ? "rgba(255,255,255,.2)" : C.dim}`,
                borderRadius: 14, padding: "12px 8px",
                color: disabled ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.7)",
                fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
                cursor: disabled ? "default" : "pointer", transition: "all .2s",
                position: "relative",
            }}>
            <span style={{ fontSize: 22, filter: disabled ? "grayscale(1)" : "none" }}>{icon}</span>
            <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>{label}</span>
            {badge && (
                <span style={{ position: "absolute", top: 5, right: 5, fontSize: 8, padding: "1px 5px", borderRadius: 6, background: "rgba(212,160,23,0.2)", color: "#D4A017", fontWeight: 700, border: "1px solid rgba(212,160,23,0.3)" }}>
                    {badge}
                </span>
            )}
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
            <div style={{ fontSize: 11, color: colors[score] || "rgba(255,255,255,.3)" }}>{labels[score]}</div>
        </div>
    );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Noto+Serif+SC:wght@300;400;700&display=swap');
  .auth-root * { box-sizing: border-box; margin:0; padding:0; }
  .auth-root input::placeholder { color: rgba(255,255,255,.2); }
  .auth-root input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 100px #1E1E1E inset !important;
    -webkit-text-fill-color: white !important;
  }
  @keyframes floatUp {
    0%,100% { transform: translateY(0) rotate(var(--r)); opacity:.03; }
    50%  { transform: translateY(-30px) rotate(var(--r)); opacity:.06; }
  }
  @keyframes slideIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }
  @keyframes fadeIn  { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes shake   { 0%,100%{ transform:translateX(0) } 20%{ transform:translateX(-8px) } 40%{ transform:translateX(8px) } 60%{ transform:translateX(-5px) } 80%{ transform:translateX(5px) } }
  @keyframes pulse   { 0%,100%{ opacity:1 } 50%{ opacity:0.5 } }
  @keyframes bounceIn { 0%{ transform:scale(0.7); opacity:0 } 60%{ transform:scale(1.08) } 100%{ transform:scale(1); opacity:1 } }

  .anim-slide  { animation: slideIn  .38s cubic-bezier(.4,0,.2,1) both; }
  .anim-fade   { animation: fadeIn   .35s ease both; }
  .anim-shake  { animation: shake    .4s ease; }
  .anim-bounce { animation: bounceIn .45s cubic-bezier(.34,1.56,.64,1) both; }

  .submit-btn {
    width:100%; padding:16px; border-radius:16px;
    background:#C0392B; color:white; border:none;
    font-family:'Playfair Display',serif; font-size:17px; font-weight:700;
    cursor:pointer; letter-spacing:.3px; transition:all .22s;
    position:relative; overflow:hidden;
  }
  .submit-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.12),transparent); opacity:0; transition:opacity .2s; }
  .submit-btn:hover:not(:disabled)::after { opacity:1; }
  .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 36px rgba(192,57,43,.45); }
  .submit-btn:disabled { opacity:.6; cursor:default; }

  .tab-btn {
    flex:1; padding:10px; border:none; background:transparent;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; border-radius:12px; transition:all .2s; letter-spacing:.2px;
  }
  .tab-btn.active   { background:#C0392B; color:white; box-shadow:0 6px 20px rgba(192,57,43,.35); }
  .tab-btn.inactive { color:rgba(255,255,255,.4); }
  .tab-btn.inactive:hover { color:rgba(255,255,255,.7); }

  .lang-opt {
    display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:10px;
    cursor:pointer; font-size:13px; font-weight:500; color:rgba(255,255,255,.45);
    transition:all .15s; border:1.5px solid transparent;
  }
  .lang-opt:hover  { color:white; background:rgba(255,255,255,.05); }
  .lang-opt.active { color:white; border-color:rgba(192,57,43,.5); background:rgba(192,57,43,.12); }

  .float-char {
    position:absolute; font-family:'Noto Serif SC',serif;
    animation: floatUp var(--dur) ease-in-out infinite;
    animation-delay:var(--delay); user-select:none; pointer-events:none;
  }

  .resend-btn { background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
  .resend-btn:disabled { cursor:default; }

  @media (max-width: 768px) {
    .auth-left-panel { display:none !important; }
    .auth-grid { grid-template-columns:1fr !important; }
    .auth-right-panel { padding:28px 20px 40px !important; min-height:100vh; }
    .auth-back-btn  { top:16px !important; left:16px !important; }
    .auth-mobile-logo { display:flex !important; }
    .auth-lang-row  { flex-wrap:wrap !important; justify-content:center !important; gap:4px !important; margin-bottom:20px !important; }
    .lang-opt { padding:4px 8px !important; font-size:11px !important; }
    .auth-heading { font-size:22px !important; }
    .auth-sub     { font-size:13px !important; }
    .submit-btn   { font-size:15px !important; padding:14px !important; border-radius:14px !important; }
    .goal-btn     { padding:6px 10px !important; font-size:11px !important; }
    .social-row   { gap:6px !important; }
  }
  @media (max-width: 400px) {
    .auth-right-panel { padding:20px 14px 36px !important; }
    .auth-heading { font-size:19px !important; }
    .tab-btn { font-size:13px !important; padding:9px 6px !important; }
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
        goal: "Цель обучения",
        goals: ["Путешествие в Китай 🧳", "Учёба в университете 📚", "Бизнес 💼", "Интерес к культуре 🎋", "Другое"],
        verify: "Подтверди email",
        verifySub: "Мы отправили 6-значный код на",
        verifyEnter: "Введи код из письма",
        verifyBtn: "Подтвердить →",
        verifyResend: "Отправить снова",
        verifyResendIn: "Повтор через",
        verifyExpired: "Код истёк. Запроси новый.",
        verifyWrong: "Неверный код. Проверь письмо.",
        verifySending: "Отправляем код...",
        verifySpam: "Проверь папку Спам, если письмо не пришло",
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
        goal: "O'quv maqsadi",
        goals: ["Xitoyga sayohat 🧳", "Universitetda o'qish 📚", "Biznes 💼", "Madaniyatga qiziqish 🎋", "Boshqa"],
        verify: "Emailni tasdiqlang",
        verifySub: "6 xonali kodni shu manzilga yubordik",
        verifyEnter: "Xatdagi kodni kiriting",
        verifyBtn: "Tasdiqlash →",
        verifyResend: "Qayta yuborish",
        verifyResendIn: "Qayta yuborish",
        verifyExpired: "Kod muddati tugadi. Yangi so'rang.",
        verifyWrong: "Noto'g'ri kod. Xatni tekshiring.",
        verifySending: "Kod yuborilmoqda...",
        verifySpam: "Xat kelmasa, Spam papkasini tekshiring",
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
        goal: "Learning Goal",
        goals: ["Travel to China 🧳", "University Studies 📚", "Business 💼", "Cultural Interest 🎋", "Other"],
        verify: "Verify your email",
        verifySub: "We sent a 6-digit code to",
        verifyEnter: "Enter the code from your email",
        verifyBtn: "Verify →",
        verifyResend: "Resend code",
        verifyResendIn: "Resend in",
        verifyExpired: "Code expired. Request a new one.",
        verifyWrong: "Wrong code. Check your email.",
        verifySending: "Sending code...",
        verifySpam: "Check your Spam folder if the email didn't arrive",
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
        goal: "学习目标",
        goals: ["前往中国旅行 🧳", "大学学习 📚", "商务 💼", "文化兴趣 🎋", "其他"],
        verify: "验证邮箱",
        verifySub: "我们已将6位验证码发送至",
        verifyEnter: "请输入邮件中的验证码",
        verifyBtn: "验证 →",
        verifyResend: "重新发送",
        verifyResendIn: "秒后重发",
        verifyExpired: "验证码已过期，请重新获取",
        verifyWrong: "验证码错误，请检查邮件",
        verifySending: "正在发送验证码...",
        verifySpam: "如未收到，请检查垃圾邮件文件夹",
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

    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpExpiry, setOtpExpiry] = useState(null);
    const [otpExpired, setOtpExpired] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const pendingUserRef = useRef(null);

    const t = T[lang];

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    // ── ИСПРАВЛЕНО: валидация разделена по шагам ──────────────────────
    const validate = () => {
        const e = {};

        if (tab === "login") {
            // Логин: проверяем email + пароль
            if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = t.errEmail;
            if (!password || password.length < 8) e.password = t.errPass;
        }

        if (tab === "register") {
            if (step === 1) {
                // Шаг 1: только имя и email
                if (!name) e.name = t.errName;
                if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = t.errEmail;
            }
            if (step === 2) {
                // Шаг 2: только пароль и подтверждение
                if (!password || password.length < 8) e.password = t.errPass;
                if (password !== confirm) e.confirm = t.errConfirm;
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const initiateEmailVerification = async () => {
        setLoading(true);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            pendingUserRef.current = result.user;

            const expiry = Date.now() + OTP_EXPIRES_MIN * 60 * 1000;
            await sendOTP(email, name);
            setOtpExpiry(expiry);
            setOtpExpired(false);
            setOtpCode("");
            setOtpError("");
            setResendCooldown(60);
            setStep(3);
        } catch (err) {
            console.error("Auth / OTP error:", err);
            if (err.code === "auth/email-already-in-use") {
                setErrors({ email: "Email уже зарегистрирован" });
                setStep(1); // возвращаем на шаг с email
            } else {
                alert("Ошибка: " + (err.message || "Попробуй ещё раз"));
            }
            setShakeKey(k => k + 1);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            const expiry = Date.now() + OTP_EXPIRES_MIN * 60 * 1000;
            await sendOTP(email, name);
            setOtpExpiry(expiry);
            setOtpExpired(false);
            setOtpCode("");
            setOtpError("");
            setResendCooldown(60);
        } catch (err) {
            console.error("Resend OTP error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) { setOtpError("Введи все 6 цифр"); return; }
        if (otpExpired) { setOtpError(t.verifyExpired); return; }

        setOtpVerifying(true);
        setOtpError("");

        try {
            const { ok, reason } = await verifyOTP(email, otpCode);
            if (!ok) {
                setOtpError(reason === "expired" ? t.verifyExpired : t.verifyWrong);
                setShakeKey(k => k + 1);
                setOtpVerifying(false);
                return;
            }

            const user = pendingUserRef.current;
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid, name, email, goal: goal || "Учёба",
                xp: 0, streak: 0, hskLevel: 1,
                role: email === 'aslanjumaboev007@gmail.com' ? 'admin' : 'student',
                emailVerified: true,
                joinDate: new Date().toISOString()
            });

            setSuccess(true);
            setTimeout(() => router.push('/profile'), 2000);
        } catch (err) {
            console.error("Verify OTP error:", err);
            setOtpError("Ошибка проверки. Попробуй ещё раз.");
        } finally {
            setOtpVerifying(false);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) { setShakeKey(k => k + 1); return; }

        if (tab === "register") {
            if (step === 1) { setStep(2); return; }
            if (step === 2) { await initiateEmailVerification(); return; }
        }

        // Логин
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setSuccess(true);
            setTimeout(() => router.push('/profile'), 2000);
        } catch (err) {
            console.error("Login error:", err);
            setLoading(false);
            setShakeKey(k => k + 1);
            alert("Неверный email или пароль");
        }
    };

    const handleGoogleClick = async () => {
        try {
            await loginWithGoogle();
            setSuccess(true);
            setTimeout(() => router.push('/profile'), 2000);
        } catch (err) {
            console.error("Google Auth Error:", err);
        }
    };

    // Apple — отключён, статус "Скоро"
    const handleAppleClick = async () => {
        // Раскомментируй после настройки Apple Sign-In в Firebase:
        // https://firebase.google.com/docs/auth/web/apple
        //
        // try {
        //     const provider = new OAuthProvider('apple.com');
        //     provider.addScope('email');
        //     provider.addScope('name');
        //     const result = await signInWithPopup(auth, provider);
        //     const user = result.user;
        //     await setDoc(doc(db, 'users', user.uid), {
        //         uid: user.uid,
        //         name: user.displayName || user.email?.split('@')[0] || 'Apple User',
        //         email: user.email || '',
        //         xp: 0, streak: 0, hskLevel: 1,
        //         role: user.email === 'aslanjumaboev007@gmail.com' ? 'admin' : 'student',
        //         emailVerified: true,
        //         joinDate: new Date().toISOString()
        //     }, { merge: true });
        //     setSuccess(true);
        //     setTimeout(() => router.push('/profile'), 2000);
        // } catch (err) {
        //     console.error("Apple Auth Error:", err);
        //     if (err.code !== 'auth/popup-closed-by-user') {
        //         alert("Ошибка Apple Sign-In. Проверь настройки Firebase.");
        //     }
        // }
    };

    const switchTab = (t) => {
        setTab(t); setErrors({}); setStep(1); setSuccess(false);
        setEmail(""); setPassword(""); setConfirm(""); setName(""); setGoal("");
        setOtpCode(""); setOtpError("");
    };

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
                        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 48, color: C.crimson, margin: "16px 0" }}>欢迎</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginBottom: 28 }}>Перенаправляем в Профиль...</div>
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

                <Link href="/" className="auth-back-btn"
                    style={{ position: "absolute", top: 32, left: 32, color: "rgba(255,255,255,0.4)", textDecoration: "none", zIndex: 10, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "white"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
                    <span style={{ fontSize: 18 }}>←</span> На главную
                </Link>

                <div className="auth-mobile-logo" style={{ display: "none", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60, paddingBottom: 8 }}>
                    <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 28, color: C.crimson }}>桥</span>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "white" }}>ChineseBridge</span>
                </div>

                <div className="auth-grid" style={{ minHeight: "100vh", background: C.ink, display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", overflow: "hidden" }}>

                    <div className="auth-left-panel" style={{ position: "relative", background: C.ink2, borderRight: `1px solid ${C.dim}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, overflow: "hidden" }}>
                        {BG_CHARS.map((ch, i) => (
                            <div key={i} className="float-char" style={{
                                fontSize: 60 + (i % 4) * 30, color: "rgba(255,255,255,1)",
                                top: `${8 + (i * 7.5) % 85}%`, left: `${5 + (i * 11) % 80}%`,
                                "--r": `${(i % 3 - 1) * 12}deg`, "--dur": `${6 + (i % 4)}s`, "--delay": `${-(i * 1.1)}s`,
                            }}>{ch}</div>
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
                                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.05)", border: `1px solid ${C.dim}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "rgba(255,255,255,.6)", margin: 4 }}>{f}</div>
                            ))}
                        </div>
                    </div>

                    <div className="auth-right-panel" style={{ display: "flex", flexDirection: "column", padding: "40px 56px", overflowY: "auto" }}>

                        <div className="auth-lang-row" style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginBottom: 32 }}>
                            {LANGS.map(l => (
                                <div key={l.code} className={`lang-opt ${lang === l.code ? "active" : ""}`} onClick={() => setLang(l.code)}>
                                    {l.flag} {l.label}
                                </div>
                            ))}
                        </div>

                        {tab === "register" && step === 3 ? (
                            <div className="anim-fade">
                                <div style={{ textAlign: "center", marginBottom: 28 }}>
                                    <div className="anim-bounce" style={{
                                        width: 80, height: 80, borderRadius: 24,
                                        background: "linear-gradient(135deg, rgba(192,57,43,0.2), rgba(192,57,43,0.08))",
                                        border: "1.5px solid rgba(192,57,43,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 38, margin: "0 auto 16px",
                                        boxShadow: "0 0 30px rgba(192,57,43,0.2), inset 0 0 20px rgba(192,57,43,0.05)"
                                    }}>
                                        ✉️
                                    </div>
                                    <div className="auth-heading" style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 8 }}>
                                        {t.verify}
                                    </div>
                                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                                        {t.verifySub}<br />
                                        <span style={{ color: C.crimsonL, fontWeight: 600 }}>{email}</span>
                                    </div>
                                </div>

                                {otpExpiry && !otpExpired && (
                                    <div style={{ marginBottom: 24 }}>
                                        <OTPTimer expiresAt={otpExpiry} onExpire={() => setOtpExpired(true)} />
                                    </div>
                                )}

                                {otpExpired && (
                                    <div style={{ textAlign: "center", padding: "12px 16px", background: "rgba(232,112,96,0.1)", border: "1px solid rgba(232,112,96,0.25)", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#E87060" }}>
                                        ⏰ {t.verifyExpired}
                                    </div>
                                )}

                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
                                        {t.verifyEnter}
                                    </div>
                                    <OTPInput value={otpCode} onChange={setOtpCode} error={otpError} />
                                </div>

                                <button
                                    className="submit-btn"
                                    disabled={otpVerifying || otpCode.length < 6 || otpExpired}
                                    onClick={handleVerifyOTP}
                                    style={{ marginBottom: 14 }}
                                >
                                    {otpVerifying
                                        ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                            <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
                                            Проверяем...
                                        </span>
                                        : t.verifyBtn
                                    }
                                </button>

                                <div style={{ textAlign: "center", marginBottom: 16 }}>
                                    <button
                                        className="resend-btn"
                                        disabled={resendCooldown > 0 || loading}
                                        onClick={handleResendOTP}
                                        style={{ fontSize: 13, color: resendCooldown > 0 ? "rgba(255,255,255,0.25)" : C.crimsonL, fontWeight: 600 }}
                                    >
                                        {resendCooldown > 0
                                            ? `${t.verifyResendIn} ${resendCooldown}с`
                                            : loading ? t.verifySending : t.verifyResend
                                        }
                                    </button>
                                </div>

                                <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
                                    📬 {t.verifySpam}
                                </div>

                                <button
                                    onClick={() => { setStep(2); setOtpCode(""); setOtpError(""); }}
                                    style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                                >
                                    ← Изменить email
                                </button>
                            </div>

                        ) : (
                            <>
                                <div style={{ display: "flex", gap: 4, background: C.ink3, borderRadius: 16, padding: 5, marginBottom: 36, border: `1px solid ${C.dim}` }}>
                                    <button className={`tab-btn ${tab === "login" ? "active" : "inactive"}`} onClick={() => switchTab("login")}>{t.login}</button>
                                    <button className={`tab-btn ${tab === "register" ? "active" : "inactive"}`} onClick={() => switchTab("register")}>{t.register}</button>
                                </div>

                                <div className="anim-slide" key={tab} style={{ marginBottom: 32 }}>
                                    <div className="auth-heading" style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 900, letterSpacing: -.5, color: "white", marginBottom: 6 }}>
                                        {tab === "login" ? t.welcome : t.join}
                                    </div>
                                    <div className="auth-sub" style={{ fontSize: 15, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>
                                        {tab === "login" ? t.welcomeSub : t.joinSub}
                                    </div>
                                    {tab === "register" && (
                                        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                                            {[1, 2, 3].map(s => (
                                                <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <div style={{
                                                        width: 26, height: 26, borderRadius: "50%",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: 12, fontWeight: 700,
                                                        background: step >= s ? C.crimson : C.ink3,
                                                        border: `1.5px solid ${step >= s ? C.crimson : C.dim}`,
                                                        color: step >= s ? "white" : "rgba(255,255,255,.3)",
                                                        transition: "all .3s"
                                                    }}>
                                                        {step > s ? "✓" : s}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: step >= s ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.25)" }}>
                                                        {s === 1 ? "Профиль" : s === 2 ? "Пароль" : "Верификация"}
                                                    </div>
                                                    {s < 3 && <div style={{ width: 20, height: 1, background: step > s ? C.crimson : C.dim, transition: "background .3s" }} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

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
                                                        <button key={g} className="goal-btn"
                                                            onClick={() => setGoal(g)}
                                                            style={{ padding: "7px 13px", borderRadius: 20, border: `1.5px solid ${goal === g ? C.crimson : C.dim}`, background: goal === g ? "rgba(192,57,43,.15)" : "transparent", color: goal === g ? "white" : "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .18s" }}>
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

                                    <div className="social-row" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                                        {/* Google — работает */}
                                        <SocialBtn
                                            icon={
                                                <svg width="20" height="20" viewBox="0 0 48 48">
                                                    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
                                                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                                                    <path fill="#4CAF50" d="M24 44c5.2 0 9.8-1.9 13.4-5.1l-6.2-5.2C29.2 35.5 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" />
                                                    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C41.3 35.2 44 30 44 24c0-1.3-.1-2.7-.4-3.9z" />
                                                </svg>
                                            }
                                            label="Google"
                                            onClick={handleGoogleClick}
                                        />

                                        {/* Apple — СКОРО (disabled) */}
                                        <SocialBtn
                                            icon={
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                                </svg>
                                            }
                                            label="Apple"
                                            onClick={handleAppleClick}
                                            disabled={true}
                                            badge="Скоро"
                                        />

                                        {/* WeChat — СКОРО (disabled) */}
                                        <SocialBtn
                                            icon="💬"
                                            label="WeChat"
                                            disabled={true}
                                            badge="Скоро"
                                            onClick={() => { }}
                                        />
                                    </div>

                                    <div style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,.4)" }}>
                                        {tab === "login" ? t.noAcc : t.hasAcc}{" "}
                                        <button
                                            onClick={() => switchTab(tab === "login" ? "register" : "login")}
                                            style={{ background: "none", border: "none", color: C.crimson, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>
                                            {tab === "login" ? t.register : t.login}
                                        </button>
                                    </div>

                                    {tab === "register" && (
                                        <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 16, lineHeight: 1.5 }}>
                                            {t.terms}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}