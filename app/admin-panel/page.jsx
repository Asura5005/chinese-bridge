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

  useEffect(() => {
    const q = query(collection(db, "words"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  },[]);

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
    fontFamily: "'DM Sans', sans-serif"
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", 
    color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px"
  };

  return (
    <div className={styles.db}>
      <TopNav />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        
        {/* Переключатель вкладок - Красивый и крупный */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button onClick={() => setTab('dictionary')} style={{ display:'flex', alignItems:'center', gap:10, padding: '12px 24px', background: tab === 'dictionary' ? '#C0392B' : 'rgba(255,255,255,0.03)', borderRadius: 16, border: tab === 'dictionary' ? 'none' : '1px solid rgba(255,255,255,0.1)', color: tab === 'dictionary' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '15px', fontWeight: 600, transition: 'all 0.2s' }}>
            <BookOpen size={20}/> Словарь ({words.length})
          </button>
          <button onClick={() => setTab('students')} style={{ display:'flex', alignItems:'center', gap:10, padding: '12px 24px', background: tab === 'students' ? '#C0392B' : 'rgba(255,255,255,0.03)', borderRadius: 16, border: tab === 'students' ? 'none' : '1px solid rgba(255,255,255,0.1)', color: tab === 'students' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '15px', fontWeight: 600, transition: 'all 0.2s' }}>
            <Users size={20}/> Студенты ({students.length})
          </button>
        </div>

        {tab === 'dictionary' ? (
          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 32 }}>
            <aside>
              <div className={`${styles.card} ${styles.animUp}`} style={{ padding: "32px 28px", position: "sticky", top: "80px" }}>
                <div className={styles.cardLabel} style={{ fontSize: "12px", marginBottom: "24px" }}>Добавить новое слово</div>
                
                <form onSubmit={handleAddWord} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Иероглиф (字)*</label>
                    <input name="h" value={formData.h} onChange={e=>setFormData({...formData, h:e.target.value})} placeholder="Например: 学习" style={{...inputStyle, fontFamily:"'Noto Serif SC',serif", fontSize: "20px"}} />
                  </div>

                  <div>
                    <label style={labelStyle}>Пиньинь (Pīnyīn)*</label>
                    <input name="p" value={formData.p} onChange={e=>setFormData({...formData, p:e.target.value})} placeholder="xuéxí" style={{...inputStyle, color:"#E74C3C", fontWeight: "500"}} />
                  </div>

                  <div>
                    <label style={labelStyle}>Перевод (RU)*</label>
                    <input name="ru" value={formData.ru} onChange={e=>setFormData({...formData, ru:e.target.value})} placeholder="учиться" style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>UZ</label>
                      <input name="uz" value={formData.uz} onChange={e=>setFormData({...formData, uz:e.target.value})} placeholder="o'rganmoq" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>EN</label>
                      <input name="en" value={formData.en} onChange={e=>setFormData({...formData, en:e.target.value})} placeholder="to study" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Уровень HSK</label>
                    <select name="hsk" value={formData.hsk} onChange={e=>setFormData({...formData, hsk:e.target.value})} style={{...inputStyle, cursor: "pointer"}}>
                      {[1,2,3,4,5,6].map(lvl => <option key={lvl} value={lvl} style={{background:'#181818'}}>Уровень HSK {lvl}</option>)}
                    </select>
                  </div>

                  <button type="submit" disabled={isSubmitting} className={styles.primaryBtn} style={{ justifyContent: "center", padding: "16px", marginTop: "10px", fontSize: "15px", borderRadius: "14px" }}>
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} Добавить в базу
                  </button>
                </form>
              </div>
            </aside>

            <main>
              <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: "0.1s", padding: "32px", minHeight: "600px" }}>
                <div className={styles.cardLabel} style={{ fontSize: "12px", marginBottom: "24px" }}>Облачная база слов</div>
                
                {loading ? (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Загрузка...</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {words.map((w) => (
                      <div key={w.id} style={{ display: "grid", gridTemplateColumns: "80px 120px 1fr 80px 50px", alignItems: "center", gap: 20, background: "rgba(255,255,255,0.03)", padding: "16px 24px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                        
                        <div style={{ fontFamily:"'Noto Serif SC',serif", fontSize: 32, color: "white" }}>{w.h}</div>
                        <div style={{ color: "#E74C3C", fontWeight: 600, fontSize: "16px", letterSpacing: "0.5px" }}>{w.p}</div>
                        
                        <div>
                          <div style={{ color: "white", fontSize: "15px", marginBottom: "4px" }}>{w.ru}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{w.uz} <span style={{margin: "0 6px", opacity: 0.5}}>|</span> {w.en}</div>
                        </div>

                        <div>
                          <span style={{ fontSize:"11px", fontWeight:700, padding:"6px 12px", borderRadius:"20px", background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.2)", color:"#D4A017" }}>
                            HSK {w.hsk}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifySelf: "flex-end" }}>
                          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(w.id)} style={{ background: "none", border: "none", color: "rgba(232,112,96,0.6)", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color="#E87060"} onMouseLeave={e=>e.currentTarget.style.color="rgba(232,112,96,0.6)"}><Trash2 size={18} /></button>
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
          <div className={`${styles.card} ${styles.animUp}`} style={{ padding: "32px" }}>
            <div className={styles.cardLabel} style={{ fontSize: "12px", marginBottom: "24px" }}>Список студентов ({students.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {students.map((st, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr 120px 100px", alignItems: "center", gap: 20, background: "rgba(255,255,255,0.03)", padding: "16px 24px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  
                  {st.photoURL ? (
                    <img src={st.photoURL} style={{ width:48, height:48, borderRadius:'50%', border: st.role === 'admin' ? '2px solid #D4A017' : 'none' }} alt="ava" />
                  ) : (
                    <div style={{width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#C0392B,#D4A017)', display:"flex", alignItems:"center", justifyContent:"center", fontWeight: "bold", fontSize: "18px", color: "white"}}>{st.name?.charAt(0)}</div>
                  )}

                  <div>
                    <div style={{ color: "white", fontWeight: "bold", fontSize: "16px", marginBottom: "2px" }}>
                      {st.name} 
                      {st.role === 'admin' && <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"12px", background:"rgba(212,160,23,0.15)", color:"#D4A017", marginLeft: "10px", verticalAlign: "middle" }}>АДМИН</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{st.email} • Зарегистрирован(а): {new Date(st.joinDate).toLocaleDateString('ru-RU')}</div>
                  </div>

                  <div style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>
                    <span style={{ color: "#D4A017", marginRight: "6px" }}>⭐</span> {st.xp?.toLocaleString()} XP
                  </div>

                  <div>
                    <span style={{ fontSize:"12px", fontWeight:700, padding:"6px 12px", borderRadius:"20px", background:"rgba(126,200,154,0.1)", border:"1px solid rgba(126,200,154,0.2)", color:"#7EC89A" }}>
                      HSK {st.hskLevel}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}