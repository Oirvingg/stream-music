const FALLBACK_GRADIENT = 'linear-gradient(180deg, #3a1c1c 0%, #030303 70%)';

function buildGradient(r: number, g: number, b: number): string {
  const darken = (c: number) => Math.round(c * 0.55);
  const base = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
  return `linear-gradient(180deg, ${base} 0%, rgba(0,0,0,0.85) 55%, #030303 100%)`;
}

/**
 * Extrai a cor média de uma imagem de capa via canvas para montar um
 * gradiente escuro (estilo YouTube Music). Cai no gradiente estático caso
 * a imagem seja cross-origin sem CORS liberado (comum em CDNs externas).
 */
export function getCoverGradient(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(FALLBACK_GRADIENT);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        resolve(buildGradient(r, g, b));
      } catch {
        resolve(FALLBACK_GRADIENT);
      }
    };

    img.onerror = () => resolve(FALLBACK_GRADIENT);
    img.src = url;
  });
}
