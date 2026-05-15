'use client'
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Loader2, Users, BookOpen, FolderOpen, Search } from 'lucide-react';
import TopNav from '@/components/UI/TopNav';
import styles from '@/styles/Dashboard.module.css';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
//  Уникальный glow-цвет на каждую иконку
// ─────────────────────────────────────────────────────────────────────────────
const ICON_COLORS = {
  "🗣️":"#60A5FA","💬":"#818CF8","👋":"#34D399","🤝":"#6EE7B7",
  "📢":"#FBBF24","🎤":"#F472B6","📣":"#FB923C","🗨️":"#A78BFA",
  "💭":"#C4B5FD","📞":"#4ADE80","☎️":"#86EFAC","📱":"#67E8F9",
  "🏠":"#FCA5A5","🛋️":"#FDBA74","🛏️":"#FCD34D","🚿":"#67E8F9",
  "🪟":"#93C5FD","🚪":"#C4B5FD","💡":"#FDE68A","🕰️":"#D1D5DB",
  "⏰":"#FCA5A5","📅":"#86EFAC","🗓️":"#6EE7B7","🧹":"#A5B4FC",
  "🧺":"#F9A8D4","🪴":"#6EE7B7","🪑":"#FDBA74","🛒":"#FDE68A",
  "🏃":"#34D399","🧘":"#A78BFA","🏋️":"#F472B6","⚽":"#4ADE80",
  "🏀":"#FB923C","🎾":"#FDE68A","🩺":"#67E8F9","💊":"#F9A8D4",
  "🫀":"#FCA5A5","👁️":"#60A5FA","👂":"#FDBA74","🦷":"#E5E7EB",
  "🌍":"#4ADE80","🌏":"#34D399","🗺️":"#FCD34D","✈️":"#60A5FA",
  "🚂":"#F87171","🚌":"#FB923C","🚖":"#FBBF24","🛳️":"#67E8F9",
  "🏖️":"#FDE68A","⛩️":"#F472B6","🏙️":"#818CF8","🗼":"#C4B5FD",
  "🏔️":"#93C5FD","🏞️":"#6EE7B7","🧳":"#FDBA74","🎌":"#F87171",
  "🇨🇳":"#F87171","🏯":"#FBBF24","🌉":"#818CF8","🌃":"#6366F1",
  "🌿":"#4ADE80","🌸":"#F9A8D4","🌺":"#F472B6","🌻":"#FCD34D",
  "🍀":"#4ADE80","🌊":"#38BDF8","☀️":"#FDE68A","🌙":"#C4B5FD",
  "⭐":"#FCD34D","🌈":"#F472B6","❄️":"#BAE6FD","⛅":"#93C5FD",
  "🦋":"#A78BFA","🐉":"#F87171","🐼":"#E5E7EB","🐟":"#38BDF8",
  "🐦":"#67E8F9","🦁":"#FCD34D","🐯":"#FB923C","🐢":"#4ADE80",
  "🌵":"#34D399","🍃":"#6EE7B7","🎋":"#86EFAC","🎍":"#4ADE80",
  "💼":"#94A3B8","🏢":"#64748B","👔":"#818CF8","📊":"#38BDF8",
  "📈":"#4ADE80","💰":"#FCD34D","🏦":"#FBBF24","🤑":"#86EFAC",
  "🔧":"#94A3B8","⚙️":"#CBD5E1","🖥️":"#67E8F9","📋":"#A5B4FC",
  "🖊️":"#C4B5FD","📌":"#F87171","🏗️":"#FDBA74","👷":"#FCD34D",
  "🎓":"#A78BFA","📚":"#818CF8","📖":"#93C5FD","✏️":"#FCD34D",
  "📝":"#A5B4FC","🏫":"#60A5FA","🔬":"#34D399","🔭":"#818CF8",
  "🧮":"#C4B5FD","🎨":"#F472B6","🎵":"#F9A8D4","🎸":"#FB923C",
  "🎭":"#A78BFA","📐":"#94A3B8","📏":"#94A3B8","🗂️":"#6366F1",
  "🧠":"#F472B6","🔑":"#FCD34D","🏆":"#FCD34D",
  "1️⃣":"#60A5FA","2️⃣":"#818CF8","3️⃣":"#A78BFA","🔢":"#C4B5FD",
  "🍜":"#FDBA74","🍣":"#F87171","🍱":"#FCD34D","🥟":"#FDE68A",
  "🍚":"#F5F5F4","🥢":"#FDBA74","🍲":"#FB923C","🍛":"#FCD34D",
  "🥗":"#4ADE80","🍎":"#F87171","🍊":"#FB923C","🍋":"#FDE68A",
  "🍇":"#A78BFA","🫖":"#FDBA74","🧋":"#D4A017","☕":"#A16207",
  "🍺":"#FCD34D","🥂":"#67E8F9","🍰":"#F9A8D4","🥮":"#FDBA74",
  "😀":"#FCD34D","😍":"#F472B6","🥰":"#F9A8D4","😂":"#FCD34D",
  "😭":"#60A5FA","😡":"#F87171","😱":"#FB923C","🤔":"#FCD34D",
  "😴":"#818CF8","🤒":"#86EFAC","💪":"#FB923C","🙏":"#FDE68A",
  "👀":"#60A5FA","❤️":"#F87171","💔":"#94A3B8","✨":"#FCD34D",
  "🎉":"#F472B6","🎊":"#A78BFA","🔥":"#FB923C","💎":"#67E8F9",
  "👨‍👩‍👧‍👦":"#34D399","👩":"#F9A8D4","👨":"#60A5FA","👧":"#F472B6",
  "👦":"#60A5FA","👴":"#94A3B8","👵":"#D1D5DB","👶":"#FDE68A",
};
const getGlow = (e) => ICON_COLORS[e] || "#818CF8";

// ─────────────────────────────────────────────────────────────────────────────
//  Группы и иконки
// ─────────────────────────────────────────────────────────────────────────────
const ICON_GROUPS = [
  { id: null,      label: "Все"     },
  { id: "speech",  label: "Речь"    },
  { id: "daily",   label: "Быт"     },
  { id: "world",   label: "Мир"     },
  { id: "nature",  label: "Природа" },
  { id: "work",    label: "Работа"  },
  { id: "study",   label: "Учёба"   },
  { id: "food",    label: "Еда"     },
  { id: "emotion", label: "Эмоции"  },
];

const ICONS = [
  ...["🗣️","💬","👋","🤝","📢","🎤","📣","🗨️","💭","📞","☎️","📱",
      "👨‍👩‍👧‍👦","👩","👨","👧","👦","👴","👵","👶"].map(e=>({e,g:"speech"})),
  ...["🏠","🛋️","🛏️","🚿","🪟","🚪","💡","🕰️","⏰","📅","🗓️","🧹",
      "🧺","🪴","🪑","🛒","🏃","🧘","🏋️","⚽","🏀","🎾","🩺","💊",
      "🫀","👁️","👂","🦷"].map(e=>({e,g:"daily"})),
  ...["🌍","🌏","🗺️","✈️","🚂","🚌","🚖","🛳️","🏖️","⛩️","🏙️","🗼",
      "🏔️","🏞️","🧳","🎌","🇨🇳","🏯","🌉","🌃"].map(e=>({e,g:"world"})),
  ...["🌿","🌸","🌺","🌻","🍀","🌊","☀️","🌙","⭐","🌈","❄️","⛅",
      "🦋","🐉","🐼","🐟","🐦","🦁","🐯","🐢","🌵","🍃","🎋","🎍"].map(e=>({e,g:"nature"})),
  ...["💼","🏢","👔","📊","📈","💰","🏦","🤑","🔧","⚙️","🖥️","📋",
      "🖊️","📌","🏗️","👷"].map(e=>({e,g:"work"})),
  ...["🎓","📚","📖","✏️","📝","🏫","🔬","🔭","🧮","🎨","🎵","🎸",
      "🎭","📐","📏","🗂️","🧠","🔑","🏆","1️⃣","2️⃣","3️⃣","🔢"].map(e=>({e,g:"study"})),
  ...["🍜","🍣","🍱","🥟","🍚","🥢","🍲","🍛","🥗","🍎","🍊","🍋",
      "🍇","🫖","🧋","☕","🍺","🥂","🍰","🥮"].map(e=>({e,g:"food"})),
  ...["😀","😍","🥰","😂","😭","😡","😱","🤔","😴","🤒","💪","🙏",
      "👀","❤️","💔","✨","🎉","🎊","🔥","💎"].map(e=>({e,g:"emotion"})),
];

// ─────────────────────────────────────────────────────────────────────────────
//  IconPicker — минималистичный, свайпабельный
// ─────────────────────────────────────────────────────────────────────────────
function IconPicker({ value, onChange }) {
  const [activeGroup, setActiveGroup] = useState(null);
  const [search, setSearch]           = useState("");
  const tabsRef    = useRef(null);
  const dragging   = useRef(false);
  const startX     = useRef(0);
  const scrollLeft = useRef(0);

  const filtered = ICONS.filter(ic =>
    search ? ic.e.includes(search) : (activeGroup ? ic.g === activeGroup : true)
  );

  // drag-scroll для мыши (тач — нативный overflow-x)
  const onMD = e => {
    dragging.current   = true;
    startX.current     = e.pageX - tabsRef.current.offsetLeft;
    scrollLeft.current = tabsRef.current.scrollLeft;
  };
  const onMM = e => {
    if (!dragging.current) return;
    e.preventDefault();
    tabsRef.current.scrollLeft = scrollLeft.current - (e.pageX - tabsRef.current.offsetLeft - startX.current) * 1.4;
  };
  const onMU = () => { dragging.current = false; };

  const glow = getGlow(value);

  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)" }}>

      {/* ── Хедер: превью + поиск ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        {/* Превью */}
        <div style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          background:`${glow}10`, border:`1px solid ${glow}28`,
          boxShadow:`0 0 16px ${glow}30`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
          transition:"all 0.2s",
        }}>
          <span style={{ filter:`drop-shadow(0 0 7px ${glow}cc)`, transition:"filter 0.2s" }}>{value}</span>
        </div>

        {/* Поиск */}
        <div style={{
          flex:1, display:"flex", alignItems:"center", gap:8,
          background:"rgba(255,255,255,0.04)", borderRadius:9,
          padding:"8px 10px", border:"1px solid rgba(255,255,255,0.06)",
        }}>
          <Search size={13} style={{ color:"rgba(255,255,255,0.22)", flexShrink:0 }}/>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveGroup(null); }}
            placeholder="Поиск иконки..."
            style={{ flex:1, background:"none", border:"none", outline:"none", color:"white", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}
          />
          {search && (
            <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.28)", cursor:"pointer", padding:0, lineHeight:1, fontSize:13 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Свайпабельные табы ── */}
      {!search && (
        <div
          ref={tabsRef}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          style={{
            display:"flex", gap:5, padding:"8px 12px",
            overflowX:"auto", WebkitOverflowScrolling:"touch",
            scrollbarWidth:"none", borderBottom:"1px solid rgba(255,255,255,0.04)",
            cursor:"grab", userSelect:"none",
          }}
        >
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          {ICON_GROUPS.map(g => {
            const active = activeGroup === g.id;
            return (
              <button
                key={g.label} type="button"
                onClick={() => setActiveGroup(g.id)}
                style={{
                  flexShrink:0, padding:"4px 13px", borderRadius:20,
                  border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
                  background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: active ? "white" : "rgba(255,255,255,0.35)",
                  fontSize:12, fontWeight: active ? 600 : 400,
                  cursor:"pointer", transition:"all 0.15s",
                  fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.01em",
                }}
              >{g.label}</button>
            );
          })}
        </div>
      )}

      {/* ── Сетка иконок ── */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(42px,1fr))",
        gap:4, padding:"10px 12px 12px",
        maxHeight:200, overflowY:"auto",
        scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.07) transparent",
      }}>
        {filtered.map((ic, i) => {
          const g  = getGlow(ic.e);
          const sel = ic.e === value;
          return (
            <button
              key={i} type="button"
              onClick={() => onChange(ic.e)}
              style={{
                aspectRatio:"1", borderRadius:10,
                border: sel ? `1px solid ${g}45` : "1px solid transparent",
                background: sel ? `${g}12` : "rgba(255,255,255,0.03)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, cursor:"pointer", transition:"all 0.14s",
                position:"relative",
                boxShadow: sel ? `0 0 10px ${g}28` : "none",
              }}
              onMouseEnter={e => {
                if (sel) return;
                e.currentTarget.style.background = `${g}12`;
                e.currentTarget.style.border     = `1px solid ${g}38`;
                e.currentTarget.style.transform  = "scale(1.12) translateY(-1px)";
                e.currentTarget.querySelector("span").style.filter = `drop-shadow(0 0 6px ${g}dd)`;
              }}
              onMouseLeave={e => {
                if (sel) return;
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.border     = "1px solid transparent";
                e.currentTarget.style.transform  = "none";
                e.currentTarget.querySelector("span").style.filter = "none";
              }}
            >
              <span style={{ filter: sel ? `drop-shadow(0 0 7px ${g}ee)` : "none", transition:"filter 0.14s", lineHeight:1 }}>
                {ic.e}
              </span>
              {sel && (
                <span style={{
                  position:"absolute", bottom:-3, right:-3,
                  width:13, height:13, borderRadius:"50%",
                  background:g, fontSize:7, fontWeight:900, color:"#000",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  zIndex:2, boxShadow:`0 0 5px ${g}`,
                }}>✓</span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"24px 0", color:"rgba(255,255,255,0.22)", fontSize:13 }}>
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ГЛАВНЫЙ КОМПОНЕНТ  AdminPanel
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab]               = useState('dictionary');
  const [words, setWords]           = useState([]);
  const [students, setStudents]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData]     = useState({ h:"", p:"", ru:"", uz:"", en:"", hsk:1, categoryId:"" });
  const [formOpen, setFormOpen]     = useState(false);
  const [catForm, setCatForm]       = useState({ hsk:1, nameRu:"", nameZh:"", nameUz:"", nameEn:"", pinyin:"", icon:"📁" });
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catSubmitting, setCatSubmitting] = useState(false);

  const filteredCategories = categories.filter(c => Number(c.hsk) === Number(formData.hsk));
  const HSK_COLORS = ["","#7EC89A","#60B4D0","#D4A017","#E8A060","#E74C3C","#C0392B"];

  useEffect(() => {
    const q = query(collection(db,"words"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap => {
      setWords(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return ()=>unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db,"categories"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap => setCategories(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>unsub();
  }, []);

  useEffect(() => {
    if (tab==='students') {
      getDocs(query(collection(db,"users"),orderBy("joinDate","desc")))
        .then(snap => setStudents(snap.docs.map(d=>d.data())));
    }
  }, [tab]);

  const handleAddWord = async e => {
    e.preventDefault();
    if (!formData.h||!formData.p||!formData.ru) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db,"words"), {...formData, hsk:Number(formData.hsk), categoryId:formData.categoryId||null, createdAt:Date.now()});
      setFormData({h:"",p:"",ru:"",uz:"",en:"",hsk:1,categoryId:""});
      setFormOpen(false);
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async id => {
    if (confirm("Точно удалить это слово навсегда?")) await deleteDoc(doc(db,"words",id));
  };

  const handleAddCategory = async e => {
    e.preventDefault();
    if (!catForm.nameRu) return;
    setCatSubmitting(true);
    try {
      await addDoc(collection(db,"categories"), {...catForm, hsk:Number(catForm.hsk), createdAt:Date.now()});
      setCatForm({hsk:1,nameRu:"",nameZh:"",nameUz:"",nameEn:"",pinyin:"",icon:"📁"});
      setCatFormOpen(false);
    } finally { setCatSubmitting(false); }
  };

  const handleDeleteCategory = async id => {
    if (confirm("Удалить категорию? Слова в ней останутся.")) await deleteDoc(doc(db,"categories",id));
  };

  const inp = {
    width:"100%", padding:"14px 16px", background:"rgba(255,255,255,0.04)",
    border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"14px",
    color:"white", fontSize:"15px", outline:"none", transition:"all 0.2s",
    fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box"
  };
  const lbl = {
    display:"block", fontSize:"11px", fontWeight:"600", letterSpacing:"1px",
    color:"rgba(255,255,255,0.4)", textTransform:"uppercase", marginBottom:"8px"
  };

  return (
    <div className={styles.db}>
      <style>{`
        .ag{display:grid;grid-template-columns:380px 1fr;gap:32px}
        .aa{display:block}
        .af{display:none}
        .wr{display:grid;grid-template-columns:80px 120px 1fr 80px 50px;align-items:center;gap:20px}
        .wh{font-size:32px}
        .wu{display:block}
        .sr{display:grid;grid-template-columns:48px 1fr 120px 100px;align-items:center;gap:20px}
        .sx{display:block}
        .tl{display:inline}
        .cg{display:grid;grid-template-columns:420px 1fr;gap:32px}
        .ca{display:block}
        .cf{display:none}
        @media(max-width:768px){
          .ag,.cg{grid-template-columns:1fr}
          .aa,.ca{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);overflow-y:auto;padding:24px 16px}
          .aa.open,.ca.open{display:block}
          .af,.cf{display:flex;position:fixed;bottom:24px;right:24px;z-index:150;width:56px;height:56px;border-radius:50%;background:#C0392B;border:none;color:white;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(192,57,43,0.5);cursor:pointer}
          .wr{grid-template-columns:52px 1fr auto;gap:12px}
          .wh{font-size:24px}
          .wu,.whc{display:none}
          .wa{grid-column:3;display:flex;gap:8px;align-items:center}
          .sr{grid-template-columns:40px 1fr auto;gap:12px}
          .sx{display:none}
          .tl{display:none}
        }
      `}</style>

      <TopNav/>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px 100px"}}>

        {/* ТАБЫ */}
        <div style={{display:'flex',gap:10,marginBottom:28}}>
          {[
            {id:'dictionary',icon:<BookOpen size={18}/>,label:'Словарь',   count:words.length},
            {id:'categories',icon:<FolderOpen size={18}/>,label:'Категории',count:categories.length},
            {id:'students',  icon:<Users size={18}/>,   label:'Студенты',  count:students.length},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex',alignItems:'center',gap:8,padding:'11px 20px',
              background:tab===t.id?'#C0392B':'rgba(255,255,255,0.03)',
              borderRadius:16,border:tab===t.id?'none':'1px solid rgba(255,255,255,0.1)',
              color:tab===t.id?'white':'rgba(255,255,255,0.5)',
              cursor:'pointer',fontSize:'14px',fontWeight:600,transition:'all 0.2s'
            }}>
              {t.icon}<span className="tl">{t.label}</span>({t.count})
            </button>
          ))}
        </div>

        {/* ══ СЛОВАРЬ ══ */}
        {tab==='dictionary'&&(
          <div className="ag">
            <aside className={`aa${formOpen?' open':''}`}>
              <div className={`${styles.card} ${styles.animUp}`} style={{padding:"28px 24px",position:"sticky",top:"80px",maxWidth:480,margin:"0 auto"}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
                  <div className={styles.cardLabel} style={{fontSize:"12px"}}>Добавить слово</div>
                  <button onClick={()=>setFormOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:22,lineHeight:1}}>✕</button>
                </div>
                <form onSubmit={handleAddWord} style={{display:"flex",flexDirection:"column",gap:18}}>
                  <div><label style={lbl}>Иероглиф (字)*</label><input value={formData.h} onChange={e=>setFormData({...formData,h:e.target.value})} placeholder="学习" style={{...inp,fontFamily:"'Noto Serif SC',serif",fontSize:"20px"}}/></div>
                  <div><label style={lbl}>Пиньинь*</label><input value={formData.p} onChange={e=>setFormData({...formData,p:e.target.value})} placeholder="xuéxí" style={{...inp,color:"#E74C3C",fontWeight:"500"}}/></div>
                  <div><label style={lbl}>Перевод (RU)*</label><input value={formData.ru} onChange={e=>setFormData({...formData,ru:e.target.value})} placeholder="учиться" style={inp}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div><label style={lbl}>UZ</label><input value={formData.uz} onChange={e=>setFormData({...formData,uz:e.target.value})} placeholder="o'rganmoq" style={inp}/></div>
                    <div><label style={lbl}>EN</label><input value={formData.en} onChange={e=>setFormData({...formData,en:e.target.value})} placeholder="to study" style={inp}/></div>
                  </div>
                  <div>
                    <label style={lbl}>Уровень HSK</label>
                    <select value={formData.hsk} onChange={e=>setFormData({...formData,hsk:e.target.value,categoryId:""})} style={{...inp,cursor:"pointer"}}>
                      {[1,2,3,4,5,6].map(l=><option key={l} value={l} style={{background:'#181818'}}>HSK {l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>
                      Категория (HSK {formData.hsk})
                      {filteredCategories.length===0&&<span style={{color:"#E87060",marginLeft:8,textTransform:"none",letterSpacing:0}}>— нет категорий</span>}
                    </label>
                    <select value={formData.categoryId} onChange={e=>setFormData({...formData,categoryId:e.target.value})}
                      disabled={filteredCategories.length===0}
                      style={{...inp,cursor:filteredCategories.length===0?"not-allowed":"pointer",opacity:filteredCategories.length===0?0.4:1}}>
                      <option value="" style={{background:'#181818'}}>— Без категории —</option>
                      {filteredCategories.map(c=><option key={c.id} value={c.id} style={{background:'#181818'}}>{c.icon||"📁"} {c.nameRu}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={styles.primaryBtn} style={{justifyContent:"center",padding:"16px",marginTop:"6px",fontSize:"15px",borderRadius:"14px"}}>
                    {isSubmitting?<Loader2 size={20} className="animate-spin"/>:<Plus size={20}/>} Добавить в базу
                  </button>
                </form>
              </div>
            </aside>

            <main>
              <div className={`${styles.card} ${styles.animUp}`} style={{animationDelay:"0.1s",padding:"24px",minHeight:"600px"}}>
                <div className={styles.cardLabel} style={{fontSize:"12px",marginBottom:"20px"}}>Облачная база слов</div>
                {loading?(
                  <div style={{padding:"60px 0",textAlign:"center",color:"rgba(255,255,255,0.4)"}}>Загрузка...</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {words.map(w=>{
                      const wCat=categories.find(c=>c.id===w.categoryId);
                      return(
                        <div key={w.id} className="wr" style={{background:"rgba(255,255,255,0.03)",padding:"14px 18px",borderRadius:"16px",border:"1px solid rgba(255,255,255,0.04)",transition:"background 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                          <div className="wh" style={{fontFamily:"'Noto Serif SC',serif",color:"white"}}>{w.h}</div>
                          <div>
                            <div style={{color:"#E74C3C",fontWeight:600,letterSpacing:"0.5px"}}>{w.p}</div>
                            <div style={{color:"white",fontSize:"14px"}}>{w.ru}</div>
                            <div className="wu" style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",marginTop:2}}>{w.uz} <span style={{margin:"0 4px",opacity:0.5}}>|</span> {w.en}</div>
                            {wCat&&<div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:2}}>{wCat.icon||"📁"} {wCat.nameRu}</div>}
                          </div>
                          <div className="whc">
                            <span style={{fontSize:"11px",fontWeight:700,padding:"6px 12px",borderRadius:"20px",background:"rgba(212,160,23,0.1)",border:"1px solid rgba(212,160,23,0.2)",color:"#D4A017"}}>HSK {w.hsk}</span>
                          </div>
                          <div className="wa" style={{display:"flex",gap:10,justifySelf:"flex-end"}}>
                            <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}><Edit2 size={17}/></button>
                            <button onClick={()=>handleDelete(w.id)} style={{background:"none",border:"none",color:"rgba(232,112,96,0.6)",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#E87060"} onMouseLeave={e=>e.currentTarget.style.color="rgba(232,112,96,0.6)"}><Trash2 size={17}/></button>
                          </div>
                        </div>
                      );
                    })}
                    {words.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:"rgba(255,255,255,0.4)"}}>База пуста. Добавь слова!</div>}
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {/* ══ КАТЕГОРИИ ══ */}
        {tab==='categories'&&(
          <div className="cg">
            <aside className={`ca${catFormOpen?' open':''}`}>
              <div className={`${styles.card} ${styles.animUp}`} style={{padding:"28px 24px",position:"sticky",top:"80px",maxWidth:480,margin:"0 auto"}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
                  <div className={styles.cardLabel} style={{fontSize:"12px"}}>Добавить категорию</div>
                  <button onClick={()=>setCatFormOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:22,lineHeight:1}}>✕</button>
                </div>
                <form onSubmit={handleAddCategory} style={{display:"flex",flexDirection:"column",gap:18}}>
                  <div>
                    <label style={lbl}>Уровень HSK</label>
                    <select value={catForm.hsk} onChange={e=>setCatForm({...catForm,hsk:e.target.value})} style={{...inp,cursor:"pointer"}}>
                      {[1,2,3,4,5,6].map(l=><option key={l} value={l} style={{background:'#181818'}}>HSK {l}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Название (RU)*</label><input value={catForm.nameRu} onChange={e=>setCatForm({...catForm,nameRu:e.target.value})} placeholder="Например: Приветствия" style={inp} required/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div><label style={lbl}>Китайский (ZH)</label><input value={catForm.nameZh} onChange={e=>setCatForm({...catForm,nameZh:e.target.value})} placeholder="问候语" style={{...inp,fontFamily:"'Noto Serif SC',serif"}}/></div>
                    <div><label style={lbl}>Пиньинь</label><input value={catForm.pinyin} onChange={e=>setCatForm({...catForm,pinyin:e.target.value})} placeholder="wènhòuyǔ" style={{...inp,color:"#E74C3C"}}/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div><label style={lbl}>UZ</label><input value={catForm.nameUz} onChange={e=>setCatForm({...catForm,nameUz:e.target.value})} placeholder="Salomlashish" style={inp}/></div>
                    <div><label style={lbl}>EN</label><input value={catForm.nameEn} onChange={e=>setCatForm({...catForm,nameEn:e.target.value})} placeholder="Greetings" style={inp}/></div>
                  </div>

                  {/* ── ICON PICKER ── */}
                  <div>
                    <label style={lbl}>Иконка</label>
                    <IconPicker value={catForm.icon} onChange={icon=>setCatForm({...catForm,icon})}/>
                  </div>

                  <button type="submit" disabled={catSubmitting} className={styles.primaryBtn} style={{justifyContent:"center",padding:"16px",marginTop:"6px",fontSize:"15px",borderRadius:"14px"}}>
                    {catSubmitting?<Loader2 size={20} className="animate-spin"/>:<Plus size={20}/>} Создать категорию
                  </button>
                </form>
              </div>
            </aside>

            <main>
              <div className={`${styles.card} ${styles.animUp}`} style={{animationDelay:"0.1s",padding:"24px",minHeight:"600px"}}>
                <div className={styles.cardLabel} style={{fontSize:"12px",marginBottom:"20px"}}>Все категории ({categories.length})</div>
                {[1,2,3,4,5,6].map(hskNum=>{
                  const hskCats=categories.filter(c=>Number(c.hsk)===hskNum);
                  if(!hskCats.length) return null;
                  const hc=HSK_COLORS[hskNum];
                  const hr=["","93,138,110","96,180,208","212,160,23","232,160,96","231,76,60","192,57,43"][hskNum];
                  return(
                    <div key={hskNum} style={{marginBottom:24}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:"12px",fontWeight:700,padding:"4px 12px",borderRadius:"20px",background:`rgba(${hr},0.15)`,color:hc,border:`1px solid ${hc}40`}}>HSK {hskNum}</span>
                        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.3)"}}>{hskCats.length} категорий</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {hskCats.map(cat=>{
                          const ig=getGlow(cat.icon||"📁");
                          return(
                            <div key={cat.id}
                              style={{background:"rgba(255,255,255,0.03)",padding:"14px 18px",borderRadius:"14px",border:"1px solid rgba(255,255,255,0.04)",display:"flex",alignItems:"center",gap:16,transition:"background 0.2s"}}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                              {/* Иконка с уникальным glow */}
                              <div style={{
                                width:44,height:44,borderRadius:13,flexShrink:0,
                                background:`${ig}10`,border:`1px solid ${ig}30`,
                                boxShadow:`0 0 14px ${ig}28,0 0 4px ${ig}14`,
                                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
                              }}>
                                <span style={{filter:`drop-shadow(0 0 6px ${ig}cc)`}}>{cat.icon||"📁"}</span>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:600,fontSize:15,color:"white"}}>{cat.nameRu}</div>
                                <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                                  {cat.nameZh&&<span style={{fontFamily:"'Noto Serif SC',serif"}}>{cat.nameZh}</span>}
                                  {cat.pinyin&&<span style={{color:"#E74C3C"}}>{cat.pinyin}</span>}
                                  {cat.nameUz&&<span>🇺🇿 {cat.nameUz}</span>}
                                  {cat.nameEn&&<span>🇬🇧 {cat.nameEn}</span>}
                                </div>
                                <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:3}}>
                                  {words.filter(w=>w.categoryId===cat.id).length} слов
                                </div>
                              </div>
                              <button onClick={()=>handleDeleteCategory(cat.id)} style={{background:"none",border:"none",color:"rgba(232,112,96,0.5)",cursor:"pointer",transition:"color 0.2s",flexShrink:0}}
                                onMouseEnter={e=>e.currentTarget.style.color="#E87060"}
                                onMouseLeave={e=>e.currentTarget.style.color="rgba(232,112,96,0.5)"}>
                                <Trash2 size={17}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {categories.length===0&&(
                  <div style={{padding:"60px 0",textAlign:"center",color:"rgba(255,255,255,0.4)"}}>
                    <div style={{fontSize:40,marginBottom:12}}>📁</div>
                    <div>Категорий пока нет.</div>
                    <div style={{fontSize:13,marginTop:6,color:"rgba(255,255,255,0.25)"}}>Нажми + чтобы создать первую</div>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {/* ══ СТУДЕНТЫ ══ */}
        {tab==='students'&&(
          <div className={`${styles.card} ${styles.animUp}`} style={{padding:"24px"}}>
            <div className={styles.cardLabel} style={{fontSize:"12px",marginBottom:"20px"}}>Список студентов ({students.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {students.map((st,i)=>(
                <div key={i} className="sr" style={{background:"rgba(255,255,255,0.03)",padding:"14px 18px",borderRadius:"16px",border:"1px solid rgba(255,255,255,0.04)"}}>
                  {st.photoURL
                    ?<img src={st.photoURL} style={{width:48,height:48,borderRadius:'50%',border:st.role==='admin'?'2px solid #D4A017':'none'}} alt="ava"/>
                    :<div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#C0392B,#D4A017)',display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"18px",color:"white"}}>{st.name?.charAt(0)}</div>
                  }
                  <div>
                    <div style={{color:"white",fontWeight:"bold",fontSize:"15px",marginBottom:"2px"}}>
                      {st.name}
                      {st.role==='admin'&&<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"12px",background:"rgba(212,160,23,0.15)",color:"#D4A017",marginLeft:"8px",verticalAlign:"middle"}}>АДМИН</span>}
                    </div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>{st.email}</div>
                    <div className="sx" style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",marginTop:2}}>Рег.: {new Date(st.joinDate).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div className="sx" style={{color:"white",fontWeight:"bold",fontSize:"14px"}}>
                    <span style={{color:"#D4A017",marginRight:"4px"}}>⭐</span>{st.xp?.toLocaleString()} XP
                  </div>
                  <div>
                    <span style={{fontSize:"12px",fontWeight:700,padding:"6px 10px",borderRadius:"20px",background:"rgba(126,200,154,0.1)",border:"1px solid rgba(126,200,154,0.2)",color:"#7EC89A"}}>HSK {st.hskLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {tab==='dictionary'&&<button className="af" onClick={()=>setFormOpen(true)}><Plus size={26}/></button>}
      {tab==='categories'&&<button className="cf" onClick={()=>setCatFormOpen(true)}><Plus size={26}/></button>}
    </div>
  );
}