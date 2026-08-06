import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const MIN_DISPLAY_MS = 1800;
const EXIT_DURATION_MS = 500;

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Guarda a versão mais recente de onFinish sem entrar nas dependências do
  // efeito abaixo — onFinish é recriado a cada render do App (ex.: quando
  // respostas de auth/playlists chegam em produção), e se fosse dependência
  // o efeito reiniciaria os timers a cada re-render, quebrando a animação.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // rAF duplo: o primeiro apenas garante que o navegador já pintou o
    // estado inicial (opacity-0/scale-95); só no segundo aplicamos o estado
    // final. Com um único rAF, builds de produção (bundle minificado, muito
    // mais rápido para montar que o dev server) podem executar o callback
    // antes do primeiro paint, fazendo o elemento "pular" direto pro estado
    // final sem transição visível.
    let enterFrame = requestAnimationFrame(() => {
      enterFrame = requestAnimationFrame(() => setVisible(true));
    });
    const exitTimer = setTimeout(() => setExiting(true), MIN_DISPLAY_MS);
    const finishTimer = setTimeout(() => onFinishRef.current(), MIN_DISPLAY_MS + EXIT_DURATION_MS);

    return () => {
      cancelAnimationFrame(enterFrame);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, []);

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
