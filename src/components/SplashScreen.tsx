import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const MIN_DISPLAY_MS = 1800;
const EXIT_DURATION_MS = 500;

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Aguarda um frame antes de animar a entrada, para o navegador
    // registrar o estado inicial (opacity-0/scale-95) antes da transição.
    const enterFrame = requestAnimationFrame(() => setVisible(true));
    const exitTimer = setTimeout(() => setExiting(true), MIN_DISPLAY_MS);
    const finishTimer = setTimeout(onFinish, MIN_DISPLAY_MS + EXIT_DURATION_MS);

    return () => {
      cancelAnimationFrame(enterFrame);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      role="status"
      aria-label="Carregando Stream Music"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-yt-black transition-opacity duration-500 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-700 ease-out will-change-transform ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
          <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
            <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
          </svg>
        </div>
        <span className="text-2xl font-semibold tracking-tight text-white">Stream Music</span>
      </div>
    </div>
  );
}
