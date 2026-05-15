'use client'
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { Target, Layers, MessageSquare, PenTool, Edit3, Loader2, Search, X } from 'lucide-react';
import HanziDraw from '@/components/Trainer/HanziDraw';
import TopNav from '@/components/UI/TopNav';
import styles from '@/styles/Trainer.module.css';

// ── ВСЕ ПОДКЛЮЧЕНИЯ ТВОИ — НЕ ТРОНУТЫ ──
import { useWords } from '@/lib/useWords';
import { useAuth } from '@/lib/AuthContext';
import LockOverlay from '@/components/UI/LockOverlay';

// ── Firebase — твоё подключение ──
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

// ══════════════════════════════════════════
// DATA FOR DIALOGUES — не тронуто
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
// HELPERS — не тронуто
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
// MODES — не тронуто, ни одна строка
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
  useEffect(() => { if (d) setOptions(shuffle([d.correct, ...d.wrong])); }, [d]);
  if (!d) return null;
  const check = (opt) => { if (answered) return; setAnswered(true); setChosen(opt); onScore(opt === d.correct); };
  const next = () => { if (dlIdx + 1 >= DIALOGUES.length) return onFinish(); setDlIdx(i => i + 1); setAnswered(false); setChosen(null); };
  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(dlIdx / DIALOGUES.length) * 100} />
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,.3)", textTransform: "uppercase", marginBottom: 18 }}>💬 {d.title}</div>
        {d.lines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{ padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2, ...(line.who === "A" ? { background: "rgba(192,57,43,.2)", color: "#E87060", border: "1px solid rgba(192,57,43,.3)" } : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.1)" }) }}>{line.who}</div>
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
          return <button key={opt} disabled={answered} onClick={() => check(opt)} className={`${styles.optBtn} ${anim}`} style={{ background: bg, border: `2px solid ${border}`, color, borderRadius: 14, padding: "14px 10px", fontSize: 14, fontWeight: 500, cursor: answered ? "default" : "pointer" }}>{opt}</button>;
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
          style={{ flex: 1, background: "rgba(255,255,255,.05)", border: `1.5px solid ${answered ? (ok ? '#7EC89A' : '#C0392B') : "rgba(255,255,255,.12)"}`, color: "white", borderRadius: 14, padding: "14px 18px", fontSize: 17, outline: "none", transition: "border-color .2s" }} />
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
  const handleComplete = (isCorrect) => { onScore(isCorrect); if (idx + 1 >= items.current.length) onFinish(); else setIdx(i => i + 1); };
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
// MODES CONFIG — не тронуто
// ══════════════════════════════════════════
const MODES = [
  { id: "quiz",      icon: <Target size={20} />,        name: "Тест",      desc: "4 варианта"  },
  { id: "flashcard", icon: <Layers size={20} />,        name: "Карточки",  desc: "Переворот"   },
  { id: "dialogue",  icon: <MessageSquare size={20} />, name: "Диалог",    desc: "Ситуации"    },
  { id: "type",      icon: <Edit3 size={20} />,         name: "Ввод",      desc: "Пиши сам"    },
  { id: "draw",      icon: <PenTool size={20} />,       name: "Рисование", desc: "HanziWriter" },
];

const HSK_COLORS = {
  1: "#7EC89A", 2: "#60B4D0", 3: "#D4A017",
  4: "#E8A060", 5: "#E74C3C", 6: "#C0392B"
};

// ══════════════════════════════════════════
// НОВЫЙ КОМПОНЕНТ: HSK + CATEGORY FILTER BAR
// ══════════════════════════════════════════
function FilterBar({ allWords, selectedHsk, setSelectedHsk, selectedCats, setSelectedCats, selectedWords, setSelectedWords }) {
  const [categories, setCategories] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Загружаем категории из Firebase — твоё подключение db
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Категории только выбранного HSK
  const hskCats = categories.filter(c => Number(c.hsk) === selectedHsk);

  // Поиск по пиньинь без тонов
  const pinyinBase = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const q = searchQ.trim().toLowerCase();
    const results = allWords.filter(w => pinyinBase(w.p).includes(q) || w.h.includes(q) || w.ru.toLowerCase().includes(q));
    setSearchResults(results.slice(0, 12));
  }, [searchQ, allWords]);

  const toggleCat = (cat) => {
    setSelectedCats(prev => {
      const exists = prev.find(c => c.id === cat.id);
      if (exists) return prev.filter(c => c.id !== cat.id);
      return [...prev, cat];
    });
  };

  const addWord = (word) => {
    if (!selectedWords.find(w => w.id === word.id)) {
      setSelectedWords(prev => [...prev, word]);
    }
    setSearchQ("");
    setSearchResults([]);
  };

  const removeWord = (id) => setSelectedWords(prev => prev.filter(w => w.id !== id));
  const removeCat  = (id) => setSelectedCats(prev => prev.filter(c => c.id !== id));

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.07)", background: "#111" }}>

      {/* ── HSK BAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: 4 }}>HSK</span>
        {[1,2,3,4,5,6].map(n => (
          <button key={n}
            onClick={() => { setSelectedHsk(n); setSelectedCats([]); setCatOpen(false); }}
            style={{
              padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selectedHsk === n ? HSK_COLORS[n] : "rgba(255,255,255,.1)"}`,
              background: selectedHsk === n ? `rgba(${n===1?'93,138,110':n===2?'96,180,208':n===3?'212,160,23':n===4?'232,160,96':n===5?'231,76,60':'192,57,43'},.15)` : "transparent",
              color: selectedHsk === n ? HSK_COLORS[n] : "rgba(255,255,255,.4)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "all .18s"
            }}>
            HSK {n}
          </button>
        ))}

        {/* Поиск */}
        <div style={{ marginLeft: "auto", position: "relative", flexShrink: 0 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Поиск по пиньинь..."
            style={{ background: "rgba(255,255,255,.05)", border: "1.5px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "7px 14px 7px 30px", color: "white", fontSize: 13, outline: "none", width: 180, fontFamily: "'DM Sans',sans-serif" }}
          />
          {/* Результаты поиска */}
          {searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#1C1C1C", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, minWidth: 220, zIndex: 100, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}>
              {searchResults.map(w => (
                <div key={w.id}
                  onClick={() => addWord(w)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 22, color: "white", minWidth: 32 }}>{w.h}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#E74C3C", fontWeight: 600 }}>{w.p}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{w.ru}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#7EC89A", fontWeight: 700 }}>+ Добавить</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── КАТЕГОРИИ выбранного HSK ── */}
      {hskCats.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px 10px", overflowX: "auto", scrollbarWidth: "none" }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.2)", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: 4 }}>Категории</span>
          {hskCats.map(cat => {
            const isOn = !!selectedCats.find(c => c.id === cat.id);
            return (
              <button key={cat.id}
                onClick={() => toggleCat(cat)}
                style={{
                  padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap",
                  border: `1.5px solid ${isOn ? HSK_COLORS[selectedHsk] : "rgba(255,255,255,.08)"}`,
                  background: isOn ? `rgba(${selectedHsk===1?'93,138,110':selectedHsk===2?'96,180,208':selectedHsk===3?'212,160,23':selectedHsk===4?'232,160,96':selectedHsk===5?'231,76,60':'192,57,43'},.12)` : "rgba(255,255,255,.03)",
                  color: isOn ? "white" : "rgba(255,255,255,.4)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s"
                }}>
                {cat.nameRu}
                {cat.nameZh && <span style={{ marginLeft: 5, fontFamily: "'Noto Serif SC',serif", opacity: .6 }}>{cat.nameZh}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── ВЫБРАННЫЕ ТЕГИ (категории + слова) ── */}
      {(selectedCats.length > 0 || selectedWords.length > 0) && (
        <div style={{ padding: "6px 16px 10px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.2)", textTransform: "uppercase", marginBottom: 6 }}>Активный набор</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedCats.map(cat => (
              <span key={cat.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(212,160,23,.12)", border: "1px solid rgba(212,160,23,.25)", color: "#D4A017", fontSize: 12, fontWeight: 600 }}>
                HSK{cat.hsk} / {cat.nameRu}
                <button onClick={() => removeCat(cat.id)} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", padding: 0, lineHeight: 1, opacity: .7 }}><X size={12} /></button>
              </span>
            ))}
            {selectedWords.map(w => (
              <span key={w.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(192,57,43,.1)", border: "1px solid rgba(192,57,43,.25)", color: "#E87060", fontSize: 12, fontWeight: 600 }}>
                <span style={{ fontFamily: "'Noto Serif SC',serif" }}>{w.h}</span> — {w.p}
                <button onClick={() => removeWord(w.id)} style={{ background: "none", border: "none", color: "#E87060", cursor: "pointer", padding: 0, lineHeight: 1, opacity: .7 }}><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════
export default function TrainerPage() {
  // ── Твои хуки — не тронуты ──
  const { words, loading } = useWords();
  const { user } = useAuth();

  const [mode, setMode] = useState("quiz");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── НОВЫЕ СТЕЙТЫ фильтрации ──
  const [selectedHsk, setSelectedHsk] = useState(1);
  const [selectedCats, setSelectedCats] = useState([]);   // выбранные категории
  const [selectedWords, setSelectedWords] = useState([]); // слова из поиска

  const isLocked = !user && mode !== 'quiz';

  // ── Вычисляем активную базу слов ──
  const activeVocab = (() => {
    // 1. Если есть выбранные слова через поиск — только они
    if (selectedWords.length > 0) return selectedWords;

    // 2. Если выбраны категории — слова этих категорий
    if (selectedCats.length > 0) {
      const catIds = selectedCats.map(c => c.id);
      return words.filter(w => catIds.includes(w.categoryId));
    }

    // 3. Иначе — все слова выбранного HSK уровня
    return words.filter(w => Number(w.hsk) === selectedHsk);
  })();

  // Если после фильтрации мало слов — берём весь HSK уровень как запасной
  const vocab = activeVocab.length >= 2 ? activeVocab : words.filter(w => Number(w.hsk) === selectedHsk);

  // ── Твоя логика — не тронута ──
  function handleScore(isCorrect) {
    if (isCorrect) { setCorrect(p => p + 1); setStreak(p => p + 1); }
    else           { setWrong(p => p + 1);   setStreak(0); }
  }

  function restart() {
    setCorrect(0); setWrong(0); setStreak(0);
    setFinished(false); setSessionKey(p => p + 1);
  }

  function finishSession() { setFinished(true); }

  // Сброс сессии при смене фильтра
  useEffect(() => { restart(); }, [selectedHsk, selectedCats, selectedWords]);

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

      {/* ── НОВЫЙ FILTER BAR (HSK + Категории + Поиск) ── */}
      <FilterBar
        allWords={words}
        selectedHsk={selectedHsk}
        setSelectedHsk={setSelectedHsk}
        selectedCats={selectedCats}
        setSelectedCats={setSelectedCats}
        selectedWords={selectedWords}
        setSelectedWords={setSelectedWords}
      />

      {/* ── МОБАЙЛ: нижняя панель режимов — не тронуто ── */}
      <div className={styles.mobileModebar}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); restart(); }} className={styles.mobileModeBtn}
            style={{ background: mode === m.id ? 'rgba(192,57,43,.15)' : 'transparent', borderTop: `2px solid ${mode === m.id ? '#C0392B' : 'transparent'}`, color: mode === m.id ? 'white' : 'rgba(255,255,255,.4)' }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{m.name}</span>
          </button>
        ))}
      </div>

      {/* ── МОБАЙЛ: мини score-бар — не тронуто ── */}
      <div className={styles.mobileScorebar}>
        <span style={{ color: '#7EC89A', fontWeight: 700 }}>✓ {correct}</span>
        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>|</span>
        <span style={{ color: '#E87060', fontWeight: 700 }}>✗ {wrong}</span>
        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>|</span>
        <span style={{ color: '#D4A017', fontWeight: 700 }}>🔥 {streak}</span>
        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, marginLeft: 4 }}>
          {MODES.find(m => m.id === mode)?.name}
        </span>
      </div>

      {/* ── ОСНОВНАЯ СЕТКА — не тронуто ── */}
      <div className={styles.trainerGrid}>

        {/* ЛЕВЫЙ САЙДБАР */}
        <aside className={styles.sidebar}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", padding: "0 16px", marginBottom: 8 }}>РЕЖИМ</div>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); restart(); }}
              className={`${styles.modeBtn} ${mode === m.id ? styles.active : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "transparent", color: "rgba(255,255,255,.45)", width: "100%", textAlign: "left", cursor: "pointer" }}>
              {m.icon}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{m.desc}</div>
              </div>
            </button>
          ))}

          {/* Показываем что в базе */}
          <div style={{ margin: "16px 16px 0", padding: "12px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,.25)", textTransform: "uppercase", marginBottom: 6 }}>База сейчас</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: HSK_COLORS[selectedHsk] }}>{vocab.length}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>
              {selectedWords.length > 0 ? "Выбранные слова" : selectedCats.length > 0 ? "По категориям" : `HSK ${selectedHsk} — все`}
            </div>
          </div>
        </aside>

        {/* ЦЕНТР */}
        <main className={styles.trainerMain}>
          {isLocked && <LockOverlay title="Режим недоступен" />}
          <div style={{ filter: isLocked ? 'blur(6px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', opacity: isLocked ? 0.4 : 1, transition: 'all 0.3s' }}>
            {finished && !isLocked ? (
              <div className={styles.animCardIn} style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 72, marginBottom: 12 }}>🏆</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: '#D4A017', marginBottom: 8 }}>Отлично!</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 30 }}>Верно: {correct}, Ошибок: {wrong}</p>
                <button onClick={restart} className={styles.nextBtn} style={{ background: '#C0392B', color: "white", border: "none", borderRadius: 20, padding: "15px 40px", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>Ещё раз →</button>
              </div>
            ) : (
              <div key={`${mode}-${sessionKey}`}>
                {mode === "quiz"      && <QuizMode      vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
                {mode === "flashcard" && <FlashcardMode vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
                {mode === "dialogue"  && <DialogueMode               onScore={handleScore} onFinish={finishSession} />}
                {mode === "type"      && <TypeMode      vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
                {mode === "draw"      && <DrawMode      vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
              </div>
            )}
          </div>
        </main>

        {/* ПРАВЫЙ САЙДБАР — не тронуто */}
        <aside className={styles.rightSidebar}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", marginBottom: 10 }}>СЧЁТ СЕССИИ</div>
          <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "10px 16px", display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#7EC89A', fontSize: 22, fontWeight: 900 }}>{correct}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>ВЕРНО</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#E87060', fontSize: 22, fontWeight: 900 }}>{wrong}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>ОШИБКИ</div>
            </div>
          </div>

          {/* Активный фильтр в правом сайдбаре */}
          <div style={{ marginTop: 16, padding: "12px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,.25)", textTransform: "uppercase", marginBottom: 8 }}>Фильтр</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              <span style={{ color: HSK_COLORS[selectedHsk], fontWeight: 700 }}>HSK {selectedHsk}</span>
              {selectedCats.length > 0 && <span style={{ color: "#D4A017" }}> · {selectedCats.length} кат.</span>}
              {selectedWords.length > 0 && <span style={{ color: "#E87060" }}> · {selectedWords.length} слов</span>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}