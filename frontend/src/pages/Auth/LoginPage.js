import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { loginUser, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // useEffect should not return JSX - redirect logic moved to component return

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    try {
      const result = await dispatch(loginUser(data));
      if (result.type === 'auth/login/fulfilled') {
        toast.success('Giriş başarılı!');
      }
    } catch (err) {
      // Error is handled by Redux and useEffect
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <FiLogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Devarp'a Giriş Yapın
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Stok ve üretim yönetimi sistemi
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Kullanıcı Adı veya E-posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('username', {
                    required: 'Kullanıcı adı gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Kullanıcı adı en az 3 karakter olmalıdır',
                    },
                  })}
                  type="text"
                  className={`form-input pl-10 ${errors.username ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="kullanici_adi veya email@example.com"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="form-error">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input pl-10 pr-10 ${errors.password ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiLogIn className="h-5 w-5 mr-2" />
                    Giriş Yap
                  </div>
                )}
              </button>
            </div>
          </form>


        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-secondary-500">
            Devarp Stok ve Üretim Yönetimi Sistemi v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;