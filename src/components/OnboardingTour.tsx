import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Joyride, EVENTS, STATUS, type EventData, type Step } from 'react-joyride';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTrendingTracks } from '../hooks/useMusicQueries';
import { useIsMobile } from '../hooks/useIsMobile';
import { getArtistId, type Track } from '../types/music';
import { goToArtist, goBackFromArtist } from '../utils/navigation';

/**
 * Prefixo fixo nos logs de diagnóstico do tour — facilita filtrar no console
 * do navegador (ex: DevTools > Console > filtro "[OnboardingTour]").
 */
const LOG_PREFIX = '[OnboardingTour]';

/** Tempo de tolerância após o mount antes de permitir o tour iniciar, para
 * garantir que o layout (Header, PlayerBar) já tenha assentado. */
const START_DELAY_MS = 500;

const LYRICS_TARGET = '[data-tour="lyrics-tab"]';
const ARTIST_MORE_TARGET = '[data-tour="artist-more-button"]';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Aguarda um seletor aparecer no DOM (polling via rAF), sem nunca rejeitar —
 * na pior das hipóteses o próprio Joyride trata o alvo como "não encontrado"
 * e avança o tour graciosamente. */
function waitForElement(selector: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (document.querySelector(selector) || Date.now() - start >= timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

/**
 * Monta os passos do tour. O passo "Letra" expande o player global; o passo
 * "Catálogo Completo" navega até um artista (o da 1ª faixa em alta) — ambos
 * usam hooks `before`/`after` do Joyride para preparar a tela antes do
 * spotlight aparecer. `navigatedToArtistRef` registra se navegamos para uma
 * página de artista, para poder voltar ao Início quando o tour terminar.
 */
/** Garante que todo passo espere seu alvo existir no DOM antes de o Joyride
 * calcular a posição do spotlight — evita o evento `TARGET_NOT_FOUND` nos
 * passos que não têm um hook `before` próprio (ex: navegação ainda em
 * andamento, dados assíncronos ainda não renderizados). Passos que já
 * definem seu próprio `before` (Letra, Catálogo Completo) mantêm o
 * comportamento customizado — não é sobrescrito aqui. */
function withTargetGuard(step: Step): Step {
  if (step.before || typeof step.target !== 'string') return step;
  const target = step.target;
  const timeout = step.targetWaitTimeout ?? 4000;
  return {
    ...step,
    before: () => waitForElement(target, timeout),
  };
}

function buildSteps(
  trendingArtistIdRef: { current: string | null },
  navigatedToArtistRef: { current: boolean },
  placeholderTrackRef: { current: Track | null },
  isMobile: boolean
): Step[] {
  // Registra se o passo "Cante Junto" precisou inventar uma `currentTrack`
  // de vitrine (usuário ainda não tinha tocado nada) — usado no `after`
  // desse mesmo passo para limpar o estado caso a faixa não tenha sido
  // efetivamente reproduzida.
  const usedPlaceholderRef = { current: false };

  // A busca e a Biblioteca vivem em elementos diferentes conforme o
  // breakpoint: no desktop são a barra de pesquisa do Header e o link da
  // Sidebar; no mobile, foram removidos da BottomNav (que não existe mais)
  // — agora vivem no drawer MobileSidebar, aberto pelo botão hamburger do
  // Header. Como os dois pares de elementos coexistem no DOM (só um visível
  // via CSS por vez), apontar sempre para o mesmo seletor faria o Joyride
  // encontrar o nó oculto do breakpoint errado — por isso o alvo é
  // escolhido de acordo com `isMobile`.
  const steps: Step[] = [
    {
      target: isMobile ? '[data-tour="mobile-menu"]' : '[data-tour="search-bar"]',
      title: 'Encontre sua vibe',
      content: isMobile
        ? 'Toque no menu (hamburger) para abrir a navegação e achar artistas, músicas ou álbuns.'
        : 'Pesquise por artistas, músicas ou álbuns usando o poder das APIs Deezer e Last.fm.',
      placement: isMobile ? 'bottom' : 'bottom',
      skipBeacon: true,
    },
    {
      target: '[data-tour="mood-filters"]',
      title: 'Explore por Humor',
      content: 'Use os filtros rápidos para encontrar playlists perfeitas para treinar, relaxar ou festejar.',
      placement: 'bottom',
      targetWaitTimeout: 5000,
      skipBeacon: true,
    },
    {
      target: isMobile ? '[data-tour="sidebar-library-mobile"]' : '[data-tour="sidebar-library"]',
      title: 'Sua Coleção',
      content: 'Aqui você acessa suas músicas curtidas, artistas favoritos e as playlists que você criar.',
      placement: isMobile ? 'right' : 'right',
      skipBeacon: true,
      targetWaitTimeout: 5000,
      before: async () => {
        if (isMobile) {
          usePlayerStore.setState({ isMobileSidebarOpen: true });
          await wait(350);
        }
      },
    },
    {
      target: '[data-tour="player-bar"]',
      title: 'Controle Total',
      content: 'Ouça prévias de 30s, controle o volume e gerencie sua fila de reprodução em tempo real.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: LYRICS_TARGET,
      title: 'Cante Junto',
      content: 'Experimente nossa aba de letras com transições suaves de CSS para uma experiência imersiva.',
      placement: 'top',
      targetWaitTimeout: 3000,
      skipBeacon: true,
      before: async () => {
        // No mobile, o corpo inteiro do player expansivo (cabeçalho, capa e
        // a barra de abas onde vive o `lyrics-tab`) só é montado quando há
        // uma `currentTrack` — usuários novos costumam chegar no onboarding
        // sem nunca terem tocado nada, e nesse caso o alvo simplesmente
        // nunca existiria no DOM. Usamos a 1ª faixa em alta (já em cache do
        // passo do artista) como uma faixa "de vitrine": fica selecionada
        // mas nunca é reproduzida (isPlaying continua false), só serve para
        // satisfazer a condição de render. `usedPlaceholderRef` registra se
        // fomos nós que a definimos, para poder desfazer isso no `after`.
        if (!usePlayerStore.getState().currentTrack && placeholderTrackRef.current) {
          usePlayerStore.setState({ currentTrack: placeholderTrackRef.current });
          usedPlaceholderRef.current = true;
        }

        // No mobile, a aba "Letra" ativa (expandedTab === 'LYRICS') troca a
        // tela inteira pela MobileLyricsView, que não tem o botão da aba —
        // por isso o passo destaca o botão em si (visível em QUEUE/RELATED)
        // em vez de já trocar de aba, o que faria o próprio alvo sumir do
        // DOM antes do Joyride conseguir posicioná-lo.
        usePlayerStore.setState((state) => ({
          isExpanded: true,
          expandedTab: state.expandedTab === 'LYRICS' ? 'QUEUE' : state.expandedTab,
        }));
        await wait(600); // aguarda a transição de slide-up (500ms) assentar

        // Fallback seguro: se por algum motivo (ex: falha ao carregar
        // tendências) o alvo ainda assim não existir, o polling apenas
        // expira sem rejeitar — o Joyride trata como TARGET_NOT_FOUND e
        // avança o tour graciosamente, sem travar nem lançar erro.
        await waitForElement(LYRICS_TARGET, 3000);
      },
      after: () => {
        // Se a faixa "de vitrine" nunca chegou a tocar, desfaz a seleção
        // para não deixar um "fantasma" na PlayerBar depois do tour.
        if (usedPlaceholderRef.current && !usePlayerStore.getState().isPlaying) {
          usePlayerStore.setState({ currentTrack: null });
        }
        usedPlaceholderRef.current = false;
        usePlayerStore.setState({ isExpanded: false });
      },
    },
    {
      target: ARTIST_MORE_TARGET,
      title: 'Catálogo Completo',
      content: "Explore a discografia inteira do seu artista favorito clicando em 'Mais'.",
      placement: 'auto',
      targetWaitTimeout: 3000,
      beforeTimeout: 12000,
      skipBeacon: true,
      before: async () => {
        usePlayerStore.setState({ isExpanded: false });
        const artistId = trendingArtistIdRef.current;
        if (artistId) {
          goToArtist(artistId);
          navigatedToArtistRef.current = true;
          await waitForElement(ARTIST_MORE_TARGET, 8000);
        }
      },
    },
  ];

  return steps.map(withTargetGuard);
}

/**
 * Tutorial guiado (estilo "game") exibido apenas no primeiro login, controlado
 * pela flag `isFirstLogin` vinda do backend. Ao concluir ou pular, a flag é
 * atualizada via useAuthStore.completeOnboarding para não reaparecer.
 */
export function OnboardingTour() {
  const { user, isAuthenticated, completeOnboarding } = useAuthStore();
  const isMobile = useIsMobile();

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

  // Artista usado no passo 6 e faixa "de vitrine" usada no passo 5 (Letra)
  // quando o usuário ainda não tocou nada — ambos reaproveitam o cache já
  // buscado pela Home (mesma queryKey), sem disparar uma nova requisição.
  const { data: trendingTracks } = useTrendingTracks();
  const trendingArtistIdRef = useRef<string | null>(null);
  const placeholderTrackRef = useRef<Track | null>(null);
  useEffect(() => {
    const withArtist = trendingTracks?.find((t) => getArtistId(t.artist));
    trendingArtistIdRef.current = withArtist ? getArtistId(withArtist.artist) : null;
    placeholderTrackRef.current = trendingTracks?.[0] ?? null;
  }, [trendingTracks]);

  const navigatedToArtistRef = useRef(false);
  const steps = useMemo(
    () => buildSteps(trendingArtistIdRef, navigatedToArtistRef, placeholderTrackRef, isMobile),
    [isMobile]
  );

  const handleEvent = useCallback(
    (data: EventData) => {
      const { index, type, status } = data;
      console.log(`${LOG_PREFIX} evento`, { type, status, index, target: steps[index]?.target });

      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn(`${LOG_PREFIX} alvo não encontrado no DOM para o passo`, steps[index]?.target);
      }

      if (type === EVENTS.TOUR_END && (status === STATUS.FINISHED || status === STATUS.SKIPPED)) {
        usePlayerStore.setState({ isExpanded: false });
        if (navigatedToArtistRef.current) {
          goBackFromArtist();
          navigatedToArtistRef.current = false;
        }
        console.log(`${LOG_PREFIX} tour concluído/pulado — atualizando isFirstLogin no backend`);
        completeOnboarding();
      }
    },
    [completeOnboarding, steps]
  );

  useEffect(() => () => {
    usePlayerStore.setState({ isExpanded: false });
  }, []);

  // Bloqueia o scroll do body enquanto o tour estiver ativo — sem isso, no
  // mobile é possível arrastar a página por trás do overlay e desalinhar o
  // spotlight do alvo destacado.
  useEffect(() => {
    if (!run) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [run]);

  return (
    <Joyride
      run={run}
      steps={steps}
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
        // O Joyride usa `position: absolute` por padrão, ancorado ao
        // ancestral posicionado mais próximo (a div raiz do App, que tem
        // `overflow-hidden`) e calcula a altura via JS (window.innerHeight/
        // document height) — no mobile isso não acompanha a barra de
        // endereço dinâmica do navegador e fica sujeito ao clipping do
        // container pai, deixando faixas sem o overlay escurecido nas
        // bordas/rodapé. `fixed` + `inset: 0` + `100dvh` ancoram direto na
        // viewport, ignorando containers pais.
        overlay: {
          transition: 'opacity 0.3s ease',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
        tooltip: { borderRadius: 12, transition: 'transform 0.3s ease, opacity 0.3s ease' },
        tooltipTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
        tooltipContent: { fontSize: 14, color: '#aaaaaa', padding: '8px 0' },
        buttonPrimary: {
          borderRadius: 999,
          padding: '8px 18px',
          fontWeight: 700,
          boxShadow: '0 8px 20px -6px rgba(255, 0, 0, 0.6)',
        },
        buttonBack: { color: '#aaaaaa' },
        buttonSkip: { color: '#aaaaaa' },
      }}
    />
  );
}
