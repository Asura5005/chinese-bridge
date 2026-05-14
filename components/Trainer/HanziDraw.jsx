'use client'
import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';

export default function HanziDraw({ character, onComplete }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Очищаем контейнер при смене иероглифа
    containerRef.current.innerHTML = '';
    setErrorMsg('');

    try {
      writerRef.current = HanziWriter.create(containerRef.current, character, {
        width: 260,
        height: 260,
        padding: 15,
        strokeColor: '#C0392B', // Красный цвет штриха
        radicalColor: '#D4A017', // Золотой радикал
        outlineColor: 'rgba(255,255,255,0.1)',
        drawingColor: '#FFFFFF',
        drawingWidth: 15,
        showOutline: true,
        showCharacter: false,
      });

      // Запускаем режим викторины (рисования)
      writerRef.current.quiz({
        onMistake: (strokeData) => {
          setErrorMsg(`Ошибка! Штрих #${strokeData.strokeNum + 1}`);
        },
        onCorrectStroke: () => {
          setErrorMsg('');
        },
        onComplete: () => {
          setErrorMsg('Отлично! 🎉');
          setTimeout(() => onComplete(true), 1500); // Идем дальше через 1.5 сек
        }
      });
    } catch (err) {
      console.error(err);
    }

    return () => {
      if (writerRef.current) writerRef.current.cancelQuiz();
    };
  }, [character, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        ref={containerRef} 
        style={{ 
          background: '#FAF7F2', // Цвет бумаги из переменных
          borderRadius: '24px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          marginBottom: '16px',
          cursor: 'crosshair'
        }} 
      />
      
      <div style={{ minHeight: '24px', fontSize: '14px', color: errorMsg.includes('Ошибка') ? '#E87060' : '#7EC89A', fontWeight: 600 }}>
        {errorMsg || 'Нарисуй первую черту...'}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button 
          onClick={() => writerRef.current?.animateCharacter()}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer' }}
        >
          👁 Показать анимацию
        </button>
        <button 
          onClick={() => writerRef.current?.quiz()}
          style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#ffb3b3', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer' }}
        >
          🔄 Начать заново
        </button>
      </div>
    </div>
  );
}