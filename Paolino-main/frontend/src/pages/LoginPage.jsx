import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    if (!formData.password) {
      newErrors.password = 'La password è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    
    try {
      const result = await login(formData);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-[20px]">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-[10px] flex items-center justify-center text-white" style={{background: 'linear-gradient(135deg, #48dbfb, #54a0ff)'}}>
              <span className="font-bold text-2xl">P</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#333333] uppercase tracking-wide">Accedi al tuo account</h2>
          <p className="mt-2 text-sm text-[#666666] font-medium">
            Non hai un account?{' '}
            <Link to="/register" className="font-semibold text-[#48dbfb] hover:text-[#54a0ff] transition-colors duration-300">
              Registrati qui
            </Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-opacity duration-200 ${
                  formData.email ? 'opacity-0' : 'opacity-100'
                }`}>
                  <Mail className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-opacity duration-200 ${
                  formData.password ? 'opacity-0' : 'opacity-100'
                }`}>
                  <Lock className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-primary-400 hover:text-primary-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary-400 hover:text-primary-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-primary py-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Accesso in corso...
                </div>
              ) : (
                'Accedi'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              Hai dimenticato la password?
            </Link>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 p-5 bg-white rounded-[16px] border border-[#e9ecef] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
          <h3 className="text-sm font-semibold text-[#333333] mb-3 uppercase tracking-wide">Account Demo</h3>
          <div className="text-xs text-[#666666] space-y-2 font-mono">
            <p className="p-2 bg-[#f8f9fa] rounded-[6px]"><strong className="text-[#48dbfb]">Admin:</strong> admin@paolino.com / admin123</p>
            <p className="p-2 bg-[#f8f9fa] rounded-[6px]"><strong className="text-[#48dbfb]">Cliente:</strong> cliente@paolino.com / cliente123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;