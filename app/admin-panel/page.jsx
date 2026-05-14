'use client'
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Users, BookOpen } from 'lucide-react';
import TopNav from '@/components/UI/TopNav';
import styles from '@/styles/Dashboard.module.css';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

export default function AdminPanel() {
  const [tab, setTab] = useState('dictionary');
  const [words, setWords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ h: "", p: "", ru: "", uz: "", en: "", hsk: 1 });
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "words"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (tab === 'students') {
      const fetchStudents = async () => {
        const q = query(collection(db, "users"), orderBy("joinDate", "desc"));
        const snapshot = await getDocs(q);
        setStudents(snapshot.docs.map(doc => doc.data()));
      };
      fetchStudents();
    }
  }, [tab]);

  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!formData.h || !formData.p || !formData.ru) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "words"), { ...formData, hsk: Number(formData.hsk), createdAt: Date.now() });
      setFormData({ h: "", p: "", ru: "", uz: "", en: "", hsk: 1 });
      setFormOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Точно удалить это слово навсегда?")) await deleteDoc(doc(db, "words", id));
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: "14px",
    color: "white", fontSize: "15px", outline: "none", transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1px",
    color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px"
  };

  return (
    <div className={styles.db}>
      <style>{`
        .admin-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 32px;
        }
        .admin-aside {
          display: block;
        }
        .admin-fab {
          display: none;
        }
        .word-row {
          display: grid;
          grid-template-columns: 80px 120px 1fr 80px 50px;
          align-items: center;
          gap: 20px;
        }
        .word-hz { font-size: 32px; }
        .word-uz-en { display: block; }
        .student-row {
          display: grid;
          grid-template-columns: 48px 1fr 120px 100px;
          align-items: center;
          gap: 20px;
        }
        .student-xp { display: block; }
        .tab-label { display: inline; }

        @media (max-width: 768px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }
          .admin-aside {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 200;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(6px);
            overflow-y: auto;
            padding: 24px 16px;
          }
          .admin-aside.open {
            display: block;
          }
          .admin-fab {
            display: flex;
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 150;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #C0392B;
            border: none;
            color: white;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(192,57,43,0.5);
            cursor: pointer;
            font-size: 28px;
            line-height: 1;
          }
          .word-row {
            grid-template-columns: 52px 1fr auto;
            gap: 12px;
          }
          .word-hz { font-size: 24px; }
          .word-pinyin { font-size: 13px; }
          .word-meta { display: flex; flex-direction: column; gap: 2px; }
          .word-uz-en { display: none; }
          .word-hsk-col { display: none; }
          .word-actions { grid-column: 3; display: flex; gap: 8px; align-items: center; }
          .student-row {
            grid-template-columns: 40px 1fr auto;
            gap: 12px;
          }
          .student-xp { display: none; }
          .student-avatar { width: 40px !important; height: 40px !important; font-size: 14px !important; }
          .tab-label { display: none; }
        }
      `}</style>

      <TopNav />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 100px" }}>

        {/* Вкладки */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <button onClick={() => setTab('dictionary')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: tab === 'dictionary' ? '#C0392B' : 'rgba(255,255,255,0.03)', borderRadius: 16, border: tab === 'dictionary' ? 'none' : '1px solid rgba(255,255,255,0.1)', color: tab === 'dictionary' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' }}>
            <BookOpen size={18} /> <span className="tab-label">Словарь</span> ({words.length})
          </button>
          <button onClick={() => setTab('students')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: tab === 'students' ? '#C0392B' : 'rgba(255,255,255,0.03)', borderRadius: 16, border: tab === 'students' ? 'none' : '1px solid rgba(255,255,255,0.1)', color: tab === 'students' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' }}>
            <Users size={18} /> <span className="tab-label">Студенты</span> ({students.length})
          </button>
        </div>

        {tab === 'dictionary' ? (
          <div className="admin-grid">

            {/* Форма — десктоп: сайдбар, мобайл: оверлей */}
            <aside className={`admin-aside${formOpen ? ' open' : ''}`}>
              <div className={`${styles.card} ${styles.animUp}`} style={{ padding: "28px 24px", position: "sticky", top: "80px", maxWidth: 480, margin: "0 auto" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div className={styles.cardLabel} style={{ fontSize: "12px" }}>Добавить новое слово</div>
                  <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>✕</button>
                </div>

                <form onSubmit={handleAddWord} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={labelStyle}>Иероглиф (字)*</label>
                    <input name="h" value={formData.h} onChange={e => setFormData({ ...formData, h: e.target.value })} placeholder="Например: 学习" style={{ ...inputStyle, fontFamily: "'Noto Serif SC',serif", fontSize: "20px" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Пиньинь (Pīnyīn)*</label>
                    <input name="p" value={formData.p} onChange={e => setFormData({ ...formData, p: e.target.value })} placeholder="xuéxí" style={{ ...inputStyle, color: "#E74C3C", fontWeight: "500" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Перевод (RU)*</label>
                    <input name="ru" value={formData.ru} onChange={e => setFormData({ ...formData, ru: e.target.value })} placeholder="учиться" style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>UZ</label>
                      <input name="uz" value={formData.uz} onChange={e => setFormData({ ...formData, uz: e.target.value })} placeholder="o'rganmoq" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>EN</label>
                      <input name="en" value={formData.en} onChange={e => setFormData({ ...formData, en: e.target.value })} placeholder="to study" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Уровень HSK</label>
                    <select name="hsk" value={formData.hsk} onChange={e => setFormData({ ...formData, hsk: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      {[1, 2, 3, 4, 5, 6].map(lvl => <option key={lvl} value={lvl} style={{ background: '#181818' }}>Уровень HSK {lvl}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={styles.primaryBtn} style={{ justifyContent: "center", padding: "16px", marginTop: "6px", fontSize: "15px", borderRadius: "14px" }}>
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} Добавить в базу
                  </button>
                </form>
              </div>
            </aside>

            {/* Список слов */}
            <main>
              <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: "0.1s", padding: "24px", minHeight: "600px" }}>
                <div className={styles.cardLabel} style={{ fontSize: "12px", marginBottom: "20px" }}>Облачная база слов</div>

                {loading ? (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Загрузка...</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {words.map((w) => (
                      <div key={w.id} className="word-row" style={{ background: "rgba(255,255,255,0.03)", padding: "14px 18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>

                        <div className="word-hz" style={{ fontFamily: "'Noto Serif SC',serif", color: "white" }}>{w.h}</div>

                        <div className="word-meta">
                          <div className="word-pinyin" style={{ color: "#E74C3C", fontWeight: 600, letterSpacing: "0.5px" }}>{w.p}</div>
                          <div style={{ color: "white", fontSize: "14px" }}>{w.ru}</div>
                          <div className="word-uz-en" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{w.uz} <span style={{ margin: "0 4px", opacity: 0.5 }}>|</span> {w.en}</div>
                        </div>

                        <div className="word-hsk-col">
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "6px 12px", borderRadius: "20px", background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)", color: "#D4A017" }}>
                            HSK {w.hsk}
                          </span>
                        </div>

                        <div className="word-actions" style={{ display: "flex", gap: 10, justifySelf: "flex-end" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "12px", background: "rgba(212,160,23,0.1)", color: "#D4A017", display: "none" }} className="word-hsk-mobile">HSK {w.hsk}</span>
                          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}><Edit2 size={17} /></button>
                          <button onClick={() => handleDelete(w.id)} style={{ background: "none", border: "none", color: "rgba(232,112,96,0.6)", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#E87060"} onMouseLeave={e => e.currentTarget.style.color = "rgba(232,112,96,0.6)"}><Trash2 size={17} /></button>
                        </div>

                      </div>
                    ))}
                    {words.length === 0 && <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>База пуста. Добавь слова!</div>}
                  </div>
                )}
              </div>
            </main>
          </div>

        ) : (
          <div className={`${styles.card} ${styles.animUp}`} style={{ padding: "24px" }}>
            <div className={styles.cardLabel} style={{ fontSize: "12px", marginBottom: "20px" }}>Список студентов ({students.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {students.map((st, i) => (
                <div key={i} className="student-row" style={{ background: "rgba(255,255,255,0.03)", padding: "14px 18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>

                  {st.photoURL ? (
                    <img src={st.photoURL} className="student-avatar" style={{ width: 48, height: 48, borderRadius: '50%', border: st.role === 'admin' ? '2px solid #D4A017' : 'none' }} alt="ava" />
                  ) : (
                    <div className="student-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#C0392B,#D4A017)', display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px", color: "white" }}>{st.name?.charAt(0)}</div>
                  )}

                  <div>
                    <div style={{ color: "white", fontWeight: "bold", fontSize: "15px", marginBottom: "2px" }}>
                      {st.name}
                      {st.role === 'admin' && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", background: "rgba(212,160,23,0.15)", color: "#D4A017", marginLeft: "8px", verticalAlign: "middle" }}>АДМИН</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{st.email}</div>
                    <div className="student-xp" style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                      Рег.: {new Date(st.joinDate).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <div className="student-xp" style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>
                    <span style={{ color: "#D4A017", marginRight: "4px" }}>⭐</span>{st.xp?.toLocaleString()} XP
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, padding: "6px 10px", borderRadius: "20px", background: "rgba(126,200,154,0.1)", border: "1px solid rgba(126,200,154,0.2)", color: "#7EC89A" }}>
                      HSK {st.hskLevel}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB — кнопка добавления на мобайле */}
      {tab === 'dictionary' && (
        <button className="admin-fab" onClick={() => setFormOpen(true)}>
          <Plus size={26} />
        </button>
      )}
    </div>
  );
}