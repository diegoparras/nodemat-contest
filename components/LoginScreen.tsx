
import React, { useState } from 'react';
import { DEFAULT_CREDENTIALS } from '../constants';
import { Lock, Github, MessageCircle } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === DEFAULT_CREDENTIALS.user && pass === DEFAULT_CREDENTIALS.pass) {
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1120] text-slate-200 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
           <h1 className="font-bold text-3xl tracking-tight text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Nodemat</span> Contest
           </h1>
           <p className="text-slate-500 text-sm">Plataforma de Interacción entre Modelos LLMs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Usuario</label>
            <input 
              type="text" 
              value={user}
              onChange={e => setUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña</label>
            <input 
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="••••••"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center font-medium bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Lock className="w-4 h-4" /> Entrar
          </button>
        </form>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-md">
         <a 
           href="https://github.com/diegoparras/nodemat-contest" 
           target="_blank" 
           rel="noopener noreferrer"
           className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm"
         >
           <Github className="w-4 h-4" />
           Explorá este proyecto en GitHub (Licencia MIT)
         </a>

         <div className="w-1/2 border-t border-slate-800 my-1"></div>

         <a 
           href="https://chat.nodemat.com" 
           target="_blank" 
           rel="noopener noreferrer"
           className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium animate-pulse hover:animate-none"
         >
           <MessageCircle className="w-4 h-4" />
           También podés probar Nodemat CHAT aquí
         </a>
      </div>
    </div>
  );
};

export default LoginScreen;
