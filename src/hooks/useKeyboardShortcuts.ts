import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export function useKeyboardShortcuts() {
  const { 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    volume, 
    setVolume,
    setFeedbackMessage
  } = usePlayerStore();
  
  const previousVolumeRef = useRef(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Função para exibir mensagem rápida
      const showFeedback = (msg: string) => {
        setFeedbackMessage(msg);
        // O timeout limpará o feedback, mas é importante gerenciar 
        // múltiplos disparos limpando timeouts anteriores caso quiséssemos perfeição.
        // Como o store atualizará instantaneamente, um timeout simples resolve para notificações rápidas.
      };

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        
        case 'ArrowRight':
          e.preventDefault();
          nextTrack();
          break;
        
        case 'ArrowLeft':
          e.preventDefault();
          prevTrack();
          break;
        
        case 'KeyM':
          e.preventDefault();
          if (volume > 0) {
            previousVolumeRef.current = volume;
            setVolume(0);
            showFeedback('Mudo: Ativado');
          } else {
            setVolume(previousVolumeRef.current || 1);
            showFeedback(`Volume: ${Math.round((previousVolumeRef.current || 1) * 100)}%`);
          }
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          const newVolUp = Math.min(volume + 0.05, 1);
          setVolume(newVolUp);
          showFeedback(`Volume: ${Math.round(newVolUp * 100)}%`);
          break;
        
        case 'ArrowDown':
          e.preventDefault();
          const newVolDown = Math.max(volume - 0.05, 0);
          setVolume(newVolDown);
          showFeedback(`Volume: ${Math.round(newVolDown * 100)}%`);
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, nextTrack, prevTrack, volume, setVolume, setFeedbackMessage]);
}
