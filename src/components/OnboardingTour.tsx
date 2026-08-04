import { useCallback, useEffect, useState } from 'react';
import { Joyride, EVENTS, STATUS, type EventData, type Step } from 'react-joyride';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Prefixo fixo nos logs de diagnóstico do tour — facilita filtrar no console
 * do navegador (ex: DevTools > Console > filtro "[OnboardingTour]").
 */
const LOG_PREFIX = '[OnboardingTour]';

/** Tempo de tolerância após o mount antes de permitir o tour iniciar, para
 * garantir que o layout (Header, PlayerBar) já tenha assentado. */
const START_DELAY_MS = 500;

const STEPS: Step[] = [
  {
    target: '[data-tour="search-bar"]',
    title: 'Encontre sua primeira música',
    content: 'Use a busca para encontrar qualquer música, álbum, artista ou podcast em segundos.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="player-bar"]',
    title: 'Player Global',
    content: 'Ouça prévias com controles completos: play, pausar, volume e muito mais, de qualquer página do app.',
    placement: 'top',
  },
  {
    target: '[data-tour="save-track"]',
    title: 'Salvar na Playlist',
    content: 'Gostou de uma música? Clique aqui para salvá-la em uma playlist e organizar sua biblioteca.',
    placement: 'auto',
    targetWaitTimeout: 10000,
  },
];

const SAVE_TRACK_TARGET = '[data-tour="save-track"]';

/**
 * Tutorial guiado (estilo "game") exibido apenas no primeiro login, controlado
 * pela flag `isFirstLogin` vinda do backend. Ao concluir ou pular, a flag é
 * atualizada via useAuthStore.completeOnboarding para não reaparecer.
 */
export function OnboardingTour() {
  const { user, isAuthenticated, completeOnboarding } = useAuthStore();

  // Pequena tolerância após o mount: evita que o Joyride tente calcular a
  // posição do 1º passo antes do layout (Header/PlayerBar) estar assentado.
  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    console.log(`${LOG_PREFIX} componente montado em App.tsx`);
    const timer = setTimeout(() => setAppReady(true), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const run = appReady && isAuthenticated && !!user?.isFirstLogin;

  // Diagnóstico: acompanha o valor de isFirstLogin vindo do backend/store e
  // se isso resulta (ou não) em run=true para o Joyride.
  useEffect(() => {
    console.log(`${LOG_PREFIX} estado atualizado`, {
      appReady,
      isAuthenticated,
      userIsFirstLogin: user?.isFirstLogin,
      run,
    });
    if (isAuthenticated && user?.isFirstLogin === undefined) {
      console.warn(
        `${LOG_PREFIX} isFirstLogin veio "undefined" do backend — provável resposta de uma versão` +
          ' antiga da API (deploy desatualizado no Render), não do frontend.'
      );
    }
  }, [appReady, isAuthenticated, user, run]);

  const handleEvent = useCallback(
    (data: EventData) => {
      const { index, type, status } = data;
      console.log(`${LOG_PREFIX} evento`, { type, status, index, target: STEPS[index]?.target });

      // O botão "Salvar na playlist" só fica visível no hover — força sua
      // exibição enquanto esse passo específico estiver ativo (ver index.css).
      const isSaveTrackStep = STEPS[index]?.target === SAVE_TRACK_TARGET;
      document.body.classList.toggle(
        'onboarding-step-save-track',
        isSaveTrackStep && status === STATUS.RUNNING
      );

      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn(`${LOG_PREFIX} alvo não encontrado no DOM para o passo`, STEPS[index]?.target);
      }

      if (type === EVENTS.TOUR_END && (status === STATUS.FINISHED || status === STATUS.SKIPPED)) {
        document.body.classList.remove('onboarding-step-save-track');
        console.log(`${LOG_PREFIX} tour concluído/pulado — atualizando isFirstLogin no backend`);
        completeOnboarding();
      }
    },
    [completeOnboarding]
  );

  useEffect(() => () => {
    document.body.classList.remove('onboarding-step-save-track');
  }, []);

  return (
    <Joyride
      run={run}
      steps={STEPS}
      continuous
      onEvent={handleEvent}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        nextWithProgress: 'Próximo ({current}/{total})',
        skip: 'Pular tutorial',
      }}
      options={{
        showProgress: true,
        buttons: ['back', 'close', 'skip', 'primary'],
        closeButtonAction: 'skip',
        skipBeacon: true,
        backgroundColor: '#1d1d1d',
        textColor: '#ffffff',
        primaryColor: '#ff0000',
        overlayColor: 'rgba(3, 3, 3, 0.8)',
        arrowColor: '#1d1d1d',
        spotlightRadius: 8,
        targetWaitTimeout: 6000,
        zIndex: 10000,
      }}
      styles={{
        spotlight: { stroke: '#ff0000', strokeWidth: 2 },
        overlay: { transition: 'opacity 0.3s ease' },
        tooltip: { borderRadius: 12, transition: 'transform 0.3s ease, opacity 0.3s ease' },
        tooltipTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
        tooltipContent: { fontSize: 14, color: '#aaaaaa', padding: '8px 0' },
        buttonPrimary: { borderRadius: 999, padding: '8px 16px', fontWeight: 600 },
        buttonSkip: { color: '#aaaaaa' },
      }}
    />
  );
}
