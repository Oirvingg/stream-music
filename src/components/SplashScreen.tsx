import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const PROGRESS_DURATION_MS = 2500;
const EXIT_DURATION_MS = 500;

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [progressStarted, setProgressStarted] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Guarda a versão mais recente de onFinish sem entrar nas dependências do
  // efeito abaixo — onFinish é recriado a cada render do App (ex.: quando
  // respostas de auth/playlists chegam em produção), e se fosse dependência
  // o efeito reiniciaria os timers da animação.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout>;
    let finishTimer: ReturnType<typeof setTimeout>;

    // rAF duplo: o primeiro apenas garante que o navegador já pintou o
    // estado inicial (opacity-0/scale-95/w-0); só no segundo aplicamos o
    // estado final. Com um único rAF, builds de produção (bundle
    // minificado, muito mais rápido para montar que o dev server) podem
    // executar o callback antes do primeiro paint, fazendo o elemento
    // "pular" direto pro estado final sem transição visível.
    let enterFrame = requestAnimationFrame(() => {
      enterFrame = requestAnimationFrame(() => {
        setVisible(true);
        // Dispara o preenchimento da barra e agenda a saída a partir do
        // mesmo instante, garantindo que o fade-out só comece quando a
        // barra realmente atingir 100%.
        setProgressStarted(true);
        exitTimer = setTimeout(() => setExiting(true), PROGRESS_DURATION_MS);
        finishTimer = setTimeout(() => onFinishRef.current(), PROGRESS_DURATION_MS + EXIT_DURATION_MS);
      });
    });

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
        className={`flex flex-col items-center gap-8 transition-all duration-700 ease-out will-change-transform ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
              <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
            </svg>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">Stream Music</span>
        </div>

        {/* Barra de progresso de carregamento */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] ease-in-out ${
              progressStarted ? 'w-full' : 'w-0'
            }`}
            style={{ transitionProperty: 'width', transitionDuration: `${PROGRESS_DURATION_MS}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
