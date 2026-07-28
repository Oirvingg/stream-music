import React from 'react';
import { AuthModal } from '../components/auth/AuthModal';

interface AuthPageProps {
  onNavigateHome?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="min-h-screen w-full bg-yt-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decorative Blur & Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Renderiza o AuthModal em modo embutido/página */}
      <AuthModal isOpen={true} onClose={onNavigateHome || (() => {})} />
    </div>
  );
};

export default AuthPage;
