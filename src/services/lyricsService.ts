export async function fetchLyrics(artist: string, title: string): Promise<string> {
  try {
    const encodedArtist = encodeURIComponent(artist);
    const encodedTitle = encodeURIComponent(title);
    
    const response = await fetch(`https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`);
    
    if (!response.ok) {
      throw new Error('Letra não encontrada');
    }
    
    const data = await response.json();
    
    if (data && data.lyrics) {
      return data.lyrics;
    }
    
    throw new Error('Resposta vazia');
  } catch (error) {
    console.error('Erro ao buscar letras:', error);
    return "Letra instrumental ou indisponível para esta faixa no momento.";
  }
}
