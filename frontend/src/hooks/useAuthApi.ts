import { useMutation } from '@tanstack/react-query';
import { fetchApi, useAuth } from '../context/AuthContext';

// Helper to decode JWT token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetchApi('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        let errMsg = 'Invalid credentials';
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }

      return response.json();
    },
    onSuccess: (data) => {
      const decoded = parseJwt(data.access_token);
      if (decoded) {
        login(data.access_token, decoded.sub, decoded.role);
      }
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (userData: { username: string; password: string; role: string }) => {
      const response = await fetchApi('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      return response.json();
    },
  });
}
