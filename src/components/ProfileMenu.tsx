import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  History as HistoryIcon,
  Users,
  LogOut,
  UserPlus,
  Check,
  X as XIcon,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { uploadAvatar } from '../services/authService';
import { goToHistory } from '../utils/navigation';

interface ProfileMenuProps {
  onClose: () => void;
}

/** Mostra um flash de feedback breve reaproveitando o toast já existente no
 * PlayerBar (o store não expira essa mensagem sozinho). */
function flashFeedback(msg: string, durationMs = 2500) {
  usePlayerStore.getState().setFeedbackMessage(msg);
  setTimeout(() => {
    if (usePlayerStore.getState().feedbackMessage === msg) {
      usePlayerStore.getState().setFeedbackMessage(null);
    }
  }, durationMs);
}

/** Redimensiona/recorta a imagem escolhida para um quadrado 256x256 antes do
 * upload, mantendo o payload base64 pequeno o bastante para caber no limite
 * do body JSON do backend. */
function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileMenu({ onClose }: ProfileMenuProps) {
  const { user, logout, savedAccounts, switchAccount, removeAccount, setAuthModalOpen } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAccounts, setShowAccounts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [switchingUid, setSwitchingUid] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      flashFeedback('Escolha um arquivo de imagem válido');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const updatedUser = await uploadAvatar(dataUrl);
      useAuthStore.getState().setUser(updatedUser);
      flashFeedback('Foto de perfil atualizada!');
      onClose();
    } catch (err: any) {
      flashFeedback(err.message || 'Erro ao atualizar a foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const handleHistoryClick = () => {
    goToHistory();
    onClose();
  };

  const handleAddAccount = () => {
    setAuthModalOpen(true, 'login');
    onClose();
  };

  const handleSwitchAccount = async (uid: string) => {
    if (uid === user.uid || switchingUid) return;
    setSwitchingUid(uid);
    try {
      await switchAccount(uid);
      flashFeedback('Conta alterada com sucesso!');
      onClose();
    } catch (err: any) {
      flashFeedback(err.message || 'Não foi possível alternar de conta');
    } finally {
      setSwitchingUid(null);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    removeAccount(uid);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const otherAccounts = savedAccounts.filter((a) => a.uid !== user.uid);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Cabeçalho: foto e nome do usuário */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <div className="relative shrink-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-base">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.displayName || 'Minha Conta'}</p>
          <p className="text-xs text-yt-text-secondary truncate">{user.email}</p>
        </div>
      </div>

      <div className="py-1.5">
        {/* Foto de perfil */}
        <button
          onClick={handleAvatarClick}
          disabled={uploading}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/70" />
          ) : (
            <Camera className="w-4 h-4 text-white/70" />
          )}
          <span>{uploading ? 'Enviando foto...' : 'Foto de perfil'}</span>
        </button>

        {/* Histórico */}
        <button
          onClick={handleHistoryClick}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
        >
          <HistoryIcon className="w-4 h-4 text-white/70" />
          <span>Histórico</span>
        </button>

        {/* Mudar de conta */}
        <button
          onClick={() => setShowAccounts((v) => !v)}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
        >
          <Users className="w-4 h-4 text-white/70" />
          <span>Mudar de conta</span>
        </button>

        {showAccounts && (
          <div className="px-2 pb-1.5">
            <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
              {/* Conta ativa */}
              <div className="flex items-center gap-2.5 px-3 py-2 text-white">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs truncate flex-1">{user.displayName || user.email}</span>
                <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />
              </div>

              {otherAccounts.map((acc) => (
                <button
                  key={acc.uid}
                  onClick={() => handleSwitchAccount(acc.uid)}
                  disabled={switchingUid !== null}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-white hover:bg-white/5 transition-colors border-t border-white/5 disabled:opacity-60"
                >
                  {acc.photoURL ? (
                    <img src={acc.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {(acc.name || acc.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs truncate flex-1 text-left">{acc.name || acc.email}</span>
                  {switchingUid === acc.uid ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  ) : (
                    <span
                      role="button"
                      onClick={(e) => handleRemoveAccount(e, acc.uid)}
                      className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white shrink-0"
                      title="Remover conta salva"
                    >
                      <XIcon className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}

              <button
                onClick={handleAddAccount}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Adicionar outra conta</span>
              </button>
            </div>
          </div>
        )}

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 flex items-center gap-3 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
