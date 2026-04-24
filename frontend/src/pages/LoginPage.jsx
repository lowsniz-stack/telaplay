import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciais inválidas');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">

        {/* LOGO + MARCA */}
        <div className="mb-8 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <img
              src={logo}
              alt="Vextor Mídia"
              className="h-20 w-20 object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Vextor Mídia
            </h1>
            <p className="text-xs text-gray-400">
              Publicidade digital inteligente
            </p>
          </div>
        </div>

        {/* CARD LOGIN */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">
            Acessar painel
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Entre para gerenciar suas telas e campanhas
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* SENHA */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* RODAPÉ */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Plataforma Vextor Mídia
        </p>
      </div>
    </div>
  );
}