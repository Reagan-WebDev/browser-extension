import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/auth/login', {
        email,
        password
      });
      // The backend should check if it's admin or simply block UI actions here
      if (response.data.user.role !== 'admin') {
         setError('Admin access required.');
         setLoading(false);
         return;
      }
      setToken(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass p-10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-4 bg-surface rounded-full mb-4 shadow-lg border border-primary/20">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Portal</h2>
          <p className="text-textSecondary mb-8 text-center">Monitor extension activity</p>

          {error && <div className="w-full p-3 mb-4 text-sm text-accent bg-accent/10 border border-accent/20 rounded-lg text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/30 flex justify-center items-center mt-6"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
