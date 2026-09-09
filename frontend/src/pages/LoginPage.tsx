import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { TropicalTideBackground } from '@/components/background-gradient/tropical-tide-background';

export function LoginPage({ onLogin }: { onLogin?: () => void } = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[LoginPage] submitting', { email, passwordLen: password.length });
    try {
      const result = await api.auth.login(email, password);
      console.log('[LoginPage] login success JSON:', result);
      localStorage.setItem('offer-builder-token', result.token);
      onLogin?.();
      navigate('/offers');
    } catch (err: any) {
      console.error('[LoginPage] login failed:', err);
      console.log('[LoginPage] error JSON:', JSON.stringify(err, null, 2));
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <TropicalTideBackground className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md py-16">
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">Sign In</h2>
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition border-gray-300"
                placeholder="you@company.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition border-gray-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-500">
            Members are created in Twenty. Sign in with your Twenty credentials.
          </p>
        </form>
      </div>
    </TropicalTideBackground>
  );
}
