import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ListChecks } from 'lucide-react';

interface Props { onLogin: (session: any) => void; }

const Login: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.session);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account, then log in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Weekly Todo</h1>
              <p className="text-xs text-base-content/50">Eisenhower Matrix</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mt-2">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

          {message && <div className="alert alert-success text-sm py-2">{message}</div>}
          {error && <div className="alert alert-error text-sm py-2">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="form-control">
              <label className="label py-1"><span className="label-text">Email</span></label>
              <input
                type="email" className="input input-bordered input-sm"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
              />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text">Password</span></label>
              <input
                type="password" className="input input-bordered input-sm"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs"></span> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-3">
            <button className="text-xs text-base-content/50 hover:underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
