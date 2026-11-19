import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase';
import {
  AIQueryOptions,
  AIQueryResult,
  BackendExecutionInfo,
  QueryInterpretation,
} from './ai.types';

/**
 * Servicio del Frontend para invocar el backend seguro de Firebase Cloud Functions
 * (sin exponer API Keys en el cliente).
 */
export class BackendAIService {
  private functionsInstance = getFunctions(app);

  /**
   * Invoca el Agente Intérprete de Consultas (Fase 3).
   * Envía la consulta al backend, donde Ollama Cloud o el motor semántico de contingencia
   * devuelven la estructura analítica normalizada.
   */
  public async interpretQuery(
    query: string,
    model?: string
  ): Promise<{ success: boolean; interpretation: QueryInterpretation; error?: string }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        success: false,
        interpretation: this.getLocalFallbackInterpretation(query),
        error: 'La consulta no puede estar vacía.',
      };
    }

    try {
      const callable = httpsCallable<
        { query: string; model?: string },
        { success: boolean; interpretation: QueryInterpretation }
      >(this.functionsInstance, 'interpretQuery');

      const result = await callable({
        query: trimmed,
        model,
      });

      if (result.data?.success && result.data?.interpretation) {
        return {
          success: true,
          interpretation: result.data.interpretation,
        };
      }
    } catch (err: any) {
      console.warn('[BackendAIService] Cloud Function interpretQuery no disponible o con aviso:', err);
    }

    // Fallback de contingencia local si la función en la nube no está desplegada aún en local
    const fallback = this.getLocalFallbackInterpretation(trimmed);
    return {
      success: true,
      interpretation: fallback,
    };
  }

  /**
   * Envía una consulta de chat al backend de Firebase Functions.
   */
  public async queryModel(prompt: string, options?: AIQueryOptions): Promise<AIQueryResult> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return {
        success: false,
        content: '',
        error: 'La consulta no puede estar vacía.',
      };
    }

    try {
      const callable = httpsCallable<
        { prompt: string; model?: string; history?: unknown[] },
        { success: boolean; content: string; executionInfo?: BackendExecutionInfo }
      >(this.functionsInstance, 'queryModel');

      const result = await callable({
        prompt: trimmed,
        model: options?.model,
        history: options?.history,
      });

      return {
        success: true,
        content: result.data.content,
        executionInfo: result.data.executionInfo,
      };
    } catch (err: any) {
      console.warn('[BackendAIService] Error recibido de Cloud Function queryModel:', err);
      const message =
        err?.details?.message ||
        err?.message ||
        'Error desconocido al procesar la consulta en el servidor.';

      return {
        success: false,
        content: '',
        error: message,
      };
    }
  }

  /**
   * Intérprete semántico de contingencia local para pruebas de frontend inmediatas
   */
  private getLocalFallbackInterpretation(prompt: string): QueryInterpretation {
    const lower = prompt.toLowerCase();

    if (lower.includes('promedio') || lower.includes('media') || lower.includes('mediana')) {
      const match = lower.match(/(?:promedio|media)\s+(?:de\s+)?([a-záéíóúñ]+)/i);
      const target = match ? match[1].trim() : 'ventas';
      return {
        intent: 'descriptive',
        objective: `Calcular la media aritmética y dispersión de ${target}`,
        analysis_type: ['descriptive'],
        variables: { target: [target], group_by: [], time: [] },
        filters: [],
        requested_metrics: ['media_aritmetica', 'desviacion_estandar', 'mediana'],
        requirements: [`Variable ${target} numérica continua`],
        missing_information: [],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.96,
        metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
      };
    }

    if (lower.includes('compara') || lower.includes('diferencia') || lower.includes(' vs ')) {
      let target = 'ventas';
      let group = 'región';
      const matchTarget = lower.match(/compara\s+(?:las|los)?\s*([a-záéíóúñ]+)/i);
      if (matchTarget) target = matchTarget[1].trim();
      const matchGroup = lower.match(/(?:entre|por)\s+([a-záéíóúñ]+)/i);
      if (matchGroup) group = matchGroup[1].trim();

      return {
        intent: 'comparison',
        objective: `Comparar ${target} entre distintas categorías de ${group}`,
        analysis_type: ['comparative', 'descriptive'],
        variables: { target: [target], group_by: [group], time: [] },
        filters: [],
        requested_metrics: ['diferencia_relativa', 'media_por_grupo'],
        requirements: [`Variable métrica ${target} y variable de segmentación ${group}`],
        missing_information: [],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.94,
        metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
      };
    }

    if (lower.includes('crecimiento') || lower.includes('meses') || lower.includes('tendencia')) {
      return {
        intent: 'trend',
        objective: 'Identificar picos y tendencias de crecimiento temporal por mes',
        analysis_type: ['time_series', 'comparative'],
        variables: { target: ['crecimiento', 'valor'], group_by: [], time: ['mes'] },
        filters: [],
        requested_metrics: ['tasa_crecimiento_interperiodo', 'maximo'],
        requirements: ['Columna de fechas o periodos secuenciales'],
        missing_information: ['Confirmar métrica base para el cálculo de crecimiento'],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.92,
        metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
      };
    }

    if (lower.includes('filtra') || lower.match(/\b\d{4}\b/)) {
      const yearMatch = lower.match(/\b(19\d{2}|20\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : '2025';
      return {
        intent: 'filter',
        objective: `Filtrar y aislar subconjunto de datos para el año ${year}`,
        analysis_type: ['filtering', 'descriptive'],
        variables: { target: [], group_by: [], time: ['año'] },
        filters: [{ column: 'año', operator: '==', value: Number(year), rawExpression: `año == ${year}` }],
        requested_metrics: ['conteo_registros_filtrados', 'porcentaje_total'],
        requirements: ['Columna de filtrado temporal presente en el dataset'],
        missing_information: [],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.95,
        metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
      };
    }

    if (lower.includes('relación') || lower.includes('relacion') || lower.includes('correlación')) {
      return {
        intent: 'relationship',
        objective: 'Analizar la correlación estadística entre variables cuantitativas',
        analysis_type: ['correlation', 'distribution'],
        variables: { target: ['edad', 'ingresos'], group_by: [], time: [] },
        filters: [],
        requested_metrics: ['coeficiente_pearson', 'covarianza'],
        requirements: ['Ambas variables numéricas'],
        missing_information: [],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.95,
        metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
      };
    }

    if (lower.includes('qué tipo de análisis') || lower.includes('que tipo de analisis') || lower.includes('puedo hacer')) {
      return {
        intent: 'informational',
        objective: 'Explorar las capacidades analíticas disponibles para el dataset',
        analysis_type: ['advisory'],
        variables: { target: [], group_by: [], time: [] },
        filters: [],
        requested_metrics: ['capacidades_analiticas', 'resumen_dataset'],
        requirements: ['Cargar dataset para determinar tipología de datos'],
        missing_information: ['Dataset no provisto'],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.98,
        metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
      };
    }

    return {
      intent: 'ambiguous',
      objective: `Interpretar la consulta: "${prompt.slice(0, 40)}..."`,
      analysis_type: ['descriptive'],
      variables: { target: [], group_by: [], time: [] },
      filters: [],
      requested_metrics: [],
      requirements: ['Definir métrica u objetivo de análisis'],
      missing_information: ['Variables analíticas no identificadas con certeza'],
      needs_clarification: true,
      clarification_question: `¿Podrías especificar qué métrica o variable deseas analizar en "${prompt.slice(0, 30)}..."?`,
      confidence: 0.65,
      metadata: { rawPrompt: prompt, source: 'semantic-fallback' },
    };
  }
}

export const defaultBackendAIService = new BackendAIService();
