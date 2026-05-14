'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cursor from '@/components/UI/Cursor';
import { translations } from '@/lib/i18n';
import styles from '@/styles/Landing.module.css';
import { useAuth } from '@/lib/AuthContext';
const HERO_WORDS = [
    { hanzi: '学习', pinyin: 'xuéxí', ru: 'учиться', uz: "o'rganmoq", en: 'to study' },
    { hanzi: '朋友', pinyin: 'péngyou', ru: 'друг', uz: "do'st", en: 'friend' },
    { hanzi: '明天', pinyin: 'míngtiān', ru: 'завтра', uz: 'ertaga', en: 'tomorrow' },
    { hanzi: '你好', pinyin: 'nǐ hǎo', ru: 'привет', uz: 'salom', en: 'hello' },
    { hanzi: '银行', pinyin: 'yínháng', ru: 'банк', uz: 'bank', en: 'bank' },
];

const TESTIMONIALS = [
    { text: '"Наконец-то платформа где всё на русском и с узбекским переводом. Тоны стало намного легче запоминать с аудио."', author: "Азиз Рахимов", role: "Студент, Ташкент", initial: "А", bg: "var(--crimson)", col: "white" },
    { text: '"Как преподаватель — AdminPanel просто мечта. Добавляю новые слова за минуту, студенты сразу видят их в тестах."', author: "Мария Соколова", role: "Преподаватель, МГУ", initial: "М", bg: "var(--sage)", col: "white" },
    { text: '"Рисовать иероглифы пальцем — это гениально. Теперь я действительно их запоминаю, а не только читаю пиньинь."', author: "Сара Ли", role: "Студентка, Алматы", initial: "С", bg: "var(--gold)", col: "var(--ink)" },
    { text: '"График прогресса мотивирует не пропускать ни дня. Серия в 30 дней — мой личный рекорд благодаря этой платформе!"', author: "Даврон Юсупов", role: "Студент, Самарканд", initial: "Д", bg: "#60B4D0", col: "white" },
    { text: '"Режим соревнований с однокурсниками — это то что заставляет учиться каждый день. Хочу быть первым в рейтинге!"', author: "Камила Назарова", role: "Студентка, Бухара", initial: "К", bg: "#E8A060", col: "white" }
];

export default function Landing() {
    const [lang, setLang] = useState('ru');
    const t = translations[lang] || translations.ru;
const { user, isAdmin } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [heroWordIdx, setHeroWordIdx] = useState(0);
    const [heroOpacity, setHeroOpacity] = useState(1);
    const [phoneIdx, setPhoneIdx] = useState(0);

    const phoneWords = [
        { hanzi: '你好', pinyin: 'nǐ hǎo' },
        { hanzi: '谢谢', pinyin: 'xièxie' },
        { hanzi: '银行', pinyin: 'yínháng' },
    ];

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeroOpacity(0);
            setTimeout(() => {
                setHeroWordIdx((prev) => (prev + 1) % HERO_WORDS.length);
                setHeroOpacity(1);
            }, 300);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhoneIdx((prev) => (prev + 1) % phoneWords.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const heroWord = HERO_WORDS[heroWordIdx];
    const phoneWord = phoneWords[phoneIdx];

    return (
        <>
            <Cursor />

            {/* NAVBAR */}
            <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoHanzi}>桥</span>
          <span className={styles.logoText}>ChineseBridge</span>
        </Link>
        <ul className={styles.navLinks}>
          <li><a href="#features">{t['nav.features']}</a></li>
          <li><a href="#hsk">{t['nav.levels']}</a></li>
          <li><a href="#about">{t['nav.about']}</a></li>
          {/* Админка показывается ТОЛЬКО тебе */}
          {isAdmin && <li><Link href="/admin-panel" style={{ color: '#D4A017' }}>⚙️ {t['nav.admin']}</Link></li>}
        </ul>
        <div className={styles.navRight}>
          <div className={styles.langSwitcher}>
            {['ru', 'uz', 'en', 'zh'].map(l => (
              <button key={l} className={`${styles.langBtn} ${lang === l ? styles.activeLang : ''}`} onClick={() => setLang(l)}>
                {l === 'zh' ? '中' : l.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Если вошел в аккаунт — показываем аватарку вместо кнопки "Начать" */}
          {user ? (
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src={user.photoURL} alt="Профиль" style={{ width: 40, height: 40, borderRadius: '50%', border: isAdmin ? '2px solid #D4A017' : '2px solid #C0392B' }} />
            </Link>
          ) : (
            <Link href="/login" className={styles.navCta}>{t['nav.start']}</Link>
          )}
        </div>
      </nav>

            {/* HERO */}
            <section className={styles.hero}>
                <div className={styles.heroBg}>
                    <div className={styles.heroBgGrid}></div>
                    <div className={`${styles.heroBgCircle} ${styles.circle1}`}></div>
                    <div className={`${styles.heroBgCircle} ${styles.circle2}`}></div>
                    <div className={`${styles.heroBgCircle} ${styles.circle3}`}></div>
                </div>

                <div className={styles.heroLeft}>
                    <div className={styles.heroEyebrow}>
                        <span className={styles.heroEyebrowDot}></span>
                        <span>{t['hero.eyebrow']}</span>
                    </div>
                    <h1 className={styles.heroTitle}>
                        {t['hero.title1']}<br />
                        <span className={styles.heroTitleAccent}>{t['hero.title2']}</span> {t['hero.title3']}
                        <span className={styles.heroHanziInline}>学 • 练 • 说</span>
                    </h1>
                    <p className={styles.heroSub} dangerouslySetInnerHTML={{ __html: t['hero.sub'] }}></p>

                    <div className={styles.heroActions}>
                        <Link href="/trainer" className={styles.btnPrimary}>
                            <span>{t['hero.cta1']}</span> <span>→</span>
                        </Link>
                        <a href="#features" className={styles.btnSecondary}>
                            <span>▶</span> <span>{t['hero.cta2']}</span>
                        </a>
                    </div>

                    <div className={styles.heroStats}>
                        <div><div className={styles.statNum}>80<span>+</span></div><div className={styles.statLabel}>{t['stats.words']}</div></div>
                        <div><div className={styles.statNum}>6</div><div className={styles.statLabel}>{t['stats.levels']}</div></div>
                        <div><div className={styles.statNum}>4</div><div className={styles.statLabel}>{t['stats.langs']}</div></div>
                    </div>
                </div>

                <div className={styles.heroRight}>
                    <div className={styles.heroCardWrap}>
                        <div className={`${styles.floatBadge} ${styles.floatBadge1}`}>🏆 HSK 2 пройден!</div>
                        <div className={`${styles.floatBadge} ${styles.floatBadge2}`}>🔊 Аудио произношение</div>
                        <div className={styles.heroCard}>
                            <div className={styles.hcLabel}>КАРТОЧКА ДНЯ</div>
                            <div style={{ opacity: heroOpacity, transition: 'opacity 0.3s' }}>
                                <div className={styles.hcHanzi}>{heroWord.hanzi}</div>
                                <div className={styles.hcPinyin}>{heroWord.pinyin}</div>
                                <div className={styles.hcTranslations}>
                                    <span className={`${styles.hcTag} ${styles.tagRu}`}>{heroWord.ru}</span>
                                    <span className={`${styles.hcTag} ${styles.tagUz}`}>{heroWord.uz}</span>
                                    <span className={`${styles.hcTag} ${styles.tagEn}`}>{heroWord.en}</span>
                                </div>
                            </div>
                            <div className={styles.hcProgress}>
                                <div className={styles.hcProgressLabel}><span>Прогресс сегодня</span><span>72%</span></div>
                                <div className={styles.hcBar}><div className={styles.hcBarFill}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className={`${styles.section} ${styles.featuresSection}`}>
                <div className={`${styles.featuresHeader} reveal`}>
                    <div className={styles.sectionEyebrow}>{t['feat.eyebrow']}</div>
                    <h2 className={styles.sectionTitle}>Всё что нужно для<br /><em>настоящего прогресса</em></h2>
                    <p className={styles.sectionSub}>Каждая функция спроектирована так, чтобы максимально ускорить запоминание и сделать учёбу приятной.</p>
                </div>
                <div className={styles.featuresGrid}>
                    {/* F1 */}
                    <div className={`${styles.featureCard} reveal`}>
                        <div className={styles.featureIcon}>🎯</div>
                        <div className={styles.featureTitle}>Умные тесты</div>
                        <div className={styles.featureDesc}>Алгоритм интервального повторения — слова появляются именно тогда, когда их нужно повторить. Четыре формата: выбор, ввод, карточки, аудио.</div>
                        <div className={styles.featureTag}>SPACED REPETITION</div>
                    </div>
                    {/* F2 */}
                    <div className={`${styles.featureCard} reveal`} style={{ transitionDelay: '0.1s' }}>
                        <div className={styles.featureIcon} style={{ background: 'rgba(212,160,23,0.15)' }}>✍️</div>
                        <div className={styles.featureTitle}>Рукопись иероглифов</div>
                        <div className={styles.featureDesc}>Рисуй иероглифы пальцем на телефоне — система проверяет правильность каждого штриха с анимацией и подсказками.</div>
                        <div className={styles.featureTag}>HANZIWRITER</div>
                    </div>
                    {/* F3 */}
                    <div className={`${styles.featureCard} reveal`} style={{ transitionDelay: '0.2s' }}>
                        <div className={styles.featureIcon} style={{ background: 'rgba(93,138,110,0.15)' }}>🔊</div>
                        <div className={styles.featureTitle}>Аудио произношение</div>
                        <div className={styles.featureDesc}>Озвучка каждого слова носителем языка. Тренировка тонов — самая сложная часть китайского, теперь с визуализацией.</div>
                        <div className={styles.featureTag}>NATIVE AUDIO</div>
                    </div>
                    {/* F4 */}
                    <div className={`${styles.featureCard} reveal`} style={{ transitionDelay: '0.1s' }}>
                        <div className={styles.featureIcon} style={{ background: 'rgba(192,57,43,0.15)' }}>📊</div>
                        <div className={styles.featureTitle}>Аналитика прогресса</div>
                        <div className={styles.featureDesc}>Графики активности, тепловая карта дней, история ошибок и сильных сторон. Студент видит реальный рост.</div>
                        <div className={styles.featureTag}>DASHBOARD</div>
                    </div>
                    {/* F5 */}
                    <div className={`${styles.featureCard} reveal`} style={{ transitionDelay: '0.2s' }}>
                        <div className={styles.featureIcon} style={{ background: 'rgba(212,160,23,0.15)' }}>🏆</div>
                        <div className={styles.featureTitle}>Рейтинг и соревнования</div>
                        <div className={styles.featureDesc}>Таблица лидеров группы, недельные челленджи, достижения — учёба превращается в игру с реальной мотивацией.</div>
                        <div className={styles.featureTag}>GAMIFICATION</div>
                    </div>
                    {/* F6 */}
                    <div className={`${styles.featureCard} reveal`} style={{ transitionDelay: '0.3s' }}>
                        <div className={styles.featureIcon} style={{ background: 'rgba(93,138,110,0.15)' }}>⚙️</div>
                        <div className={styles.featureTitle}>Панель администратора</div>
                        <div className={styles.featureDesc}>Преподаватель добавляет слова, иероглифы и диалоги прямо через удобный интерфейс. Без программирования.</div>
                        <div className={styles.featureTag}>ADMIN PANEL</div>
                    </div>
                </div>
            </section>

            {/* HSK LEVELS */}
            <section id="hsk" className={`${styles.section} ${styles.hskSection}`}>
                <div className={styles.hskLayout}>
                    <div className="reveal">
                        <div className={styles.sectionEyebrow}>{t['hsk.eyebrow']}</div>
                        <h2 className={styles.sectionTitle}>Система уровней<br /><em>HSK 1–6</em></h2>
                        <p className={styles.sectionSub}>{t['hsk.sub']}</p>
                        <div className={styles.hskLevels}>
                            <div className={styles.hskLevel}>
                                <div className={styles.hskBadge} style={{ color: '#7EC89A' }}>HSK 1</div>
                                <div><div className={styles.hskInfoName}>Начальный</div><div className={styles.hskInfoDesc}>Базовые слова и приветствия</div></div>
                                <div className={styles.hskWords}>150 слов</div>
                            </div>
                            <div className={styles.hskLevel}>
                                <div className={styles.hskBadge} style={{ color: '#60B4D0' }}>HSK 2</div>
                                <div><div className={styles.hskInfoName}>Элементарный</div><div className={styles.hskInfoDesc}>Повседневные ситуации</div></div>
                                <div className={styles.hskWords}>300 слов</div>
                            </div>
                            <div className={styles.hskLevel}>
                                <div className={styles.hskBadge} style={{ color: 'var(--gold)' }}>HSK 3</div>
                                <div><div className={styles.hskInfoName}>Средний</div><div className={styles.hskInfoDesc}>Учёба и работа</div></div>
                                <div className={styles.hskWords}>600 слов</div>
                            </div>
                            <div className={styles.hskLevel}>
                                <div className={styles.hskBadge} style={{ color: '#E8A060' }}>HSK 4</div>
                                <div><div className={styles.hskInfoName}>Выше среднего</div><div className={styles.hskInfoDesc}>Широкий спектр тем</div></div>
                                <div className={styles.hskWords}>1200 слов</div>
                            </div>
                            <div className={styles.hskLevel}>
                                <div className={styles.hskBadge} style={{ color: 'var(--crimson-light)' }}>HSK 5</div>
                                <div><div className={styles.hskInfoName}>Продвинутый</div><div className={styles.hskInfoDesc}>Чтение газет и книг</div></div>
                                <div className={styles.hskWords}>2500 слов</div>
                            </div>
                            <div className={styles.hskLevel}>
                                <div className={styles.hskBadge} style={{ color: 'var(--crimson)' }}>HSK 6</div>
                                <div><div className={styles.hskInfoName}>Профессиональный</div><div className={styles.hskInfoDesc}>Свободное владение</div></div>
                                <div className={styles.hskWords}>5000+ слов</div>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.hskMockup} reveal`} style={{ transitionDelay: '0.2s' }}>
                        <div className={styles.phone}>
                            <div className={styles.phoneNotch}></div>
                            <div className={styles.phoneQuizWord}>{phoneWord.hanzi}</div>
                            <div className={styles.phoneQuizPinyin}>{phoneWord.pinyin}</div>
                            <div className={styles.phoneQuizQ}>→ Выбери перевод</div>
                            <div className={styles.phoneOpts}>
                                <div className={`${styles.phoneOpt} ${styles.phoneOptSelected}`}>Привет</div>
                                <div className={styles.phoneOpt}>До свидания</div>
                                <div className={styles.phoneOpt}>Спасибо</div>
                                <div className={styles.phoneOpt}>Да</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS (Бегущая строка) */}
            <section id="about" className={`${styles.section} ${styles.testimonialsSection}`}>
                <div className={`${styles.testimonialsHeader} reveal`}>
                    <div className={styles.sectionEyebrow}>{t['testi.eyebrow']}</div>
                    <h2 className={styles.sectionTitle}>Что говорят<br /><em>студенты</em></h2>
                </div>
                <div style={{ overflow: 'hidden', margin: '0 -48px' }}>
                    <div className={styles.testimonialsTrack}>
                        {/* Дублируем массив 2 раза для плавной бесконечной анимации */}
                        {[...TESTIMONIALS, ...TESTIMONIALS].map((item, i) => (
                            <div key={i} className={styles.testiCard}>
                                <div className={styles.testiStars}>★★★★★</div>
                                <div className={styles.testiText}>{item.text}</div>
                                <div className={styles.testiAuthor}>
                                    <div className={styles.testiAvatar} style={{ background: item.bg, color: item.col }}>{item.initial}</div>
                                    <div><div className={styles.testiName}>{item.author}</div><div className={styles.testiRole}>{item.role}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* UNIVERSITIES */}
            <section className={styles.univSection}>
                <div className={styles.univTitle}>{t['univ.title']}</div>
                <div className={styles.univLogos}>
                    <div className={styles.univLogo}>北京大学</div>
                    <div className={styles.univLogo}>ТАШГИВ</div>
                    <div className={styles.univLogo}>МГУ</div>
                    <div className={styles.univLogo}>復旦大學</div>
                    <div className={styles.univLogo}>РУДН</div>
                    <div className={styles.univLogo}>清华大学</div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.ctaSection}>
                <div className="reveal">
                    <h2 className={styles.ctaTitle}>Готов начать учить<br /><em>китайский</em> сегодня?</h2>
                    <p className={styles.ctaSub}>{t['cta.sub']}</p>
                    <div className={styles.ctaActions}>
                        <Link href="/trainer" className={styles.btnPrimary} style={{ fontSize: '17px', padding: '18px 40px' }}>
                            <span>{t['cta.btn1']}</span> <span>→</span>
                        </Link>
                        <a href="#" className={styles.btnSecondary} style={{ fontSize: '17px', padding: '17px 36px' }}>
                            <span>{t['cta.btn2']}</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className={styles.footer}>
                <div className={styles.footerGrid}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: '28px', color: 'var(--crimson)' }}>桥</span>
                            <span className={styles.logoText}>ChineseBridge</span>
                        </div>
                        <p className={styles.footerDesc}>Платформа для изучения китайского языка для русско- и узбекоязычных студентов. Создана с любовью к языку и технологиям.</p>
                    </div>
                    <div>
                        <div className={styles.footerColTitle}>ПЛАТФОРМА</div>
                        <ul className={styles.footerLinks}>
                            <li><Link href="/trainer">Тренажёр</Link></li>
                            <li><Link href="#hsk">Уровни HSK</Link></li>
                            <li><Link href="#features">Возможности</Link></li>
                        </ul>
                    </div>
                    <div>
                        <div className={styles.footerColTitle}>АККАУНТ</div>
                        <ul className={styles.footerLinks}>
                            <li><a href="#">Регистрация</a></li>
                            <li><a href="#">Вход</a></li>
                            <li><Link href="/admin-panel">Админ-панель</Link></li>
                        </ul>
                    </div>
                    <div>
                        <div className={styles.footerColTitle}>КОНТАКТЫ</div>
                        <ul className={styles.footerLinks}>
                            <li><a href="#">hello@chinesebridge.app</a></li>
                            <li><a href="#">Telegram</a></li>
                            <li><a href="#">Instagram</a></li>
                            <li><a href="#">GitHub</a></li>
                        </ul>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <span>© 2026 ChineseBridge. All rights reserved.</span>
                    <span style={{ fontFamily: "'Noto Serif SC',serif", fontSize: '18px', color: 'rgba(192,57,43,0.5)' }}>学无止境</span>
                    <span>Сделано с ❤️ для студентов</span>
                </div>
            </footer>
        </>
    );
}