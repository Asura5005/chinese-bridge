'use client'
import { useState, useEffect } from "react";
import Link from 'next/link';
import styles from '@/styles/Dashboard.module.css';
import TopNav from '@/components/UI/TopNav';
import { useAuth } from '@/lib/AuthContext';
import LockOverlay from '@/components/UI/LockOverlay';

// Импортируем Firebase для настоящего рейтинга
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// ══════════════════════════════════════════
// PALETTE (Оставлена без изменений)
// ══════════════════════════════════════════
const C = {
    crimson: "#C0392B", crimsonL: "#E74C3C", gold: "#D4A017", goldL: "#F0C040", sage: "#5D8A6E", sageL: "#7EC89A",
    ink: "#0A0A0A", ink2: "#111111", ink3: "#181818", paper: "#FAF7F2", dim: "rgba(255,255,255,0.07)", muted: "rgba(255,255,255,0.35)",
};
const HSK_COLORS = ["", "#7EC89A", "#60B4D0", "#D4A017", "#E8A060", "#E74C3C", "#C0392B"];

// ══════════════════════════════════════════
// COMPONENTS (Оставлены без изменений)
// ══════════════════════════════════════════
function HeatCell({ val }) {
    const colors = ["rgba(255,255,255,.05)", "rgba(93,138,110,.3)", "rgba(93,138,110,.55)", "rgba(93,138,110,.8)", "#7EC89A"];
    return <div className={styles.heatmapCell} style={{ background: colors[val] }} />;
}

function RingProgress({ pct, size = 90, stroke = 7, color = C.crimson, label }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} className={styles.ringSvg}>
                <circle className={styles.ringBg} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
                <circle className={styles.ringFill} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={color} strokeDasharray={circ} style={{ "--offset": offset, strokeDashoffset: offset }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: size < 80 ? 16 : 20, fontWeight: 900, color: "white", lineHeight: 1 }}>{pct}%</div>
                {label && <div style={{ fontSize: 9, color: C.muted, marginTop: 2, letterSpacing: .5 }}>{label}</div>}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════
// SECTIONS (ТЕПЕРЬ С НАСТОЯЩИМИ ДАННЫМИ)
// ══════════════════════════════════════════
function ProfileHeader({ user, userData }) {
    // Используем НАСТОЯЩИЕ данные из Firebase
    const name = userData?.name || user?.displayName || "Студент";
    const email = userData?.email || user?.email || "";
    const xp = userData?.xp || 0;
    const streak = userData?.streak || 0;
    const hskLevel = userData?.hskLevel || 1;
    const goal = userData?.goal || "Изучение языка";
    const joinDate = userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }) : "Недавно";

    // Динамический опыт до следующего уровня
    const xpNext = hskLevel * 150 * 100;
    const xpPct = Math.min(Math.round((xp / xpNext) * 100), 100);

    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ background: `linear-gradient(135deg,${C.ink2},${C.ink3})`, position: "relative", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ position: "absolute", right: -30, top: -30, fontFamily: "'Noto Serif SC',serif", fontSize: 180, color: "rgba(255,255,255,.025)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>桥</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, position: "relative", zIndex: 1, flexWrap: "wrap" }}>

                <div style={{ position: "relative" }}>
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" style={{ width: 72, height: 72, borderRadius: "50%", boxShadow: "0 8px 24px rgba(192,57,43,.4)", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,#C0392B,#D4A017)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "white", boxShadow: "0 8px 24px rgba(192,57,43,.4)" }}>
                            {name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: C.ink2, border: `2px solid ${C.ink2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🔥</div>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, letterSpacing: -.5 }}>{name}</div>
                        <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(192,57,43,.2)", color: C.crimsonL, fontSize: 11, fontWeight: 700, border: `1px solid rgba(192,57,43,.35)` }}>HSK {hskLevel}</span>
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
                        {[[email, ""], ["🎯 " + goal, ""], ["📅 С " + joinDate, ""]].map(([v], i) => (
                            <span key={i} style={{ fontSize: 13, color: C.muted }}>{v}</span>
                        ))}
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 5 }}>
                            <span>Опыт до HSK {hskLevel + 1}</span>
                            <span style={{ color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{xp.toLocaleString()} / {xpNext.toLocaleString()} XP</span>
                        </div>
                        <div className={styles.xpBarOuter} style={{ width: "100%", maxWidth: 360 }}>
                            <div className={styles.xpBarInner} style={{ "--w": `${xpPct}%` }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[[streak, "🔥", "Серия"], [xp.toLocaleString(), "⭐", "Опыт"], [0, "📚", "Слов"]].map(([v, ic, l]) => (
                        <div key={l} style={{ textAlign: "center", background: C.ink3, border: `1px solid ${C.dim}`, borderRadius: 14, padding: "14px 18px" }}>
                            <div style={{ fontSize: 22 }}>{ic}</div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "white", marginTop: 2 }}>{v}</div>
                            <div style={{ fontSize: 10, color: C.muted, letterSpacing: .5, marginTop: 1 }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20, position: "relative", zIndex: 1 }}>
                <Link href="/trainer" className={styles.primaryBtn}>🎯 Начать тренировку</Link>
                <button className={styles.ghostBtn}>✏️ Редактировать профиль</button>
            </div>
        </div>
    );
}

function HskProgressSection({ hskLevel }) {
    // Настоящая генерация прогресса на основе текущего уровня юзера
    const progress = [1, 2, 3, 4, 5, 6].map(n => {
        if (n < hskLevel) return { n, total: 150 * n, learned: 150 * n, pct: 100 };
        if (n === hskLevel) return { n, total: 150 * n, learned: 0, pct: 0 }; // Позже привяжем к словам
        return { n, total: 150 * n, learned: 0, pct: 0 };
    });

    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".05s" }}>
            <div className={styles.cardLabel}>Прогресс HSK</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {progress.map(({ n, total, learned, pct }) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <RingProgress pct={pct} size={52} stroke={5} color={HSK_COLORS[n]} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: 14, color: HSK_COLORS[n] }}>HSK {n}</span>
                                <span style={{ fontSize: 12, color: C.muted }}>{learned} / {total} слов</span>
                            </div>
                            <div style={{ height: 5, background: "rgba(255,255,255,.06)", borderRadius: 5, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: HSK_COLORS[n], borderRadius: 5, transition: "width .6s ease", opacity: .85 }} />
                            </div>
                            {pct === 100 && <div style={{ fontSize: 11, color: C.sageL, marginTop: 3 }}>✓ Завершён</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HeatmapSection() {
    const months = ["Сент", "Окт", "Нояб", "Дек", "Янв", "Фев", "Март", "Апр"];
    const days = ["Пн", "", "Ср", "", "Пт", "", ""];
    const [heatmap, setHeatmap] = useState([]);

    // Настоящая пустая карта (пока нет активности)
    useEffect(() => {
        setHeatmap(Array.from({ length: 15 }, () => Array.from({ length: 7 }, () => 0)));
    }, []);

    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".1s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Активность</div>
                <div style={{ fontSize: 12, color: C.muted }}><span style={{ color: C.sageL, fontWeight: 700 }}>0</span> дней активности</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 18 }}>
                    {days.map((d, i) => <div key={i} style={{ height: 12, fontSize: 9, color: C.muted, lineHeight: "12px" }}>{d}</div>)}
                </div>
                <div style={{ flex: 1, overflowX: "auto" }}>
                    <div style={{ display: "flex", marginBottom: 4 }}>
                        {months.map((m, i) => <div key={i} style={{ flex: 1, fontSize: 9, color: C.muted, letterSpacing: .3 }}>{m}</div>)}
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                        {heatmap.map((week, wi) => (
                            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                {week.map((val, di) => <HeatCell key={di} val={val} />)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, color: C.muted }}>Меньше</span>
                {[0, 1, 2, 3, 4].map(v => <HeatCell key={v} val={v} />)}
                <span style={{ fontSize: 10, color: C.muted }}>Больше</span>
            </div>
        </div>
    );
}

function WeeklyChart() {
    // Настоящий пустой график
    const data = [
        { day: "Пн", words: 0 }, { day: "Вт", words: 0 }, { day: "Ср", words: 0 },
        { day: "Чт", words: 0 }, { day: "Пт", words: 0 }, { day: "Сб", words: 0 }, { day: "Вс", words: 0 },
    ];

    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Эта неделя</div>
                <div style={{ fontSize: 12, color: C.muted }}>Итого: <span style={{ color: "white", fontWeight: 700 }}>0 слов</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                {data.map(({ day, words }, i) => {
                    const isToday = i === new Date().getDay() - 1; // Подсветка реального сегодня
                    return (
                        <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ fontSize: 10, color: isToday ? "white" : C.muted, fontWeight: isToday ? 700 : 400 }}>{words}</div>
                            <div style={{ width: "100%", height: 3, borderRadius: "4px 4px 0 0", background: isToday ? `linear-gradient(to top,${C.crimson},${C.gold})` : "rgba(255,255,255,.1)", transition: "height .4s ease" }} />
                            <div style={{ fontSize: 10, color: isToday ? C.crimsonL : C.muted, fontWeight: isToday ? 700 : 400 }}>{day}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AchievementsSection() {
    const ACHIEVEMENTS = [
        { icon: "🔥", name: "Первый шаг", desc: "Зарегистрировался", earned: true },
        { icon: "🏆", name: "HSK 1 завершён", desc: "150/150 слов", earned: false },
        { icon: "⚡", name: "Молния", desc: "10 верных подряд", earned: false },
        { icon: "🎯", name: "Снайпер", desc: "100% в тесте", earned: false },
    ];

    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Достижения</div>
                <span style={{ fontSize: 12, color: C.muted }}>{ACHIEVEMENTS.filter(a => a.earned).length} / 8</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {ACHIEVEMENTS.map(a => (
                    <div key={a.name} className={`${styles.achievement} ${a.earned ? styles.earned : styles.locked}`}>
                        <div style={{ fontSize: 26 }}>{a.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: a.earned ? "white" : C.muted, lineHeight: 1.2, textAlign: 'center' }}>{a.name}</div>
                        <div style={{ fontSize: 10, color: C.muted, textAlign: 'center' }}>{a.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LeaderboardSection({ currentUserUid }) {
    const [leaderboard, setLeaderboard] = useState([]);

    // Настоящая загрузка рейтинга из Firebase
    useEffect(() => {
        const fetchLeaders = async () => {
            const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
            const snap = await getDocs(q);
            const users = snap.docs.map((doc, i) => {
                const data = doc.data();
                return {
                    rank: i + 1,
                    name: data.name || "Студент",
                    avatar: data.photoURL || null,
                    letter: (data.name || "С").charAt(0).toUpperCase(),
                    grad: `linear-gradient(135deg, ${C.crimson}, ${C.gold})`,
                    xp: data.xp || 0,
                    streak: data.streak || 0,
                    hsk: data.hskLevel || 1,
                    isMe: data.uid === currentUserUid
                }
            });
            setLeaderboard(users);
        };
        fetchLeaders();
    }, [currentUserUid]);

    const rankIcon = (r) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;

    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".25s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Рейтинг группы</div>
                <button className={styles.ghostBtn} style={{ padding: "6px 12px", fontSize: 11 }}>Все →</button>
            </div>

            {leaderboard.length === 0 && <div style={{ textAlign: 'center', color: C.muted, padding: "20px 0", fontSize: 13 }}>Загрузка рейтинга...</div>}

            {leaderboard.map((s, i) => (
                <div key={s.rank} className={`${styles.leaderboardRow} ${s.isMe ? styles.me : ""}`} style={{ animationDelay: `${i * .05}s` }}>
                    <div style={{ fontSize: s.rank <= 3 ? 20 : 13, fontWeight: 700, minWidth: 32, textAlign: "center", color: s.rank <= 3 ? "white" : C.muted }}>{rankIcon(s.rank)}</div>

                    {s.avatar ? (
                        <img src={s.avatar} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, boxShadow: s.isMe ? "0 0 0 2px #C0392B" : "none", objectFit: "cover" }} alt="ava" />
                    ) : (
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, color: "white", boxShadow: s.isMe ? "0 0 0 2px #C0392B" : "none" }}>{s.letter}</div>
                    )}

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{s.name} {s.isMe && <span style={{ fontSize: 10, color: C.crimsonL, fontWeight: 700 }}>· ТЫ</span>}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>🔥 {s.streak} дней</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `rgba(${['', '93,138,110', '96,180,208', '212,160,23'][s.hsk] || '212,160,23'},0.15)`, color: HSK_COLORS[s.hsk] }}>HSK {s.hsk}</span>
                    <div style={{ textAlign: "right", minWidth: 60 }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: s.isMe ? C.gold : "rgba(255,255,255,.7)" }}>{s.xp.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>XP</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RecentSessions() {
    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Последние сессии</div>
                <button className={styles.ghostBtn} style={{ padding: "6px 12px", fontSize: 11 }}>История →</button>
            </div>
            <div className={styles.sessionRow} style={{ marginBottom: 6 }}>
                {["ДАТА", "РЕЖИМ", "СЛОВ", "ВЕРНО", "ВРЕМЯ", "HSK"].map(h => <div key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" }}>{h}</div>)}
            </div>
            {/* Настоящее пустое состояние */}
            <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                У тебя пока нет завершенных сессий. <br />Перейди в Тренажёр, чтобы начать!
            </div>
        </div>
    );
}

function WordsToReview() {
    return (
        <div className={`${styles.card} ${styles.animUp}`} style={{ animationDelay: ".35s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Нужно повторить</div>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(192,57,43,.15)", color: C.crimsonL, fontWeight: 700 }}>0 слов</span>
            </div>

            <div style={{ padding: "30px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                Нет слов для повторения. <br />Отличная работа!
            </div>

            <Link href="/trainer" style={{ textDecoration: 'none' }}>
                <button className={styles.primaryBtn} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                    🎯 Учить новые слова
                </button>
            </Link>
        </div>
    );
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════
export default function UserDashboard() {
    const [tab, setTab] = useState("overview");
    const { user, userData } = useAuth(); // НАСТОЯЩИЙ ЮЗЕР ИЗ FIREBASE

    return (
        <div className={styles.db}>
            <TopNav />
            {/* Оборачиваем контент в relative div для наложения замочка */}
            <div style={{ position: 'relative', minHeight: 'calc(100vh - 52px)' }}>

                {/* Если не залогинен - показываем замочек поверх */}
                {!user && <LockOverlay title="Профиль закрыт" />}

                {/* А сам контент блюрим, если юзера нет */}
                <div style={{
                    maxWidth: 1100, margin: "0 auto", padding: "28px 20px",
                    filter: !user ? 'blur(8px)' : 'none',
                    pointerEvents: !user ? 'none' : 'auto',
                    opacity: !user ? 0.6 : 1,
                    transition: 'all 0.4s ease'
                }}>

                    <ProfileHeader user={user} userData={userData} />

                    <div className={styles.tabRow}>
                        {[{ id: "overview", label: "Обзор" }, { id: "progress", label: "Прогресс" }, { id: "rating", label: "Рейтинг" }, { id: "history", label: "История" }].map(t => (
                            <button key={t.id} className={`${styles.navPill} ${tab === t.id ? styles.activePill : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
                        ))}
                    </div>

                    {tab === "overview" && (
                        <div>
                            <HeatmapSection />
                            <div style={{ height: 16 }} />
                            <div className={styles.dbGrid3}>
                                <WeeklyChart />
                                <WordsToReview />
                                <AchievementsSection />
                            </div>
                        </div>
                    )}

                    {tab === "progress" && (
                        <div className={styles.dbGrid2}>
                            <HskProgressSection hskLevel={userData?.hskLevel || 1} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <WeeklyChart />
                                <div className={`${styles.card} ${styles.animUp}`}>
                                    <div className={styles.cardLabel}>Статистика по режимам</div>
                                    {/* Заглушка, так как статистика пока не пишется в базу */}
                                    {[["🎯 Тест", "0%", C.crimson], ["🃏 Карточки", "0%", C.sageL], ["💬 Диалог", "0%", C.gold], ["✍️ Ввод", "0%", "#E8A060"]].map(([mode, acc, col]) => (
                                        <div key={mode} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                            <div style={{ minWidth: 100, fontSize: 13, color: "rgba(255,255,255,.7)" }}>{mode}</div>
                                            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.06)", borderRadius: 6, overflow: "hidden" }}><div style={{ height: "100%", width: acc, background: col, borderRadius: 6 }} /></div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: col, minWidth: 36, textAlign: "right" }}>{acc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "rating" && (
                        <div className={styles.dbGrid2Rating}>
                            <LeaderboardSection currentUserUid={user?.uid} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div className={`${styles.card} ${styles.animUp}`}>
                                    <div className={styles.cardLabel}>Твоя позиция</div>
                                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 64, fontWeight: 900, color: C.gold, lineHeight: 1 }}>—</div>
                                        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Рейтинг скоро обновится</div>
                                        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 20 }}>
                                            <div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "white" }}>{userData?.xp || 0}</div><div style={{ fontSize: 11, color: C.muted }}>XP</div></div>
                                            <div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: C.crimsonL }}>{userData?.streak || 0}</div><div style={{ fontSize: 11, color: C.muted }}>Серия</div></div>
                                        </div>
                                    </div>
                                </div>
                                <AchievementsSection />
                            </div>
                        </div>
                    )}

                    {tab === "history" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <RecentSessions />
                            <HeatmapSection />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}