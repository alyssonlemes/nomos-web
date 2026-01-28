interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface ErrorResponse {
  detail: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class AuthService {
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        } as LoginRequest),
      });

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao fazer login');
      }

      const data: LoginResponse = await response.json();
      
      // Armazenar token no localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
  }

  static getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
