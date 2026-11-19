/**
 * DataLens AI — Fase 4: Registro de proveedores
 *
 * Mantiene un registro de adaptadores de proveedores disponibles.
 * Permite seleccionar el proveedor adecuado según la intención,
 * el tipo de análisis y la configuración del usuario.
 *
 * Extensible: para añadir un nuevo proveedor, basta con:
 *   1. Implementar ProviderAdapter
 *   2. Registrarlo aquí con providerRegistry.register(adapter)
 */

import type {
  ProviderAdapter,
  ProviderHealth,
  SystemHealthState,
} from './orchestration.types';
import type { QueryInterpretation } from '../ai/ai.types';

export class ProviderRegistry {
  private providers: Map<string, ProviderAdapter> = new Map();

  /**
   * Registra un adaptador de proveedor.
   * Si ya existe uno con el mismo id, lo reemplaza.
   */
  register(adapter: ProviderAdapter): void {
    this.providers.set(adapter.id, adapter);
  }

  /**
   * Obtiene un proveedor por su id.
   */
  get(id: string): ProviderAdapter | undefined {
    return this.providers.get(id);
  }

  /**
   * Lista todos los proveedores registrados.
   */
  listAll(): ProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  /**
   * Lista los ids de todos los proveedores registrados.
   */
  listIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Selecciona el proveedor más adecuado según la interpretación.
   *
   * Lógica de selección:
   * - Por defecto, usa DeepSeek para análisis especializados.
   * - Si DeepSeek no está registrado o está excluido, retorna null.
   * - Futuro: lógica más sofisticada basada en intent/analysis_type.
   *
   * Esta función NO ejecuta health checks; solo selecciona por configuración.
   */
  selectProvider(
    interpretation: QueryInterpretation,
    skipProviders?: string[]
  ): ProviderAdapter | null {
    const excluded = new Set(skipProviders ?? []);

    // Mapeo de intención a proveedor preferido
    // Todos los análisis estadísticos/comparativos se envían a DeepSeek
    const analyticalIntents = new Set([
      'descriptive', 'comparison', 'trend', 'relationship', 'filter', 'exploratory',
    ]);

    if (analyticalIntents.has(interpretation.intent)) {
      const deepseek = this.providers.get('deepseek');
      if (deepseek && !excluded.has('deepseek')) {
        return deepseek;
      }
    }

    // Para consultas informacionales o ambiguas, no se necesita proveedor especializado
    // (la interpretación de Fase 3 es suficiente)
    if (interpretation.intent === 'informational' || interpretation.intent === 'ambiguous') {
      return null;
    }

    // Fallback: intentar cualquier proveedor registrado que no esté excluido
    for (const [id, adapter] of this.providers) {
      if (!excluded.has(id)) {
        return adapter;
      }
    }

    return null;
  }

  /**
   * Ejecuta health check en todos los proveedores registrados.
   */
  async checkAllHealth(): Promise<SystemHealthState> {
    const healthResults: Record<string, ProviderHealth> = {};

    const checks = this.listAll().map(async (adapter) => {
      const health = await adapter.checkHealth();
      healthResults[adapter.id] = health;
    });

    await Promise.allSettled(checks);

    return {
      providers: healthResults,
      lastChecked: Date.now(),
    };
  }
}

/** Instancia singleton del registro de proveedores */
export const providerRegistry = new ProviderRegistry();
