'use client'
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { Target, Layers, MessageSquare, PenTool, Edit3, Loader2, Search, X, List, Volume2, ChevronRight, BookOpen } from 'lucide-react';
import HanziDraw from '@/components/Trainer/HanziDraw';
import TopNav from '@/components/UI/TopNav';
import styles from '@/styles/Trainer.module.css';

import { useWords } from '@/lib/useWords';
import { useAuth } from '@/lib/AuthContext';
import LockOverlay from '@/components/UI/LockOverlay';

import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

// ══════════════════════════════════════════
// DIALOGUES
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
// РЕЖИМ: СПИСОК СЛОВ
// ══════════════════════════════════════════
function WordListMode({ vocab, onGoToDraw }) {
  const [search, setSearch] = useState("");
  const [flipped, setFlipped] = useState({});
  const [playing, setPlaying] = useState(null);

  const filtered = vocab.filter(w => {
    const q = search.toLowerCase();
    return !q || w.h.includes(q) || w.p.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q);
  });

  const playAudio = (w) => {
    setPlaying(w.id);
    speak(w.h);
    setTimeout(() => setPlaying(null), 1200);
  };

  const toggleFlip = (id) => setFlipped(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={styles.animFadeUp}>
      <style>{`
        .wl-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 64px 1fr auto;
          align-items: center;
          gap: 16px;
          transition: all 0.18s;
          cursor: default;
        }
        .wl-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .wl-hz {
          font-family: 'Noto Serif SC', serif;
          font-size: 40px;
          line-height: 1;
          color: white;
          text-align: center;
          text-shadow: 0 0 20px rgba(192,57,43,0.3);
        }
        .wl-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .wl-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .wl-draw-btn {
          background: rgba(192,57,43,0.1);
          border: 1px solid rgba(192,57,43,0.25);
          border-radius: 10px;
          color: #E87060;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .wl-draw-btn:hover {
          background: rgba(192,57,43,0.2);
          border-color: rgba(192,57,43,0.5);
          color: #FF8070;
          box-shadow: 0 0 12px rgba(192,57,43,0.3);
        }
        .wl-meaning {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.25s ease, opacity 0.2s;
        }
        .wl-meaning.open {
          max-height: 80px;
          opacity: 1;
        }
        @media (max-width: 600px) {
          .wl-card { grid-template-columns: 52px 1fr auto; gap: 12px; padding: 14px 16px; }
          .wl-hz { font-size: 32px; }
        }
      `}</style>

      {/* Шапка */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Список слов</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
            {vocab.length} слов · нажми на слово чтобы открыть перевод · ✏️ для рисования
          </div>
        </div>
        {/* Поиск внутри списка */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Фильтр..."
            style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "8px 14px 8px 30px", color: "white", fontSize: 13, outline: "none", width: 140, fontFamily: "'DM Sans',sans-serif" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Список */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((w, i) => {
          const isOpen = !!flipped[w.id];
          const canDraw = w.h.length === 1;
          return (
            <div key={w.id} style={{ animationDelay: `${i * 0.02}s` }}>
              <div className="wl-card" onClick={() => toggleFlip(w.id)}>

                {/* Иероглиф */}
                <div className="wl-hz">{w.h}</div>

                {/* Инфо */}
                <div>
                  <div style={{ fontSize: 15, color: "#E74C3C", fontWeight: 600, letterSpacing: "0.5px" }}>{w.p}</div>
                  <div style={{ fontSize: 14, color: "white", marginTop: 2 }}>{w.ru}</div>
                  {/* Скрытый блок UZ/EN */}
                  <div className={`wl-meaning${isOpen ? ' open' : ''}`}>
                    <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                      {w.uz && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>🇺🇿 {w.uz}</span>}
                      {w.en && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>🇬🇧 {w.en}</span>}
                    </div>
                  </div>
                </div>

                {/* Кнопки */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }} onClick={e => e.stopPropagation()}>
                  {/* Аудио */}
                  <button
                    className="wl-btn"
                    onClick={() => playAudio(w)}
                    title="Прослушать"
                    style={playing === w.id ? { background: "rgba(231,76,60,0.15)", borderColor: "rgba(231,76,60,0.4)", color: "#E74C3C" } : {}}
                  >
                    <Volume2 size={15} />
                  </button>

                  {/* Рисование — только для одиночных иероглифов */}
                  <button
                    className="wl-draw-btn"
                    onClick={() => onGoToDraw(w)}
                    title={canDraw ? "Практиковать написание" : "Только для одиночных иероглифов"}
                    style={!canDraw ? { opacity: 0.25, cursor: "not-allowed" } : {}}
                    disabled={!canDraw}
                  >
                    <PenTool size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 0", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div>Ничего не найдено</div>
          </div>
        )}
      </div>

      {/* Подсказка снизу */}
      {vocab.length > 0 && (
        <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.15)", borderRadius: 14, fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
          <PenTool size={13} style={{ color: "#E87060", flexShrink: 0 }} />
          Кнопка <span style={{ color: "#E87060" }}>✏️</span> доступна только для одиночных иероглифов. Многосложные слова можно учить через Тест или Карточки.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ОСТАЛЬНЫЕ РЕЖИМЫ — не тронуты
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

function DrawMode({ vocab, onScore, onFinish, focusWord }) {
  const singleCharWords = vocab.filter(v => v.h.length === 1);
  // Если пришли с конкретного слова из WordList — ставим его первым
  const ordered = focusWord
    ? [focusWord, ...singleCharWords.filter(v => v.id !== focusWord.id)]
    : singleCharWords;
  const items = useRef(shuffle(ordered).slice(0, 5));

  // Если пришли с focusWord — начинаем с него
  const [idx, setIdx] = useState(0);
  const item = items.current[idx];

  if (!item) return <div style={{ textAlign: 'center', padding: 40, color: "rgba(255,255,255,0.4)" }}>Мало одиночных иероглифов в базе.</div>;

  const handleComplete = (isCorrect) => {
    onScore(isCorrect);
    if (idx + 1 >= items.current.length) onFinish();
    else setIdx(i => i + 1);
  };

  return (
    <div className={styles.animFadeUp}>
      <ProgressBar value={(idx / items.current.length) * 100} />
      {focusWord && idx === 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={13} style={{ color: "#E87060" }} />
          Перешёл из Списка слов · практикуешь <span style={{ color: "#E87060", fontFamily: "'Noto Serif SC',serif", fontSize: 16 }}>{focusWord.h}</span>
        </div>
      )}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 24, color: '#D4A017', marginBottom: 5 }}>{item.ru} / {item.p}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Нарисуй иероглиф по правильному порядку черт</p>
      </div>
      <HanziDraw key={item.h} character={item.h} onComplete={handleComplete} />
    </div>
  );
}

// ══════════════════════════════════════════
// MODES CONFIG
// ══════════════════════════════════════════
const MODES = [
  { id: "wordlist", icon: <List size={20} />, name: "Список", desc: "Все слова" },
  { id: "quiz", icon: <Target size={20} />, name: "Тест", desc: "4 варианта" },
  { id: "flashcard", icon: <Layers size={20} />, name: "Карточки", desc: "Переворот" },
  { id: "dialogue", icon: <MessageSquare size={20} />, name: "Диалог", desc: "Ситуации" },
  { id: "type", icon: <Edit3 size={20} />, name: "Ввод", desc: "Пиши сам" },
  { id: "draw", icon: <PenTool size={20} />, name: "Рисование", desc: "HanziWriter" },
];

const HSK_COLORS = {
  1: "#7EC89A", 2: "#60B4D0", 3: "#D4A017",
  4: "#E8A060", 5: "#E74C3C", 6: "#C0392B"
};

// ══════════════════════════════════════════
// FILTER BAR — исправлен z-index поиска
// ══════════════════════════════════════════
function FilterBar({ allWords, selectedHsk, setSelectedHsk, selectedCats, setSelectedCats, selectedWords, setSelectedWords }) {
  const [categories, setCategories] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [dropOpen, setDropOpen] = useState(false);
  const searchRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Закрывать дропдаун при клике вне
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hskCats = categories.filter(c => Number(c.hsk) === selectedHsk);
  const pinyinBase = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); setDropOpen(false); return; }
    const q = searchQ.trim().toLowerCase();
    const results = allWords.filter(w =>
      pinyinBase(w.p).includes(q) || w.h.includes(q) || w.ru.toLowerCase().includes(q)
    );
    setSearchResults(results.slice(0, 12));
    setDropOpen(results.length > 0);
  }, [searchQ, allWords]);

  const toggleCat = (cat) => {
    setSelectedCats(prev => prev.find(c => c.id === cat.id) ? prev.filter(c => c.id !== cat.id) : [...prev, cat]);
  };

  const addWord = (word) => {
    if (!selectedWords.find(w => w.id === word.id)) setSelectedWords(prev => [...prev, word]);
    setSearchQ(""); setSearchResults([]); setDropOpen(false);
  };

  const removeWord = (id) => setSelectedWords(prev => prev.filter(w => w.id !== id));
  const removeCat = (id) => setSelectedCats(prev => prev.filter(c => c.id !== id));

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.07)", background: "#111" }}>

      {/* ── HSK BAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: 4 }}>HSK</span>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button key={n}
            onClick={() => { setSelectedHsk(n); setSelectedCats([]); }}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: `1.5px solid ${selectedHsk === n ? HSK_COLORS[n] : "rgba(255,255,255,.1)"}`,
              background: selectedHsk === n
                ? `rgba(${n === 1 ? '93,138,110' : n === 2 ? '96,180,208' : n === 3 ? '212,160,23' : n === 4 ? '232,160,96' : n === 5 ? '231,76,60' : '192,57,43'},.15)`
                : "transparent",
              color: selectedHsk === n ? HSK_COLORS[n] : "rgba(255,255,255,.4)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "all .18s"
            }}>
            HSK {n}
          </button>
        ))}

        {/* ── Поиск — FIX: portaled dropdown через position:fixed ── */}
        <div ref={dropRef} style={{ marginLeft: "auto", position: "relative", flexShrink: 0 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", pointerEvents: "none", zIndex: 1 }} />
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onFocus={() => searchResults.length > 0 && setDropOpen(true)}
            placeholder="Поиск по пиньинь..."
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1.5px solid ${dropOpen ? "rgba(192,57,43,.5)" : "rgba(255,255,255,.1)"}`,
              borderRadius: 20, padding: "7px 14px 7px 30px",
              color: "white", fontSize: 13, outline: "none", width: 180,
              fontFamily: "'DM Sans',sans-serif", transition: "border-color .2s"
            }}
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(""); setSearchResults([]); setDropOpen(false); }}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", padding: 0, display: "flex" }}>
              <X size={13} />
            </button>
          )}

          {/* ── DROPDOWN — z-index 9999 чтобы быть поверх всего ── */}
          {dropOpen && searchResults.length > 0 && (
            <div style={{
              position: "fixed",
              top: (() => {
                if (searchRef.current) {
                  const rect = searchRef.current.getBoundingClientRect();
                  return rect.bottom + 6;
                }
                return 100;
              })(),
              right: 16,
              width: 260,
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 16,
              zIndex: 9999,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)",
            }}>
              <div style={{ padding: "8px 12px 6px", fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,.25)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                Найдено {searchResults.length} слов
              </div>
              {searchResults.map(w => (
                <div key={w.id}
                  onClick={() => addWord(w)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 24, color: "white", minWidth: 34, textAlign: "center", textShadow: "0 0 12px rgba(192,57,43,.4)" }}>{w.h}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#E74C3C", fontWeight: 600, letterSpacing: "0.3px" }}>{w.p}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.ru}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#7EC89A", fontWeight: 700, background: "rgba(93,138,110,.12)", padding: "2px 7px", borderRadius: 8, flexShrink: 0 }}>+ добавить</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── КАТЕГОРИИ ── */}
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
                  background: isOn
                    ? `rgba(${selectedHsk === 1 ? '93,138,110' : selectedHsk === 2 ? '96,180,208' : selectedHsk === 3 ? '212,160,23' : selectedHsk === 4 ? '232,160,96' : selectedHsk === 5 ? '231,76,60' : '192,57,43'},.12)`
                    : "rgba(255,255,255,.03)",
                  color: isOn ? "white" : "rgba(255,255,255,.4)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                {cat.icon && <span>{cat.icon}</span>}
                {cat.nameRu}
                {cat.nameZh && <span style={{ fontFamily: "'Noto Serif SC',serif", opacity: .5 }}>{cat.nameZh}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── АКТИВНЫЕ ТЕГИ ── */}
      {(selectedCats.length > 0 || selectedWords.length > 0) && (
        <div style={{ padding: "6px 16px 10px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.2)", textTransform: "uppercase", marginBottom: 6 }}>Активный набор</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedCats.map(cat => (
              <span key={cat.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(212,160,23,.12)", border: "1px solid rgba(212,160,23,.25)", color: "#D4A017", fontSize: 12, fontWeight: 600 }}>
                {cat.icon} HSK{cat.hsk} / {cat.nameRu}
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
  const { words, loading } = useWords();
  const { user } = useAuth();

  const [mode, setMode] = useState("wordlist");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const [selectedHsk, setSelectedHsk] = useState(1);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);

  // Слово из WordList → Draw
  const [drawFocusWord, setDrawFocusWord] = useState(null);

  const isLocked = !user && mode !== 'quiz' && mode !== 'wordlist';

  const activeVocab = (() => {
    if (selectedWords.length > 0) return selectedWords;
    if (selectedCats.length > 0) {
      const catIds = selectedCats.map(c => c.id);
      return words.filter(w => catIds.includes(w.categoryId));
    }
    return words.filter(w => Number(w.hsk) === selectedHsk);
  })();

  const vocab = activeVocab.length >= 2 ? activeVocab : words.filter(w => Number(w.hsk) === selectedHsk);

  // Переход из WordList в Draw для конкретного слова
  const handleGoToDraw = (word) => {
    setDrawFocusWord(word);
    setMode("draw");
    setCorrect(0); setWrong(0); setStreak(0);
    setFinished(false); setSessionKey(p => p + 1);
  };

  function handleScore(isCorrect) {
    if (isCorrect) { setCorrect(p => p + 1); setStreak(p => p + 1); }
    else { setWrong(p => p + 1); setStreak(0); }
  }

  function restart() {
    setCorrect(0); setWrong(0); setStreak(0);
    setFinished(false); setSessionKey(p => p + 1);
    setDrawFocusWord(null);
  }

  function finishSession() { setFinished(true); }

  // Сброс при смене фильтра
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

      <FilterBar
        allWords={words}
        selectedHsk={selectedHsk}
        setSelectedHsk={setSelectedHsk}
        selectedCats={selectedCats}
        setSelectedCats={setSelectedCats}
        selectedWords={selectedWords}
        setSelectedWords={setSelectedWords}
      />

      {/* ── Мобайл: нижняя панель режимов ── */}
      <div className={styles.mobileModebar}>
        {MODES.map(m => (
          <button key={m.id}
            onClick={() => { setMode(m.id); restart(); }}
            className={styles.mobileModeBtn}
            style={{ background: mode === m.id ? 'rgba(192,57,43,.15)' : 'transparent', borderTop: `2px solid ${mode === m.id ? '#C0392B' : 'transparent'}`, color: mode === m.id ? 'white' : 'rgba(255,255,255,.4)' }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{m.name}</span>
          </button>
        ))}
      </div>

      {/* ── Мобайл: score-бар ── */}
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

      {/* ── СЕТКА ── */}
      <div className={styles.trainerGrid}>

        {/* ЛЕВЫЙ САЙДБАР */}
        <aside className={styles.sidebar}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,.25)", padding: "0 16px", marginBottom: 8 }}>РЕЖИМ</div>
          {MODES.map(m => (
            <button key={m.id}
              onClick={() => { setMode(m.id); restart(); }}
              className={`${styles.modeBtn} ${mode === m.id ? styles.active : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "transparent", color: "rgba(255,255,255,.45)", width: "100%", textAlign: "left", cursor: "pointer" }}>
              {m.icon}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{m.desc}</div>
              </div>
            </button>
          ))}

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
                {mode === "wordlist" && <WordListMode vocab={vocab} onGoToDraw={handleGoToDraw} />}
                {mode === "quiz" && <QuizMode vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
                {mode === "flashcard" && <FlashcardMode vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
                {mode === "dialogue" && <DialogueMode onScore={handleScore} onFinish={finishSession} />}
                {mode === "type" && <TypeMode vocab={vocab} onScore={handleScore} onFinish={finishSession} />}
                {mode === "draw" && <DrawMode vocab={vocab} onScore={handleScore} onFinish={finishSession} focusWord={drawFocusWord} />}
              </div>
            )}
          </div>
        </main>

        {/* ПРАВЫЙ САЙДБАР */}
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

          <div style={{ marginTop: 16, padding: "12px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,.25)", textTransform: "uppercase", marginBottom: 8 }}>Фильтр</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              <span style={{ color: HSK_COLORS[selectedHsk], fontWeight: 700 }}>HSK {selectedHsk}</span>
              {selectedCats.length > 0 && <span style={{ color: "#D4A017" }}> · {selectedCats.length} кат.</span>}
              {selectedWords.length > 0 && <span style={{ color: "#E87060" }}> · {selectedWords.length} слов</span>}
            </div>
          </div>

          {/* Быстрый переход в Список */}
          {mode !== "wordlist" && (
            <button
              onClick={() => { setMode("wordlist"); restart(); }}
              style={{ marginTop: 12, width: "100%", padding: "10px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}
            >
              <List size={14} /> Список всех слов
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}