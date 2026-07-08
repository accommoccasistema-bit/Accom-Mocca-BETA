import React, { useState } from 'react';
import { Logo } from './Logo';
import { signInWithId } from '../firebase';
import { LogIn, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await signInWithId(username, password);
    } catch (err: any) {
      console.error(err);
      setError("ID ou senha incorretos. Verifique os dados.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-6 animate-fadeIn font-inter min-h-screen">
      <div className="mb-8 scale-90">
        <Logo />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1 uppercase tracking-tight">Mocca Moinho</h2>
        <p className="text-center text-slate-400 text-[10px] mb-8 uppercase tracking-widest font-black">
          Acesso ao Sistema
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">
              ID do Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: operador1"
              className="w-full bg-slate-50 border border-slate-100 focus:border-blue-400 text-sm font-bold text-slate-700 rounded-xl p-4 outline-none transition-all"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="****"
              className="w-full bg-slate-50 border border-slate-100 focus:border-blue-400 text-sm font-bold text-slate-700 rounded-xl p-4 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest justify-center animate-shake">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-100 transform transition-all active:scale-95 uppercase tracking-widest text-[10px] mt-4"
          >
            {loading ? "Entrando..." : "ENTRAR"}
          </button>
        </form>

        <p className="text-center text-[9px] font-black text-slate-300 mt-8 uppercase tracking-widest">
          Mocca Moinho Comercial &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
