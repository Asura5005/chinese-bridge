'use client'
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { Target, Layers, MessageSquare, PenTool, Edit3, Loader2 } from 'lucide-react';
import HanziDraw from '@/components/Trainer/HanziDraw';
import TopNav from '@/components/UI/TopNav';
import styles from '@/styles/Trainer.module.css';

// Импорты авторизации, базы данных и замочка
import { useWords } from '@/lib/useWords';
import { useAuth } from '@/lib/AuthContext';
import LockOverlay from '@/components/UI/LockOverlay';

// ══════════════════════════════════════════
// DATA FOR DIALOGUES
// ══════════════════════════════════════════
const DIALOGUES = [
  {
    id: 1, title: "Учишь русский?",
    lines: [
      { who: "A", h: "你学俄语吗？", p: "Nǐ xué Éyǔ ma?", ru: "Ты учишь русский язык?" },
      { who: "B", h: "不，学汉语。", p: "Bù, xué Hànyǔ.", ru: "Нет, учу китайский." },
    ],
    q: "B учит какой язык?", correct: "Китайский (汉语)", wrong: ["Русский", "Английский", "Японский"],
  },
  {
    id: 2, title: "На почту?",
    lines: [
      { who: "A", h: "你去邮局寄信吗？", p: "Nǐ qù yóujú jì xìn ma?", ru: "Идёшь на почту отправить письмо?" },
      { who: "B", h: "不去。去银行取钱。", p: "Bú qù. Qù yínháng qǔ qián.", ru: "Нет. Иду в банк снять деньги." },
    ],
    q: "Куда идёт B?", correct: "В банк (银行)", wrong: ["На почту", "Домой", "В школу"],
  }
];

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const speak = (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN"; u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

const AudioBtn = ({ text }) => {
  const [playing, setPlaying] = useState(false);
  return (
    <button onClick={(e) => { e.stopPropagation(); setPlaying(true); speak(text); setTimeout(() => setPlaying(false), 1200); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${playing ? '#C0392B' : "rgba(0,0,0,.15)"}`, background: playing ? "rgba(192,57,43,.07)" : "transparent", color: playing ? '#C0392B' : "rgba(0,0,0,.45)", fontSize: 13, cursor: "pointer", transition: "all .2s" }}>
      🔊 {playing ? "Играет..." : "Прослушать"}
    </button>
  );
};

const ProgressBar = ({ value }) => (
  <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg,#C0392B,#D4A017)`, transition: "width .4s ease" }} />
  </div>
);

// ══════════════════════════════════════════
// MODES COMPONENTS
// ══════════════════════════════════════════

function QuizMode({ vocab, onScore, onFinish }) {
  const items = useRef(shuffle(vocab).slice(0, 10));
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [dir, setDir] = useState("p2r");
  const [options, setOptions] = useState([]);

  const item = items.current[idx];
  const correctAns = dir === "p2r" ? item?.ru : item?.p;

  useEffect(() => {
    if (!item) return;
    const newDir = Math.random() > 0.5 ? "p2r" : "r2p";
    setDir(newDir);
    const currentCorrect = newDir === "p2r" ? item.ru : item.p;
    const pool = vocab.filter(v => v.id !== item.id);
    const wrongs = shuffle(pool).slice(0, 3).map(v => newDir === "p2r" ? v.ru : v.p);
    setOptions(shuffle([currentCorrect, ...wrongs]));
  }, [idx, item, vocab]);

  if (!item) return null;

  const check = (opt) => {
    if (answered) return;
    setAnswered(true); setChosen(opt);
    onScore(opt === correctAns);
  };

  const next = () => {
    if (idx + 1 >= items.current.length) return onFinish();
    setIdx(i => i + 1); setAnswered(false); setChosen(null);
  };

  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(idx / items.current.length) * 100} />
      <div className={styles.animCardIn} style={{ background: '#FAF7F2', color: '#0D0D0D', borderRadius: 28, padding: "36px 32px", textAlign: "center", marginBottom: 20, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
        {dir === "p2r" ? (
          <>
            <div className={styles.hanzi} style={{ fontSize: "80px", lineHeight: 1, margin: "12px 0 6px" }}>{item.h}</div>
            <div style={{ fontSize: 20, color: '#C0392B', fontWeight: 600, letterSpacing: 2, marginBottom: 10 }}>{item.p}</div>
            <AudioBtn text={item.p} />
          </>
        ) : (
          <div style={{ fontSize: 28, fontWeight: 600, padding: "20px 16px" }}>{item.ru}</div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {options.map(opt => {
          let bg = "rgba(255,255,255,.05)", border = "rgba(255,255,255,.1)", color = "white", anim = "";
          if (answered) {
            if (opt === correctAns) { bg = "rgba(93,138,110,.2)"; border = "#5D8A6E"; color = "#b7e4c7"; anim = styles.animCorrect; }
            else if (opt === chosen) { bg = "rgba(192,57,43,.2)"; border = "#C0392B"; color = "#ffb3b3"; anim = styles.animWrong; }
          }
          return (
            <button key={opt} disabled={answered} onClick={() => check(opt)} className={`${styles.optBtn} ${anim}`} style={{ background: bg, border: `2px solid ${border}`, color, borderRadius: 16, padding: "15px 12px", fontSize: 14, fontWeight: 500, cursor: answered ? "default" : "pointer" }}>{opt}</button>
          );
        })}
      </div>
      {answered && <button className={styles.nextBtn} onClick={next} style={{ width: "100%", padding: 15, borderRadius: 14, background: '#C0392B', color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Следующее →</button>}
    </div>
  );
}

function FlashcardMode({ vocab, onScore, onFinish }) {
  const items = useRef(shuffle(vocab).slice(0, 10));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const item = items.current[idx];

  const answer = (knew) => {
    onScore(knew);
    if (idx + 1 >= items.current.length) return onFinish();
    setFlipped(false);
    setTimeout(() => setIdx(i => i + 1), 150);
  };
  if (!item) return null;
  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(idx / items.current.length) * 100} />
      <div className={styles.fcWrap} style={{ marginBottom: 20 }}>
        <div className={`${styles.fcInner} ${flipped ? styles.flipped : ""}`} onClick={() => setFlipped(true)}>
          <div className={styles.fcFace} style={{ background: '#FAF7F2', color: '#0D0D0D' }}>
            <div style={{ position: "absolute", top: 14, fontSize: 10, letterSpacing: 2, color: "rgba(0,0,0,.25)", textTransform: "uppercase" }}>НАЖМИ — ОТКРОЙ</div>
            <div className={styles.hanzi} style={{ fontSize: 80, lineHeight: 1 }}>{item.h}</div>
            <div style={{ fontSize: 20, color: '#C0392B', fontWeight: 600, letterSpacing: 2, marginTop: 8 }}>{item.p}</div>
            <div style={{ position: "absolute", bottom: 14 }}><AudioBtn text={item.p} /></div>
          </div>
          <div className={`${styles.fcFace} ${styles.fcBack}`}>
            <div style={{ position: "absolute", top: 14, fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", textTransform: "uppercase" }}>ЗНАЧЕНИЕ</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 900, color: "white", marginBottom: 8 }}>{item.ru}</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>🇺🇿 {item.uz || "—"}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>🇬🇧 {item.en || "—"}</div>
          </div>
        </div>
      </div>
      {flipped && (
        <div className={styles.animFadeUp} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <button onClick={() => answer(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: `1.5px solid rgba(192,57,43,.3)`, background: "rgba(192,57,43,.12)", color: "#E87060", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>❌ Не знал</button>
          <button onClick={() => answer(true)} style={{ flex: 1, padding: 14, borderRadius: 14, border: `1.5px solid rgba(93,138,110,.3)`, background: "rgba(93,138,110,.15)", color: "#7EC89A", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✅ Знал!</button>
        </div>
      )}
    </div>
  );
}

function DialogueMode({ onScore, onFinish }) {
  const [dlIdx, setDlIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [options, setOptions] = useState([]);

  const d = DIALOGUES[dlIdx];

  useEffect(() => {
    if (d) setOptions(shuffle([d.correct, ...d.wrong]));
  }, [d]);

  if (!d) return null;

  const check = (opt) => {
    if (answered) return;
    setAnswered(true); setChosen(opt);
    onScore(opt === d.correct);
  };

  const next = () => {
    if (dlIdx + 1 >= DIALOGUES.length) return onFinish();
    setDlIdx(i => i + 1); setAnswered(false); setChosen(null);
  };

  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(dlIdx / DIALOGUES.length) * 100} />
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,.3)", textTransform: "uppercase", marginBottom: 18 }}>💬 {d.title}</div>
        {d.lines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{ padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2, ...(line.who === "A" ? { background: "rgba(192,57,43,.2)", color: "#E87060", border: "1px solid rgba(192,57,43,.3)" } : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.1)" }) }}>
              {line.who}
            </div>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "12px 16px", cursor: 'pointer' }} onClick={() => speak(line.h)}>
              <div className={styles.hanzi} style={{ fontSize: 19, color: "white" }}>{line.h}</div>
              <div style={{ fontSize: 12, color: '#C0392B', letterSpacing: 1, marginTop: 4 }}>{line.p}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 4, fontStyle: "italic" }}>{line.ru}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.2)", borderRadius: 14, padding: "13px 18px", fontSize: 14, fontWeight: 600, color: "white", marginBottom: 14 }}>❓ {d.q}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {options.map(opt => {
          let bg = "rgba(255,255,255,.05)", border = "rgba(255,255,255,.1)", color = "white", anim = "";
          if (answered) {
            if (opt === d.correct) { bg = "rgba(93,138,110,.2)"; border = "#5D8A6E"; color = "#b7e4c7"; anim = styles.animCorrect; }
            else if (opt === chosen) { bg = "rgba(192,57,43,.2)"; border = "#C0392B"; color = "#ffb3b3"; anim = styles.animWrong; }
          }
          return (
            <button key={opt} disabled={answered} onClick={() => check(opt)} className={`${styles.optBtn} ${anim}`} style={{ background: bg, border: `2px solid ${border}`, color, borderRadius: 14, padding: "14px 10px", fontSize: 14, fontWeight: 500, cursor: answered ? "default" : "pointer" }}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && <button className={styles.nextBtn} onClick={next} style={{ width: "100%", padding: 15, borderRadius: 14, background: '#C0392B', color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Следующий →</button>}
    </div>
  );
}

function TypeMode({ vocab, onScore, onFinish }) {
  const items = useRef(shuffle(vocab).slice(0, 10));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [ok, setOk] = useState(false);
  const inputRef = useRef(null);
  const item = items.current[idx];

  useEffect(() => { if (inputRef.current && !answered) inputRef.current.focus(); }, [idx, answered]);
  if (!item) return null;

  const check = () => {
    if (answered || !input.trim()) return;
    const val = input.trim().toLowerCase();
    const ans = item.ru.toLowerCase();
    const isCorrect = ans.includes(val) || val.includes(ans.slice(0, 4));
    setAnswered(true); setOk(isCorrect); onScore(isCorrect);
  };

  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(idx / items.current.length) * 100} />
      <div className={styles.animCardIn} style={{ background: '#FAF7F2', color: '#0D0D0D', borderRadius: 24, padding: "32px 28px", textAlign: "center", marginBottom: 18, boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
        <div className={styles.hanzi} style={{ fontSize: 80, lineHeight: 1, margin: "10px 0 6px" }}>{item.h}</div>
        <div style={{ fontSize: 20, color: '#C0392B', fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>{item.p}</div>
        <div style={{ fontSize: 13, color: "rgba(0,0,0,.35)" }}>→ Введи перевод на русский</div>
        <AudioBtn text={item.p} />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && check()} disabled={answered} placeholder="Введи перевод..."
          style={{ flex: 1, background: "rgba(255,255,255,.05)", border: `1.5px solid ${answered ? (ok ? '#7EC89A' : '#C0392B') : "rgba(255,255,255,.12)"}`, color: "white", borderRadius: 14, padding: "14px 18px", fontSize: 17, outline: "none", transition: "border-color .2s" }}
        />
        <button onClick={check} style={{ background: '#C0392B', border: "none", color: "white", borderRadius: 14, padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>OK</button>
      </div>
      {answered && (
        <div className={styles.animFadeUp} style={{ borderRadius: 14, padding: "13px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, ...(ok ? { background: "rgba(93,138,110,.15)", border: `1px solid rgba(126,200,154,.3)`, color: "#b7e4c7" } : { background: "rgba(192,57,43,.15)", border: `1px solid rgba(192,57,43,.35)`, color: "#ffb3b3" }) }}>
          <span style={{ fontSize: 22 }}>{ok ? "✅" : "❌"}</span>
          <span>{ok ? "Верно!" : <span>Правильно: <b style={{ color: "white" }}>{item.ru}</b></span>}</span>
        </div>
      )}
      {answered && <button className={styles.nextBtn} onClick={() => { setIdx(i => i + 1); setInput(""); setAnswered(false); if (idx + 1 >= items.current.length) onFinish(); }} style={{ width: "100%", padding: 15, borderRadius: 14, background: '#C0392B', color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Следующее →</button>}
    </div>
  );
}

function DrawMode({ vocab, onScore, onFinish }) {
  const singleCharWords = vocab.filter(v => v.h.length === 1);
  const items = useRef(shuffle(singleCharWords).slice(0, 5));
  const [idx, setIdx] = useState(0);
  const item = items.current[idx];

  if (!item) return <div style={{ textAlign: 'center' }}>Мало одиночных иероглифов в базе.</div>;

  const handleComplete = (isCorrect) => {
    onScore(isCorrect);
    if (idx + 1 >= items.current.length) onFinish();
    else setIdx(i => i + 1);
  };

  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(idx / items.current.length) * 100} />
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 24, color: '#D4A017', marginBottom: 5 }}>{item.ru} / {item.p}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Нарисуй иероглиф по правильному порядку черт</p>
      </div>
      <HanziDraw key={item.h} character={item.h} onComplete={handleComplete} />
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════
const MODES = [
  { id: "quiz", icon: <Target size={20} />, name: "Тест", desc: "4 варианта" },
  { id: "flashcard", icon: <Layers size={20} />, name: "Карточки", desc: "Переворот" },
  { id: "dialogue", icon: <MessageSquare size={20} />, name: "Диалог", desc: "Ситуации" },
  { id: "type", icon: <Edit3 size={20} />, name: "Ввод", desc: "Пиши сам" },
  { id: "draw", icon: <PenTool size={20} />, name: "Рисование", desc: "HanziWriter" },
];

export default function TrainerPage() {
  const { words, loading } = useWords();
  const { user } = useAuth();

  const [mode, setMode] = useState("quiz");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Замочек: если юзер не залогинен, то разрешаем играть только в первый режим (Тест)
  const isLocked = !user && mode !== 'quiz';

  function handleScore(isCorrect) {
    if (isCorrect) {
      setCorrect(p => p + 1);
      setStreak(p => p + 1);
    } else {
      setWrong(p => p + 1);
      setStreak(0);
    }
  }

  function restart() {
    setCorrect(0);
    setWrong(0);
    setStreak(0);
    setFinished(false);
    setSessionKey(p => p + 1);
  }

  function finishSession() {
    setFinished(true);
  }

  // Пока данные загружаются из Firebase
  if (loading) {
    return (
      <div className={styles.root} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: '#C0392B', marginBottom: 16, margin: '0 auto' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка слов из облака...</p>
        </div>
      </div>
    );
  }

  // Если база пуста
  if (words.length === 0) {
    return (
      <div className={styles.root}>
        <TopNav />
        <div style={{ textAlign: 'center', padding: 100 }}>
          <p style={{ fontSize: 20, marginBottom: 20 }}>В твоей базе данных пока нет слов.</p>
          <Link href="/admin-panel" style={{ background: '#C0392B', color: "white", border: "none", borderRadius: 20, padding: "15px 40px", fontSize: 18, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            Добавить слова в Админке
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <TopNav streak={streak} />
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 240px", minHeight: "calc(100vh - 52px)" }}>

        {/* ЛЕВЫЙ САЙДБАР - РЕЖИМЫ */}
        <aside style={{ background: "#141414", borderRight: "1px solid rgba(255,255,255,.07)", padding: "20px 0" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", padding: "0 16px", marginBottom: 8 }}>РЕЖИМ</div>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); restart(); }} className={`${styles.modeBtn} ${mode === m.id ? styles.active : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "transparent", color: "rgba(255,255,255,.45)", width: "100%", textAlign: "left", cursor: "pointer" }}>
              {m.icon}
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{m.desc}</div></div>
            </button>
          ))}
        </aside>

        {/* ЦЕНТР - САМ ТРЕНАЖЕР */}
        <main style={{ padding: "28px 32px", maxWidth: 600, margin: '0 auto', width: '100%', position: 'relative' }}>

          {/* Показываем замочек, если режим платный и юзер не залогинен */}
          {isLocked && <LockOverlay title="Режим недоступен" />}

          {/* Блюрим контент под замочком */}
          <div style={{
            filter: isLocked ? 'blur(6px)' : 'none',
            pointerEvents: isLocked ? 'none' : 'auto',
            opacity: isLocked ? 0.4 : 1,
            transition: 'all 0.3s'
          }}>
            {finished && !isLocked ? (
              <div className={styles.animCardIn} style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 72, marginBottom: 12 }}>🏆</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: '#D4A017', marginBottom: 8 }}>Отлично!</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 30 }}>Верно: {correct}, Ошибок: {wrong}</p>
                <button onClick={restart} className={styles.nextBtn} style={{ background: '#C0392B', color: "white", border: "none", borderRadius: 20, padding: "15px 40px", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>Ещё раз →</button>
              </div>
            ) : (
              <div key={`${mode}-${sessionKey}`}>
                {mode === "quiz" && <QuizMode vocab={words} onScore={handleScore} onFinish={finishSession} />}
                {mode === "flashcard" && <FlashcardMode vocab={words} onScore={handleScore} onFinish={finishSession} />}
                {mode === "dialogue" && <DialogueMode onScore={handleScore} onFinish={finishSession} />}
                {mode === "type" && <TypeMode vocab={words} onScore={handleScore} onFinish={finishSession} />}
                {mode === "draw" && <DrawMode vocab={words} onScore={handleScore} onFinish={finishSession} />}
              </div>
            )}
          </div>
        </main>

        {/* ПРАВЫЙ САЙДБАР - СЧЕТ */}
        <aside style={{ background: "#141414", borderLeft: "1px solid rgba(255,255,255,.07)", padding: "20px 16px" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", marginBottom: 10 }}>СЧЁТ СЕССИИ</div>
          <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "10px 16px", display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, textAlign: 'center' }}><div style={{ color: '#7EC89A', fontSize: 22, fontWeight: 900 }}>{correct}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>ВЕРНО</div></div>
            <div style={{ flex: 1, textAlign: 'center' }}><div style={{ color: '#E87060', fontSize: 22, fontWeight: 900 }}>{wrong}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>ОШИБКИ</div></div>
          </div>
        </aside>
      </div>
    </div>
  );
}