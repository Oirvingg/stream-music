import React, { useState, useCallback } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Music2,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
} from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    isAuthModalOpen,
    authMode,
    setAuthModalOpen,
    setAuthMode,
    setUser,
    setError,
    error: globalError,
  } = useAuthStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const handleClose = propOnClose || (() => setAuthModalOpen(false));

  // Estados locais do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados de UI e feedback
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetPasswordView, setIsResetPasswordView] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Limpa formulário
  const resetFields = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
    setResetSuccessMessage(null);
    setIsResetPasswordView(false);
  }, []);

  const handleTabChange = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setFormError(null);
    setResetSuccessMessage(null);
    setIsResetPasswordView(false);
  };

  // Submissão do Formulário de Login / Registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResetSuccessMessage(null);

    // Validações básicas
    if (!email || !email.includes('@')) {
      setFormError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (isResetPasswordView) {
      setLoading(true);
      try {
        await resetPassword(email);
        setResetSuccessMessage('Instruções de redefinição foram enviadas para o seu e-mail.');
      } catch (err: any) {
        setFormError(err.message || 'Erro ao enviar e-mail de redefinição.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setFormError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setFormError('Por favor, informe seu nome.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('As senhas não coincidem. Verifique e tente novamente.');
        return;
      }
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        const userData = await loginWithEmail(email, password, rememberMe);
        setUser(userData);
        handleClose();
        resetFields();
      } else {
        const userData = await registerWithEmail(name, email, password);
        setUser(userData);
        handleClose();
        resetFields();
      }
    } catch (err: any) {
      setFormError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle();
      setUser(userData);
      handleClose();
      resetFields();
    } catch (err: any) {
      setFormError(err.message || 'Não foi possível autenticar com o Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Backdrop escuro com Blur sutil */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Card Principal de Autenticação */}
      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 text-white transform transition-all">
        {/* Glows Decorativos de Fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-yt-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors z-20 focus:outline-none"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho com Logo */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 shadow-lg shadow-red-500/30 mb-3">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Stream Music</h2>
          <p className="text-xs text-yt-text-secondary mt-1">
            {isResetPasswordView
              ? 'Recupere o acesso à sua conta de música'
              : authMode === 'login'
              ? 'Sua trilha sonora favorita te espera'
              : 'Crie sua conta gratuita em instantes'}
          </p>
        </div>

        {/* Tabs de Seleção (Entrar / Criar Conta) */}
        {!isResetPasswordView && (
          <div className="px-8 mb-6">
            <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  authMode === 'login'
                    ? 'bg-yt-surface text-white shadow-md border border-white/10'
                    : 'text-yt-text-secondary hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  authMode === 'register'
                    ? 'bg-yt-surface text-white shadow-md border border-white/10'
                    : 'text-yt-text-secondary hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>
          </div>
        )}

        {/* Mensagens de Alerta (Erro / Sucesso) */}
        <div className="px-8">
          {(formError || globalError) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError || globalError}</span>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {/* Nome completo (apenas no Cadastro) */}
          {authMode === 'register' && !isResetPasswordView && (
            <div>
              <label className="block text-xs font-medium text-yt-text-secondary mb-1.5">
                Nome completo
              </label>
              <div className="relative group">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yt-text-tertiary group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full h-11 pl-10 pr-4 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-yt-text-tertiary hover:border-white/20 focus:border-white/60 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {/* E-mail */}
          <div>
            <label className="block text-xs font-medium text-yt-text-secondary mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yt-text-tertiary group-focus-within:text-white transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full h-11 pl-10 pr-4 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-yt-text-tertiary hover:border-white/20 focus:border-white/60 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Senha (oculto no modo Esqueceu a Senha) */}
          {!isResetPasswordView && (
            <div>
              <label className="block text-xs font-medium text-yt-text-secondary mb-1.5">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yt-text-tertiary group-focus-within:text-white transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-yt-text-tertiary hover:border-white/20 focus:border-white/60 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-yt-text-tertiary hover:text-white transition-colors focus:outline-none"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirmar Senha (apenas no Cadastro) */}
          {authMode === 'register' && !isResetPasswordView && (
            <div>
              <label className="block text-xs font-medium text-yt-text-secondary mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yt-text-tertiary group-focus-within:text-white transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className="w-full h-11 pl-10 pr-11 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white placeholder-yt-text-tertiary hover:border-white/20 focus:border-white/60 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Opções Auxiliares: Lembrar de mim & Esqueceu a Senha */}
          {authMode === 'login' && !isResetPasswordView && (
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#1a1a1a] border-white/20 text-red-600 focus:ring-red-500/40 focus:ring-offset-0 transition-colors accent-red-600"
                />
                <span className="text-xs text-yt-text-secondary group-hover:text-white transition-colors">
                  Lembrar de mim
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordView(true);
                  setFormError(null);
                }}
                className="text-xs text-yt-text-secondary hover:text-white hover:underline transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* Botão Principal de Ação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : isResetPasswordView ? (
              <>
                <span>Enviar E-mail de Recuperação</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            ) : authMode === 'login' ? (
              <>
                <span>Entrar no Stream Music</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <span>Criar Conta Gratuita</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Voltar do Esqueceu a Senha */}
          {isResetPasswordView && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordView(false);
                  setFormError(null);
                  setResetSuccessMessage(null);
                }}
                className="text-xs text-yt-text-secondary hover:text-white transition-colors"
              >
                ← Voltar para o Login
              </button>
            </div>
          )}

          {/* Divisor para Login Social */}
          {!isResetPasswordView && (
            <>
              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#121212] px-3 text-[11px] uppercase tracking-wider text-yt-text-tertiary">
                  ou continue com
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              {/* Botão de Autenticação com o Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full h-11 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                      />
                    </svg>
                    <span>Continuar com o Google</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
