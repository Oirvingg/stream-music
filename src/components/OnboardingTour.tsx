import { useCallback, useEffect } from 'react';
import { Joyride, EVENTS, STATUS, type EventData, type Step } from 'react-joyride';
import { useAuthStore } from '../store/useAuthStore';

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

  const run = isAuthenticated && !!user?.isFirstLogin;

  const handleEvent = useCallback(
    (data: EventData) => {
      const { index, type, status } = data;

      // O botão "Salvar na playlist" só fica visível no hover — força sua
      // exibição enquanto esse passo específico estiver ativo (ver index.css).
      const isSaveTrackStep = STEPS[index]?.target === SAVE_TRACK_TARGET;
      document.body.classList.toggle(
        'onboarding-step-save-track',
        isSaveTrackStep && status === STATUS.RUNNING
      );

      if (type === EVENTS.TOUR_END && (status === STATUS.FINISHED || status === STATUS.SKIPPED)) {
        document.body.classList.remove('onboarding-step-save-track');
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
