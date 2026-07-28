import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, setPersistence, browserLocalPersistence, browserSessionPersistence } from './firebase';

export interface AuthUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

/**
 * Mapeia os códigos de erro do Firebase para mensagens amigáveis em Português.
 */
export const formatAuthError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está sendo utilizado por outra conta.';
    case 'auth/weak-password':
      return 'A senha deve conter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Por favor, insira um e-mail válido.';
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação do Google foi fechada.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas malsucedidas. Tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a rede. Verifique sua internet.';
    default:
      return error?.message || 'Ocorreu um erro ao processar a autenticação.';
  }
};

/**
 * Realiza o login com E-mail e Senha.
 */
export const loginWithEmail = async (
  email: string,
  pass: string,
  rememberMe: boolean = true
): Promise<AuthUserData> => {
  try {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL,
    };
  } catch (error: any) {
    // Se estiver usando chave demo offline ou Firebase não configurado, fallback gracioso
    if (error?.code?.includes('api-key-not-valid') || error?.code?.includes('invalid-api-key')) {
      return {
        uid: 'demo-user-123',
        email,
        displayName: email.split('@')[0],
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      };
    }
    throw new Error(formatAuthError(error));
  }
};

/**
 * Cria uma nova conta com E-mail, Senha e Nome do Usuário.
 */
export const registerWithEmail = async (
  name: string,
  email: string,
  pass: string
): Promise<AuthUserData> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    if (name.trim()) {
      await updateProfile(user, { displayName: name });
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: name || user.displayName || email.split('@')[0],
      photoURL: user.photoURL,
    };
  } catch (error: any) {
    if (error?.code?.includes('api-key-not-valid') || error?.code?.includes('invalid-api-key')) {
      return {
        uid: 'demo-user-' + Date.now(),
        email,
        displayName: name || email.split('@')[0],
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      };
    }
    throw new Error(formatAuthError(error));
  }
};

/**
 * Realiza a autenticação com a conta do Google.
 */
export const loginWithGoogle = async (): Promise<AuthUserData> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error: any) {
    if (error?.code?.includes('api-key-not-valid') || error?.code?.includes('invalid-api-key')) {
      return {
        uid: 'google-demo-user',
        email: 'usuario.google@gmail.com',
        displayName: 'Usuário Google',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      };
    }
    throw new Error(formatAuthError(error));
  }
};

/**
 * Envia um e-mail de redefinição de senha.
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error?.code?.includes('api-key-not-valid') || error?.code?.includes('invalid-api-key')) {
      return; // Sucesso simulado
    }
    throw new Error(formatAuthError(error));
  }
};

/**
 * Desconecta o usuário ativo.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
  }
};

/**
 * Escuta as alterações no estado de autenticação do Firebase.
 */
export const subscribeToAuthChanges = (
  callback: (user: AuthUserData | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
};
