import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password, role }) =>
      role === 'partner'
        ? authApi.loginPartner({ email, password })
        : authApi.loginUser({ email, password }),
    onSuccess: (res, vars) => {
      const { account, accessToken } = res.data;
      setAuth(account, accessToken, vars.role);
      navigate(vars.role === 'partner' ? '/partner/dashboard' : '/');
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ name, email, password, role }) =>
      role === 'partner'
        ? authApi.registerPartner({ name, email, password })
        : authApi.registerUser({ name, email, password }),
    onSuccess: (res, vars) => {
      const { account, accessToken } = res.data;
      setAuth(account, accessToken, vars.role);
      navigate(vars.role === 'partner' ? '/partner/dashboard' : '/');
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      navigate('/login');
    },
  });
}
