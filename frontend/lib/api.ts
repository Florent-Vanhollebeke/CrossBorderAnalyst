// ============================================
// SwissRelocator - API Client
// frontend/lib/api.ts
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const REQUEST_TIMEOUT_MS = 15_000;

/** Mappe les codes HTTP vers des messages utilisateur sans révéler l'internale. */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Paramètres invalides.',
  401: 'Authentification requise.',
  403: 'Accès refusé.',
  404: 'Ressource introuvable.',
  429: 'Trop de requêtes. Réessayez dans une minute.',
  500: 'Erreur serveur temporaire.',
  503: 'Service indisponible.',
};

// ============================================
// TYPES
// ============================================

export type SupportedCity = 'Geneve' | 'Lausanne' | 'Zurich' | 'Basel';
export type PropertyType = 'bureau' | 'commercial';

export interface PredictRentRequest {
  city: SupportedCity | string;
  surface: number;
  latitude?: number;
  longitude?: number;
  pieces?: number;
  etage?: number;
  has_parking?: boolean;
  has_lift?: boolean;
  property_type?: PropertyType;
}

export interface PredictRentResponse {
  predicted_rent_chf: number;
  predicted_rent_eur: number;
  price_per_m2_chf: number;
  confidence_range: {
    min_chf: number;
    max_chf: number;
    mae_chf: number;
  };
  city: string;
  surface: number;
  model_info: {
    model_type: string;
    r2_score: number;
    training_data: string;
    last_updated: string;
  };
}

export interface ModelInfoResponse {
  model_type: string;
  r2_score: number;
  mae_chf: number;
  features_count: number;
  features: string[];
  supported_cities: string[];
  last_trained: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  model_loaded: boolean;
  scaler_loaded: boolean;
  features_loaded: boolean;
}

export type FiscalCity = 'Lyon' | 'Geneve' | 'Lausanne' | 'Zurich' | 'Basel';

export interface CompareFiscalRequest {
  revenue_annual: number;
  salary_director: number;
  num_employees: number;
  city: FiscalCity;
  average_employee_salary?: number;
}

export interface CompareFiscalResponse {
  city: string;
  country: string;
  currency: string;
  corporate_tax_rate: number;
  corporate_tax_amount: number;
  employer_social_charges_rate: number;
  employer_social_charges_amount: number;
  employee_social_charges_rate: number;
  employee_social_charges_amount: number;
  total_employer_cost: number;
  net_result: number;
  input: {
    revenue_annual: number;
    salary_director: number;
    num_employees: number;
    average_employee_salary: number;
    total_gross_salaries: number;
    original_currency: string;
    local_currency: string;
    eur_to_chf_rate: number | null;
  };
}

export interface ApiError {
  detail: string;
  status: number;
}

// ============================================
// API CLIENT CLASS
// ============================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const userMessage =
          HTTP_ERROR_MESSAGES[response.status] ?? 'Une erreur est survenue.';
        throw { detail: userMessage, status: response.status } as ApiError;
      }

      return response.json();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw { detail: 'La requête a expiré. Réessayez.', status: 408 } as ApiError;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============================================
  // ML PREDICTIONS
  // ============================================

  /**
   * Predit le loyer mensuel d'un bien immobilier commercial en Suisse
   * @param data - Donnees du bien (ville, surface, etc.)
   * @returns Prediction avec fourchette de confiance
   */
  async predictRent(data: PredictRentRequest): Promise<PredictRentResponse> {
    return this.request<PredictRentResponse>('/api/v1/predict-rent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Recupere les informations sur le modele ML
   */
  async getModelInfo(): Promise<ModelInfoResponse> {
    return this.request<ModelInfoResponse>('/api/v1/model-info');
  }

  /**
   * Verifie l'etat de l'API ML
   */
  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/v1/health');
  }

  // ============================================
  // FISCAL COMPARISON
  // ============================================

  async compareFiscal(data: CompareFiscalRequest): Promise<CompareFiscalResponse> {
    return this.request<CompareFiscalResponse>('/api/v1/compare-fiscal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const api = new ApiClient();

// ============================================
// REACT HOOKS HELPERS
// ============================================

/**
 * Normalise le nom de ville pour l'API
 */
export function normalizeCity(city: string): SupportedCity {
  const normalized = city.toLowerCase().trim();
  const mapping: Record<string, SupportedCity> = {
    'geneve': 'Geneve',
    'genève': 'Geneve',
    'geneva': 'Geneve',
    'genf': 'Geneve',
    'lausanne': 'Lausanne',
    'zurich': 'Zurich',
    'zürich': 'Zurich',
    'basel': 'Basel',
    'bale': 'Basel',
    'bâle': 'Basel',
  };
  return mapping[normalized] || 'Geneve';
}

/**
 * Formate un prix en CHF
 */
export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate un prix en EUR
 */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
