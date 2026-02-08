interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
}

interface ErrorResponse {
  detail: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        } as LoginRequest),
      });

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao fazer login');
      }

      const data: LoginResponse = await response.json();
      
      // Armazenar token e data de expiração no localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      localStorage.setItem('expires_at', data.expires_at);

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
    localStorage.removeItem('expires_at');
    localStorage.removeItem('user');
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
    const token = this.getToken();
    if (!token) return false;
    
    // Verificar se o token está expirado
    if (this.isTokenExpired()) {
      this.handleTokenExpired();
      return false;
    }
    
    return true;
  }

  /**
   * Verificar se o token está expirado
   */
  static isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('expires_at');
    if (!expiresAt) return true;
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    return now >= expirationDate;
  }

  /**
   * Obter quantos minutos faltam para o token expirar
   */
  static getMinutesUntilExpiration(): number | null {
    const expiresAt = localStorage.getItem('expires_at');
    if (!expiresAt) return null;
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    const diffInMs = expirationDate.getTime() - now.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    return diffInMinutes > 0 ? diffInMinutes : 0;
  }

  /**
   * Verificar se o token está próximo de expirar (menos de 5 minutos)
   */
  static isTokenExpiringSoon(): boolean {
    const minutes = this.getMinutesUntilExpiration();
    return minutes !== null && minutes < 5 && minutes > 0;
  }

  /**
   * Tratar token expirado
   */
  static handleTokenExpired(): void {
    this.logout();
    window.location.href = '/login';
  }

  /**
   * Verificar se a resposta é um erro de autenticação (token expirado/inválido)
   * Se for 401, faz logout e redireciona para login
   */
  static handleAuthError(response: Response): void {
    if (response.status === 401) {
      this.logout();
      window.location.href = '/login';
    }
  }

  /**
   * Verificar se o token está válido antes de fazer uma requisição
   * Retorna true se está válido, false se expirou (e redireciona para login)
   */
  static checkTokenBeforeRequest(): boolean {
    if (this.isTokenExpired()) {
      this.handleTokenExpired();
      return false;
    }
    return true;
  }

  /**
   * Fazer fetch com verificação automática de token e tratamento de erros 401
   * Lança erro se o token estiver expirado
   */
  static async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Verificar se o token está expirado antes de fazer a requisição
    if (!this.checkTokenBeforeRequest()) {
      throw new Error('Token expirado');
    }

    // Adicionar header de autorização
    const authHeader = this.getAuthHeader();
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    };

    // Fazer a requisição
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Verificar se houve erro 401
    if (response.status === 401) {
      this.handleAuthError(response);
      throw new Error('Não autorizado');
    }

    return response;
  }
}
