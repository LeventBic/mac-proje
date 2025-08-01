import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AuthService from '../services/authService';
import toast from 'react-hot-toast';

// Query Keys
export const AUTH_QUERY_KEYS = {
  all: ['auth'],
  profile: () => [...AUTH_QUERY_KEYS.all, 'profile'],
};

// Get current user profile
export const useProfile = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.profile(),
    queryFn: AuthService.getProfile,
    enabled: AuthService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: _data => {
      // Store tokens and user data
      if (_data.token) {
        AuthService.setTokens(_data.token, _data.refreshToken);
      }
      if (_data.user) {
        AuthService.setCurrentUser(_data.user);
      }

      // Set user data in cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile(), _data.user);

      toast.success('Başarıyla giriş yapıldı');

      // Redirect to dashboard or intended page
      const redirectTo =
        localStorage.getItem('redirectAfterLogin') || '/dashboard';
      localStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectTo;
    },
    onError: error => {
      console.error('Login error:', error);
      // Error is already handled by axios interceptor
    },
  });
};

// Register mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: AuthService.register,
    onSuccess: _data => {
      toast.success('Kullanıcı başarıyla oluşturuldu');
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      AuthService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      toast.success('Başarıyla çıkış yapıldı');
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.updateProfile,
    onSuccess: _data => {
      // Update profile in cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile(), _data.user);
      // Update stored user data
      AuthService.setCurrentUser(_data.user);
      toast.success('Profil başarıyla güncellendi');
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: AuthService.changePassword,
    onSuccess: () => {
      toast.success('Şifre başarıyla değiştirildi');
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: AuthService.forgotPassword,
    onSuccess: () => {
      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: AuthService.resetPassword,
    onSuccess: () => {
      toast.success('Şifre başarıyla sıfırlandı. Giriş yapabilirsiniz.');
      window.location.href = '/login';
    },
  });
};

// Verify email mutation
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: AuthService.verifyEmail,
    onSuccess: () => {
      toast.success('E-posta adresi başarıyla doğrulandı');
    },
  });
};

// Resend verification email mutation
export const useResendVerification = () => {
  return useMutation({
    mutationFn: AuthService.resendVerification,
    onSuccess: () => {
      toast.success('Doğrulama e-postası tekrar gönderildi');
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.refreshToken,
    onSuccess: _data => {
      // Update tokens
      if (_data.token) {
        AuthService.setTokens(_data.token, _data.refreshToken);
      }
      // Invalidate profile to refetch with new token
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile() });
    },
    onError: () => {
      // If refresh fails, logout user
      AuthService.logout();
    },
  });
};

// Custom hook for authentication state
export const useAuthState = () => {
  const profile = useProfile();
  const isAuthenticated = AuthService.isAuthenticated();
  const currentUser = AuthService.getCurrentUser();

  return {
    isAuthenticated,
    user: profile.data || currentUser,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
  };
};

// Custom hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuthState();

  const hasPermission = permission => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = role => {
    if (!user || !user.roles) return false;
    return user.roles.some(userRole => userRole.name === role);
  };

  const isAdmin = () => hasRole('admin');
  const isSuperAdmin = () => hasRole('super_admin');

  return {
    hasPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    permissions: user?.permissions || [],
    roles: user?.roles || [],
  };
};
