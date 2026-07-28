import { useEffect, useRef } from 'react';
import { globalAnalyser } from '../hooks/useAudioPlayer';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const renderFrame = () => {
      animationId = requestAnimationFrame(renderFrame);

      if (!globalAnalyser) {
        // Se ainda não foi instanciado (antes do primeiro play)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const analyser = globalAnalyser;
      const bufferLength = analyser.frequencyBinCount; // 32
      const dataArray = new Uint8Array(bufferLength);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Amplifica ligeiramente as frequências médias/baixas para mais dinamismo visual
        barHeight = (dataArray[i] / 255) * height * 0.9;

        // Gradiente degradê inspirado no YouTube Music
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(255, 0, 50, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 100, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 150, 200, 0.9)');

        ctx.fillStyle = gradient;
        
        const actualBarWidth = Math.max(3, barWidth - 4);
        
        // Desenha a barra arredondada
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, actualBarWidth, barHeight, 6);
        ctx.fill();

        x += barWidth;
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full opacity-70 pointer-events-none"
      width={600}
      height={250}
    />
  );
}
