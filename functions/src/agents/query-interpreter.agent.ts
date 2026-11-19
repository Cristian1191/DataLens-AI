import { AIService } from '../services/ai.service';
import {
  AnalysisType,
  InterpretationIntent,
  QueryInterpretation,
} from './interpreter.types';

export class QueryInterpreterAgent {
  private aiService: AIService;
  private defaultModel: string;

  constructor(aiService: AIService, defaultModel = 'gpt-oss:20b') {
    this.aiService = aiService;
    this.defaultModel = defaultModel;
  }

  /**
   * System Prompt especializado para forzar respuesta JSON estructurada y rigurosa.
   */
  private buildSystemPrompt(): string {
    return `Eres el Agente Intérprete de Consultas de DataLens AI.
Tu ÚNICA función es analizar la intención analítica de la consulta del usuario y responder EXCLUSIVAMENTE con un objeto JSON válido, sin ningún texto adicional, sin saludos y sin explicaciones fuera del JSON.

ESTRUCTURA EXACTA DEL JSON DE RESPUESTA:
{
  "intent": "descriptive" | "comparison" | "trend" | "relationship" | "filter" | "informational" | "exploratory" | "ambiguous",
  "objective": "Descripción concisa en español del objetivo principal",
  "analysis_type": ["descriptive" | "comparative" | "time_series" | "correlation" | "distribution" | "filtering" | "advisory"],
  "variables": {
    "target": ["variable_objetivo"],
    "group_by": ["variable_agrupacion"],
    "time": ["variable_tiempo"]
  },
  "filters": [],
  "requested_metrics": ["promedio" | "suma" | "crecimiento" | "conteo" | "correlacion" | ...],
  "requirements": ["Requerimiento de datos para ejecutar el análisis"],
  "missing_information": ["Información o columnas faltantes para proceder"],
  "needs_clarification": true | false,
  "clarification_question": "Pregunta de aclaración si needs_clarification es true, o null si es false",
  "confidence": 0.0 a 1.0
}

REGLAS ESTRICTAS DE INTERPRETACIÓN:
1. No inventes columnas ni datos que el usuario no haya mencionado explícitamente.
2. Si todavía no se ha proporcionado un dataset, extrae las entidades mencionadas en la pregunta sin asumir el esquema completo.
3. Si la consulta es una pregunta informativa o general sobre qué análisis hacer (ej: "¿Qué tipo de análisis puedo hacer con mis datos?"), clasifícala como intent "informational", analysis_type ["advisory"], needs_clarification: false.
4. Si la consulta es ambigua o le falta definir la métrica o criterio de agrupación, activa needs_clarification: true y formula una pregunta clara en clarification_question.
5. Mantén siempre el idioma español.
6. Responde ÚNICAMENTE con el bloque JSON.`;
  }

  /**
   * Interpreta una consulta del usuario, invocando Ollama Cloud a través de AIService.
   * Cuenta con validación estricta y recuperación semántica controlada ante fallos.
   */
  public async interpret(
    userPrompt: string,
    modelToUse?: string
  ): Promise<QueryInterpretation> {
    const startTime = Date.now();
    const promptTrimmed = userPrompt.trim();

    if (!promptTrimmed) {
      return this.buildEmptyInterpretation();
    }

    const model = modelToUse || this.defaultModel;

    // 1. Invocar el backend de IA
    const aiResponse = await this.aiService.executeChat({
      provider: 'ollama',
      model,
      temperature: 0.1, // Baja temperatura para consistencia estructural
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: promptTrimmed },
      ],
    });

    const durationMs = Date.now() - startTime;

    // 2. Si la llamada a Ollama fue exitosa, intentar validar el JSON
    if (aiResponse.success && aiResponse.content) {
      const parsed = this.tryParseAndValidateJSON(aiResponse.content);
      if (parsed) {
        parsed.metadata = {
          rawPrompt: promptTrimmed,
          modelUsed: model,
          durationMs,
          source: 'ollama-cloud',
        };
        return parsed;
      }
    }

    // 3. Si Ollama falló (por ejemplo HTTP 402 créditos o JSON inválido),
    // ejecutar la recuperación controlada mediante el motor semántico de reglas.
    const fallback = this.fallbackSemanticInterpreter(promptTrimmed);
    fallback.metadata = {
      rawPrompt: promptTrimmed,
      modelUsed: model,
      durationMs,
      source: 'semantic-fallback',
      warning: aiResponse.error?.message
        ? `Ollama Cloud (${aiResponse.error.code}): ${aiResponse.error.message}`
        : 'Recuperación de contingencia aplicada.',
    };

    return fallback;
  }

  /**
   * Extrae, sanea y valida el JSON de la respuesta del LLM.
   */
  private tryParseAndValidateJSON(rawContent: string): QueryInterpretation | null {
    try {
      // Remover bloques de markdown tipo ```json ... ``` si existen
      let cleaned = rawContent.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      } else {
        // Encontrar el primer '{' y el último '}'
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
      }

      const obj = JSON.parse(cleaned);

      // Validar campos obligatorios mínimos
      if (!obj || typeof obj !== 'object') return null;
      if (!obj.intent || typeof obj.objective !== 'string') return null;

      // Normalizar estructura
      return {
        intent: this.validateIntent(obj.intent),
        objective: String(obj.objective),
        analysis_type: Array.isArray(obj.analysis_type)
          ? obj.analysis_type.map((t: string) => this.validateAnalysisType(t))
          : ['descriptive'],
        variables: {
          target: Array.isArray(obj.variables?.target) ? obj.variables.target.map(String) : [],
          group_by: Array.isArray(obj.variables?.group_by) ? obj.variables.group_by.map(String) : [],
          time: Array.isArray(obj.variables?.time) ? obj.variables.time.map(String) : [],
        },
        filters: Array.isArray(obj.filters) ? obj.filters : [],
        requested_metrics: Array.isArray(obj.requested_metrics) ? obj.requested_metrics.map(String) : [],
        requirements: Array.isArray(obj.requirements) ? obj.requirements.map(String) : [],
        missing_information: Array.isArray(obj.missing_information) ? obj.missing_information.map(String) : [],
        needs_clarification: Boolean(obj.needs_clarification),
        clarification_question: obj.clarification_question ? String(obj.clarification_question) : null,
        confidence: typeof obj.confidence === 'number' ? Math.min(Math.max(obj.confidence, 0), 1) : 0.85,
      };
    } catch {
      return null;
    }
  }

  private validateIntent(intent: string): InterpretationIntent {
    const validIntents: InterpretationIntent[] = [
      'descriptive',
      'comparison',
      'trend',
      'relationship',
      'filter',
      'informational',
      'exploratory',
      'ambiguous',
    ];
    return validIntents.includes(intent as InterpretationIntent)
      ? (intent as InterpretationIntent)
      : 'exploratory';
  }

  private validateAnalysisType(type: string): AnalysisType {
    const validTypes: AnalysisType[] = [
      'descriptive',
      'comparative',
      'time_series',
      'correlation',
      'distribution',
      'filtering',
      'advisory',
    ];
    return validTypes.includes(type as AnalysisType)
      ? (type as AnalysisType)
      : 'descriptive';
  }

  /**
   * Intérprete semántico de contingencia para garantizar respuestas deterministas y válidas
   * cuando el proveedor externo experimenta limitaciones de red o saldo (HTTP 402).
   */
  public fallbackSemanticInterpreter(prompt: string): QueryInterpretation {
    const lower = prompt.toLowerCase();

    // 1. Caso: Pregunta informativa / orientativa
    if (
      lower.includes('qué tipo de análisis') ||
      lower.includes('que tipo de analisis') ||
      lower.includes('puedo hacer con mis datos') ||
      lower.includes('cómo empezar') ||
      lower.includes('orientación')
    ) {
      return {
        intent: 'informational',
        objective: 'Explorar las capacidades analíticas disponibles para el dataset',
        analysis_type: ['advisory'],
        variables: { target: [], group_by: [], time: [] },
        filters: [],
        requested_metrics: ['capacidades_analiticas', 'resumen_dataset'],
        requirements: ['Cargar dataset para identificar tipología de variables (numéricas, categóricas, fechas)'],
        missing_information: ['Dataset no cargado o sin metadatos definidos'],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.98,
      };
    }

    // 2. Caso: Relación / Correlación (ej: "Analiza la relación entre edad e ingresos")
    if (lower.includes('relación') || lower.includes('relacion') || lower.includes('correlación') || lower.includes('correlacion')) {
      const vars: string[] = [];
      const match = lower.match(/(?:entre|de)\s+([a-záéíóúñ]+)\s+(?:e|y|con)\s+([a-záéíóúñ]+)/i);
      if (match) {
        vars.push(match[1].trim(), match[2].trim());
      }

      return {
        intent: 'relationship',
        objective: `Analizar la correlación o relación estadística entre ${vars.join(' y ') || 'las variables indicadas'}`,
        analysis_type: ['correlation', 'distribution'],
        variables: {
          target: vars.length > 0 ? vars : ['variable_x', 'variable_y'],
          group_by: [],
          time: [],
        },
        filters: [],
        requested_metrics: ['coeficiente_pearson', 'covarianza', 'r2'],
        requirements: ['Ambas variables deben ser cuantitativas continuas o discretas'],
        missing_information: vars.length === 0 ? ['Identificar variables exactas a correlacionar'] : [],
        needs_clarification: vars.length === 0,
        clarification_question: vars.length === 0 ? '¿Entre cuáles dos variables deseas evaluar la correlación?' : null,
        confidence: 0.95,
      };
    }

    // 3. Caso: Comparativa (ej: "Compara las ventas entre regiones")
    if (lower.includes('compara') || lower.includes('diferencia entre') || lower.includes('versus') || lower.includes(' vs ')) {
      let targetVar = 'ventas';
      let groupVar = 'región';

      const matchTarget = lower.match(/compara\s+(?:las|los)?\s*([a-záéíóúñ]+)/i);
      if (matchTarget) targetVar = matchTarget[1].trim();

      const matchGroup = lower.match(/(?:entre|por)\s+([a-záéíóúñ]+)/i);
      if (matchGroup) groupVar = matchGroup[1].trim();

      return {
        intent: 'comparison',
        objective: `Comparar la variable ${targetVar} segmentada por ${groupVar}`,
        analysis_type: ['comparative', 'descriptive'],
        variables: {
          target: [targetVar],
          group_by: [groupVar],
          time: [],
        },
        filters: [],
        requested_metrics: ['diferencia_relativa', 'media_por_grupo', 'mediana_por_grupo'],
        requirements: [`Variable objetivo ${targetVar} numérica y variable de segmentación ${groupVar} categórica`],
        missing_information: [],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.94,
      };
    }

    // 4. Caso: Crecimiento o Series Temporales (ej: "Encuentra los meses con mayor crecimiento")
    if (lower.includes('crecimiento') || lower.includes('meses') || lower.includes('tendencia') || lower.includes('evolución') || lower.includes('evolucion')) {
      const timeUnit = lower.includes('mes') ? 'mes' : lower.includes('año') || lower.includes('ano') ? 'año' : 'periodo_temporal';
      return {
        intent: 'trend',
        objective: `Identificar picos y tendencias de crecimiento temporal agrupados por ${timeUnit}`,
        analysis_type: ['time_series', 'comparative'],
        variables: {
          target: ['crecimiento', 'valor'],
          group_by: [],
          time: [timeUnit],
        },
        filters: [],
        requested_metrics: ['tasa_crecimiento_interperiodo', 'maximo', 'tendencia_lineal'],
        requirements: ['Columna con formato de fecha o periodo temporal secuencial'],
        missing_information: ['Confirmar la métrica sobre la cual calcular el crecimiento'],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.92,
      };
    }

    // 5. Caso: Filtrado (ej: "Filtra los registros del año 2025")
    if (lower.includes('filtra') || lower.includes('solo registros') || lower.includes('donde') || lower.match(/\b\d{4}\b/)) {
      const yearMatch = lower.match(/\b(19\d{2}|20\d{2})\b/);
      const filterYear = yearMatch ? yearMatch[1] : undefined;

      return {
        intent: 'filter',
        objective: `Filtrar y aislar subconjunto de datos${filterYear ? ` para el periodo ${filterYear}` : ''}`,
        analysis_type: ['filtering', 'descriptive'],
        variables: {
          target: [],
          group_by: [],
          time: filterYear ? ['año'] : [],
        },
        filters: filterYear
          ? [{ column: 'año', operator: '==', value: Number(filterYear), rawExpression: `año == ${filterYear}` }]
          : ['condicion_filtro_a_especificar'],
        requested_metrics: ['conteo_registros_filtrados', 'porcentaje_total'],
        requirements: ['Columna de filtrado presente en el dataset'],
        missing_information: filterYear ? [] : ['Condición explícita de filtrado'],
        needs_clarification: !filterYear,
        clarification_question: !filterYear ? '¿Qué condición o valor deseas utilizar como filtro?' : null,
        confidence: 0.95,
      };
    }

    // 6. Caso: Promedio / Descriptivo (ej: "Calcula el promedio de ventas")
    if (lower.includes('promedio') || lower.includes('media') || lower.includes('mediana') || lower.includes('descriptivo') || lower.includes('resumen')) {
      let target = 'ventas';
      const match = lower.match(/(?:promedio|media|mediana)\s+(?:de\s+)?([a-záéíóúñ]+)/i);
      if (match) target = match[1].trim();

      return {
        intent: 'descriptive',
        objective: `Calcular la media aritmética y medidas de tendencia central de ${target}`,
        analysis_type: ['descriptive'],
        variables: {
          target: [target],
          group_by: [],
          time: [],
        },
        filters: [],
        requested_metrics: ['media_aritmetica', 'desviacion_estandar', 'mediana', 'minimo', 'maximo'],
        requirements: [`Variable ${target} cuantitativa numérica sin valores nulos`],
        missing_information: [],
        needs_clarification: false,
        clarification_question: null,
        confidence: 0.96,
      };
    }

    // Fallback genérico para consultas no estructuradas o ambiguas
    return {
      intent: 'ambiguous',
      objective: `Interpretar la consulta: "${prompt.slice(0, 50)}..."`,
      analysis_type: ['exploratory' as any],
      variables: { target: [], group_by: [], time: [] },
      filters: [],
      requested_metrics: [],
      requirements: ['Se requiere especificar una variable métrica o un objetivo claro'],
      missing_information: ['Variables de análisis no identificadas con suficiente certeza'],
      needs_clarification: true,
      clarification_question: `¿Podrías especificar qué métrica o variable te gustaría analizar en "${prompt.slice(0, 30)}..."?`,
      confidence: 0.65,
    };
  }

  private buildEmptyInterpretation(): QueryInterpretation {
    return {
      intent: 'ambiguous',
      objective: 'Consulta vacía sin parámetros identificables',
      analysis_type: ['descriptive'],
      variables: { target: [], group_by: [], time: [] },
      filters: [],
      requested_metrics: [],
      requirements: [],
      missing_information: ['El usuario no ingresó texto en la consulta'],
      needs_clarification: true,
      clarification_question: '¿Qué análisis o cálculo deseas realizar?',
      confidence: 0.0,
    };
  }
}
