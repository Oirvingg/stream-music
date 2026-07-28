import { useState, useRef, useEffect } from 'react';
import { X, SendHorizonal, Sparkles, Music, Wand2 } from 'lucide-react';
import { usePlayerStore, UserPlaylist } from '../store/usePlayerStore';
import { Track } from '../types/music';
import { searchTracks } from '../services/deezerService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tracks?: Track[];
}

export function AIChatModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente de IA do Stream Music. Me diga um clima, gênero ou artista e eu busco a trilha sonora perfeita para você! 🎵',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setTrack, setQueue, history, addPlaylist } = usePlayerStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerateFromHistory = async () => {
    if (isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: '✨ Gerar Playlist Baseada no meu Gosto' }]);

    if (history.length === 0) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Você ainda não ouviu nenhuma música! Ouça algumas faixas primeiro para eu entender seu gosto.' }
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const historyData = history.map(t => ({
        title: t.title,
        artist: typeof t.artist === 'string' ? t.artist : t.artist.name
      }));

      const systemPrompt = `Você é o DJ Inteligente do YouTube Music. O histórico de reprodução real do usuário é este array JSON: ${JSON.stringify(historyData)}.
Tarefa: Analise os artistas e gêneros desse histórico e crie uma NOVA playlist personalizada.
Sua resposta deve ser estritamente um objeto JSON com o formato: { "playlistName": "Nome Criativo Baseado no Gosto", "recommendations": ["Artista - Música 1", "Artista - Música 2", "Artista - Música 3", "Artista - Música 4", "Artista - Música 5"] }. Não adicione introduções, explicações ou blocos de markdown. Apenas o JSON puro.`;

      const body = {
        model: 'llama3',
        prompt: systemPrompt,
        stream: false,
      };

      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Falha ao conectar com o Ollama');
      const data = await res.json();
      
      // Tentar limpar e fazer parse do JSON caso o modelo tenha incluído formatação extra
      let rawResponse = data.response || '';
      rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(rawResponse) as { playlistName: string; recommendations: string[] };
      const { playlistName, recommendations } = parsedData;

      if (!recommendations || recommendations.length === 0) {
        throw new Error('Nenhuma recomendação encontrada no JSON.');
      }

      // Buscar faixas no Deezer
      const searchPromises = recommendations.map(q => searchTracks(q));
      const resultsArray = await Promise.all(searchPromises);
      
      const foundTracks = resultsArray
        .map(results => results[0])
        .filter((t): t is Track => t !== undefined);

      if (foundTracks.length > 0) {
        // Cria a nova playlist para a Sidebar
        const newPlaylist: UserPlaylist = {
          id: `ai-pl-${Date.now()}`,
          name: playlistName,
          creator: 'IA do Stream Music',
          tracks: foundTracks,
          pinned: false
        };

        addPlaylist(newPlaylist);
        setQueue(foundTracks);
        setTrack(foundTracks[0]);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `✨ Nova playlist gerada com sucesso!\n\n**${playlistName}**\nFoi salva na sua barra lateral e já está tocando! ▶`,
            tracks: foundTracks,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Criei uma playlist chamada "${playlistName}", mas não encontrei as faixas correspondentes no momento.`,
          },
        ]);
      }

    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Ocorreu um erro ao gerar a playlist baseada no histórico. O modelo pode não ter retornado um JSON válido.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    // (Mantendo apenas para entrada manual se desejado)
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Por favor, utilize o botão mágico "Gerar Playlist Baseada no meu Gosto" no topo para análises avançadas com IA!' }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onMouseDown={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[480px] max-h-[600px] flex flex-col bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">Assistente IA</h2>
              <p className="text-[11px] text-yt-text-tertiary">Powered by Ollama • llama3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <button 
            onClick={handleGenerateFromHistory}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 hover:from-purple-600/30 hover:to-pink-600/30 transition-all text-sm font-medium text-purple-300 group disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            ✨ Gerar Playlist Baseada no meu Gosto
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-[240px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-white/15 text-white rounded-br-md'
                    : 'bg-white/5 text-white/90 rounded-bl-md'
                }`}
              >
                {msg.content}
                {msg.tracks && msg.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.tracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => setTrack(track)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-colors"
                      >
                        <Music className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{track.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-yt-text-tertiary ml-1">Criando a playlist perfeita para você...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Use o botão mágico acima ☝️"
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
