import { useState } from 'react';
import { Eye, EyeOff, Shield, Lock, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type LoginView = 'login' | 'forgot' | 'reset';

export default function Login() {
  const { login, forgotPassword, resetPassword } = useAuth();
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const success = login(email, password);
    if (!success) setError('Invalid email or password. Please try again.');
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = forgotPassword(email);
    if (result.success) {
      setMessage(result.message);
      const tokenMatch = result.message.match(/token: ([a-z0-9]+)/);
      if (tokenMatch) setResetToken(tokenMatch[1]);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = resetPassword(resetToken, newPassword);
    if (result.success) {
      setMessage(result.message);
      setTimeout(() => {
        setView('login');
        setMessage('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative bg-[url('/images/Gemini_Generated_Image_c1ou4zc1ou4zc1ou.png')] bg-cover bg-center bg-no-repeat bg-fixed">
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/65 z-0" />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-16 h-auto drop-shadow-lg" />
            <span className="text-white font-bold text-lg drop-shadow-md">HEALTH SYS SFCG</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              HEALTH SYS SFCG:<br />
              <span className="text-teal-300">An Information System</span><br />
              for Managing Student and<br />
              Employee Health Records
            </h2>
            <p className="mt-4 text-slate-100 text-lg leading-relaxed max-w-md drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              A unified platform for managing health records, requests, inventory, and reporting for your institution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Health Records', icon: '📋' },
              { label: 'User Management', icon: '👥' },
              { label: 'Service Requests', icon: '📝' },
              { label: 'Inventory Control', icon: '💊' },
            ].map((stat) => (
              <div key={stat.label} className="bg-black/40 border border-white/15 rounded-xl p-4 backdrop-blur-md">
                <p className="text-teal-300 font-bold text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{stat.icon}</p>
                <p className="text-slate-200 text-sm mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-slate-300 text-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          <Shield size={14} />
          <span>Secure, role-based access control</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-white font-bold text-xl">HEALTH SYS SFCG</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Login View */}
            {view === 'login' && (
              <>
                <div className="mb-8 text-center">
                  <img src="/logo.png" alt="Logo" className="w-28 h-auto mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
                  <p className="text-slate-400 mt-1">Sign in to access your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setError(''); setMessage(''); }}
                        className="text-xs text-teal-500 hover:text-teal-600 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl text-sm">
                      <Lock size={14} />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                    ) : 'Sign In'}
                  </button>
                </form>
              </>
            )}

            {/* Forgot Password View */}
            {view === 'forgot' && (
              <>
                <div className="mb-8">
                  <button onClick={() => { setView('login'); setError(''); setMessage(''); }} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-4 transition-colors">
                    <ArrowLeft size={15} /> Back to Sign In
                  </button>
                  <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mail size={22} className="text-teal-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Forgot Password</h2>
                  <p className="text-slate-400 mt-1 text-sm">Enter your email to receive reset instructions.</p>
                </div>

                {message ? (
                  <div className="space-y-4">
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-700">
                      {message}
                    </div>
                    <button
                      onClick={() => { setView('reset'); setMessage(''); setError(''); }}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      Enter Reset Token
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl text-sm">
                        <Lock size={14} />
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : 'Send Reset Instructions'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Reset Password View */}
            {view === 'reset' && (
              <>
                <div className="mb-8">
                  <button onClick={() => { setView('forgot'); setError(''); setMessage(''); }} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-4 transition-colors">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                  <p className="text-slate-400 mt-1 text-sm">Enter your reset token and new password.</p>
                </div>

                {message ? (
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-700">
                    <CheckCircle size={18} className="text-teal-500 shrink-0" />
                    {message}
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Reset Token</label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Paste your reset token"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl text-sm">
                        <Lock size={14} />
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting...</> : 'Reset Password'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
