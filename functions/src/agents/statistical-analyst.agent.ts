/**
 * DataLens AI - Agente Analista Estadístico Inteligente (Fase 4)
 * Núcleo de razonamiento analítico: determina procedimientos estadísticos adecuados
 * a partir de la intención (Fase 3) y los metadatos del dataset.
 * 
 * PROHIBIDO: Permitir que el LLM invente valores estadísticos o cálculos numéricos.
 * Solo genera y valida el PLAN analítico ejecutable.
 */

import { QueryInterpretation } from './interpreter.types';
import {
  AnalysisMethodPlan,
  DatasetMetadata,
  PlanStatus,
  StatisticalAnalysisPlan,
} from './analyst.types';
import { StatisticalMethodRegistry } from './statistical-method.registry';
import { AnalysisValidator } from './analysis.validator';
import { IDeepSeekClient } from '../providers/deepseek.provider';

export class StatisticalAnalystAgent {
  private deepSeekClient: IDeepSeekClient;
  private defaultModel: string;

  constructor(deepSeekClient: IDeepSeekClient, defaultModel = 'deepseek-v4.1-flash') {
    this.deepSeekClient = deepSeekClient;
    this.defaultModel = defaultModel;
  }

  /**
   * Genera el plan de análisis estadístico a partir de la consulta interpretada y los metadatos del dataset.
   */
  public async createAnalysisPlan(
    interpretation: QueryInterpretation,
    dataset: DatasetMetadata,
    modelOverride?: string
  ): Promise<StatisticalAnalysisPlan> {
    const startTime = Date.now();
    const modelToUse = modelOverride || this.defaultModel;

    // 1. Manejo temprano de consultas ambiguas o vacías
    if (interpretation.intent === 'ambiguous' || interpretation.needs_clarification) {
      return this.buildClarificationPlan(interpretation, dataset, startTime, modelToUse);
    }

    // 2. Construcción del Prompt especializado
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(interpretation, dataset);

    // 3. Inferencia con DeepSeek-R1
    const inferenceResponse = await this.deepSeekClient.generateReasoning(
      systemPrompt,
      userPrompt,
      { model: modelToUse, temperature: 0.1 }
    );

    const durationMs = Date.now() - startTime;

    // 4. Procesar respuesta del modelo si fue exitosa
    if (inferenceResponse.success && inferenceResponse.content) {
      const parsedPlan = this.parseModelResponse(
        inferenceResponse.content,
        interpretation,
        dataset,
        durationMs,
        modelToUse
      );

      if (parsedPlan) {
        // Validación determinista del plan
        const validation = AnalysisValidator.validate(parsedPlan, dataset);
        parsedPlan.validation = validation;
        parsedPlan.status = validation.valid ? 'success' : 'invalid_plan';
        return parsedPlan;
      }
    }

    // 5. Fallback metodológico determinista ante errores de inferencia (ej. HTTP 402)
    const fallbackPlan = this.generateMethodologicalPlan(
      interpretation,
      dataset,
      durationMs,
      modelToUse,
      inferenceResponse.error?.message
    );

    const validation = AnalysisValidator.validate(fallbackPlan, dataset);
    fallbackPlan.validation = validation;
    fallbackPlan.status = validation.valid ? 'success' : 'invalid_plan';

    return fallbackPlan;
  }

  /**
   * Construye el System Prompt con el catálogo cerrado de métodos y formato JSON obligatorio.
   */
  private buildSystemPrompt(): string {
    const methodsCatalog = StatisticalMethodRegistry.getAllMethods()
      .map((m) => `- ID: "${m.id}" | Nombre: "${m.name}" | Categoría: "${m.category}" | Mínimo n=${m.minSampleSize} | Supuestos: ${m.assumptionsToCheck.join('; ')} | execution_id: "${m.executionId}"`)
      .join('\n');

    return `Eres el Agente Analista Estadístico de DataLens AI.
Tu función es diseñar un plan metodológico estadístico riguroso, justificable y ejecutable para responder a la consulta del usuario, considerando los metadatos del dataset.

REGLAS ESTRICTAS:
1. No calcules valores estadísticos, medias, p-values ni conclusiones cuantitativas. El cálculo lo realizará un motor matemático en Python.
2. Utiliza ÚNICAMENTE los métodos existentes en el siguiente catálogo oficial:
${methodsCatalog}
3. Las variables seleccionadas en "input_variables" DEBEN existir en las columnas del dataset.
4. Responde EXCLUSIVAMENTE con un objeto JSON válido con schema_version "1.0", sin explicaciones ni texto fuera del JSON.

ESTRUCTURA EXACTA DEL JSON DE RESPUESTA:
{
  "schema_version": "1.0",
  "agent": "statistical_analyst",
  "status": "success",
  "objective": "Objetivo estadístico formal",
  "analysis_plan": {
    "dataset_requirements": ["Requisitos de datos necesarios"],
    "variables": ["lista_de_variables_utilizadas"],
    "methods": [
      {
        "method_id": "id_del_catalogo",
        "purpose": "Justificación metodológica específica",
        "input_variables": ["columna_1", "columna_2"],
        "assumptions_to_check": ["supuestos estadísticos a verificar antes o durante el cálculo"],
        "alternatives": ["método alternativo si fallan los supuestos"],
        "execution_id": "execution_id_del_catalogo"
      }
    ]
  },
  "validation": { "valid": true, "errors": [], "warnings": [] },
  "execution_required": true,
  "reasoning_summary": "Justificación metodológica breve de la elección de los métodos"
}`;
  }

  /**
   * Construye el prompt con la intención del usuario y los metadatos completos del dataset.
   */
  private buildUserPrompt(interpretation: QueryInterpretation, dataset: DatasetMetadata): string {
    const columnsSummary = dataset.columns
      .map((c) => `  - Columna: "${c.name}" | Tipo: ${c.type} | Nulos: ${c.nullCount}/${c.totalCount} | Cardinalidad: ${c.cardinality}${c.sampleValues ? ` | Muestra: [${c.sampleValues.slice(0, 3).join(', ')}]` : ''}`)
      .join('\n');

    return `CONSULTA INTERPRETADA (Fase 3):
- Intención: ${interpretation.intent}
- Objetivo: "${interpretation.objective}"
- Tipos de análisis: ${JSON.stringify(interpretation.analysis_type)}
- Variables mencionadas por usuario: Target: [${interpretation.variables.target.join(', ')}], GroupBy: [${interpretation.variables.group_by.join(', ')}], Time: [${interpretation.variables.time.join(', ')}]
- Métricas solicitadas: [${interpretation.requested_metrics.join(', ')}]

METADATOS DEL DATASET:
- ID Dataset: "${dataset.datasetId}"
- Total de filas (n): ${dataset.rowCount}
- Total de columnas: ${dataset.columnCount}
- Columnas disponibles:
${columnsSummary}

Genera el plan estadístico riguroso correspondiente en formato JSON.`;
  }

  private parseModelResponse(
    rawContent: string,
    interpretation: QueryInterpretation,
    dataset: DatasetMetadata,
    durationMs: number,
    modelUsed: string
  ): StatisticalAnalysisPlan | null {
    try {
      let cleaned = rawContent.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      } else {
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          cleaned = cleaned.substring(first, last + 1);
        }
      }

      const obj = JSON.parse(cleaned);
      if (!obj || typeof obj !== 'object' || !obj.analysis_plan?.methods) {
        return null;
      }

      return {
        schema_version: '1.0',
        agent: 'statistical_analyst',
        status: 'success',
        objective: obj.objective || interpretation.objective,
        analysis_plan: {
          dataset_requirements: Array.isArray(obj.analysis_plan.dataset_requirements) ? obj.analysis_plan.dataset_requirements : [],
          variables: Array.isArray(obj.analysis_plan.variables) ? obj.analysis_plan.variables : [],
          methods: Array.isArray(obj.analysis_plan.methods) ? obj.analysis_plan.methods : [],
        },
        validation: { valid: true, errors: [], warnings: [] },
        execution_required: true,
        reasoning_summary: obj.reasoning_summary || 'Plan estadístico formulado por DeepSeek-R1.',
        metadata: {
          modelUsed,
          durationMs,
          source: 'deepseek-r1',
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Generador determinista de planes metodológicos de alta fidelidad.
   * Selecciona las pruebas estadísticas adecuadas basándose en la tipología y diseño de datos.
   */
  public generateMethodologicalPlan(
    interpretation: QueryInterpretation,
    dataset: DatasetMetadata,
    durationMs: number,
    modelUsed: string,
    warning?: string
  ): StatisticalAnalysisPlan {
    const methods: AnalysisMethodPlan[] = [];
    const usedVariables: string[] = [];
    let reasoning = '';

    const colMap = new Map<string, string>(); // lowercase name -> actual name
    for (const c of dataset.columns) {
      colMap.set(c.name.toLowerCase().trim(), c.name);
    }

    const resolveCol = (name: string): string => {
      return colMap.get(name.toLowerCase().trim()) || name;
    };

    const firstNumeric = dataset.columns.find((c) => c.type === 'numeric')?.name || 'ventas';
    const firstCategorical = dataset.columns.find((c) => c.type === 'categorical' || c.type === 'boolean')?.name || 'región';

    // Selección por intención analítica
    switch (interpretation.intent) {
      case 'comparison': {
        const targetCol = resolveCol(interpretation.variables.target[0] || firstNumeric);
        const groupCol = resolveCol(interpretation.variables.group_by[0] || firstCategorical);
        const groupMeta = dataset.columns.find((c) => c.name === groupCol);
        const cardinality = groupMeta?.cardinality ?? 2;

        usedVariables.push(targetCol, groupCol);

        if (cardinality <= 2) {
          reasoning = `Para comparar "${targetCol}" entre dos grupos de "${groupCol}", se programa una prueba t de Student independiente junto a verificación previa de normalidad y homocedasticidad (Levene). En caso de no normalidad, se ejecutará Mann-Whitney U.`;
          methods.push(
            {
              method_id: 'distribution_normality',
              purpose: `Verificar supuesto de normalidad en la distribución de ${targetCol}`,
              input_variables: [targetCol],
              assumptions_to_check: ['Observaciones independientes'],
              alternatives: ['mann_whitney_u'],
              execution_id: 'py_stats_distribution_normality',
            },
            {
              method_id: 'independent_t_test',
              purpose: `Comparar las medias de ${targetCol} entre los niveles de ${groupCol}`,
              input_variables: [targetCol, groupCol],
              assumptions_to_check: ['Normalidad (Shapiro-Wilk)', 'Igualdad de varianzas (Levene)'],
              alternatives: ['mann_whitney_u'],
              execution_id: 'py_stats_independent_t_test',
            }
          );
        } else {
          reasoning = `Al existir más de 2 grupos en "${groupCol}" (k=${cardinality}), el procedimiento estándar es ANOVA de un factor con verificación de homocedasticidad y prueba post-hoc de Tukey. Si se rechaza la normalidad, se recurrirá a Kruskal-Wallis.`;
          methods.push(
            {
              method_id: 'one_way_anova',
              purpose: `Comparar medias de ${targetCol} a través de los ${cardinality} niveles de ${groupCol}`,
              input_variables: [targetCol, groupCol],
              assumptions_to_check: ['Normalidad de residuos', 'Homocedasticidad (Levene)'],
              alternatives: ['kruskal_wallis'],
              execution_id: 'py_stats_one_way_anova',
            }
          );
        }
        break;
      }

      case 'relationship': {
        const vars = interpretation.variables.target.map(resolveCol);
        if (vars.length < 2) {
          const numCols = dataset.columns.filter((c) => c.type === 'numeric').map((c) => c.name);
          if (numCols.length >= 2) {
            vars.push(numCols[0], numCols[1]);
          }
        }
        usedVariables.push(...vars);

        reasoning = `Para examinar la relación entre variables cuantitativas (${vars.join(', ')}), se calculan simultáneamente la correlación de Pearson (asociación lineal) y Spearman (asociación monótona o datos con asimetría).`;
        methods.push(
          {
            method_id: 'pearson_correlation',
            purpose: `Medir la fuerza y significancia de la correlación lineal entre ${vars.join(' y ')}`,
            input_variables: vars,
            assumptions_to_check: ['Normalidad bivariada', 'Relación lineal'],
            alternatives: ['spearman_correlation'],
            execution_id: 'py_stats_pearson_correlation',
          },
          {
            method_id: 'spearman_correlation',
            purpose: `Evaluar correlación por rangos no paramétrica entre ${vars.join(' y ')}`,
            input_variables: vars,
            assumptions_to_check: ['Relación monótona'],
            alternatives: ['kendall_tau'],
            execution_id: 'py_stats_spearman_correlation',
          }
        );
        break;
      }

      case 'trend': {
        const targetCol = resolveCol(interpretation.variables.target[0] || firstNumeric);
        const timeCol = resolveCol(interpretation.variables.time[0] || dataset.columns.find((c) => c.type === 'datetime')?.name || 'fecha');
        usedVariables.push(targetCol, timeCol);

        reasoning = `Para analizar la tendencia temporal de "${targetCol}" a lo largo de "${timeCol}", se aplica descomposición de serie y cálculo de variación interanual/intermensual.`;
        methods.push(
          {
            method_id: 'time_series_trend',
            purpose: `Calcular tasa de crecimiento, picos y tendencia temporal de ${targetCol}`,
            input_variables: [targetCol, timeCol],
            assumptions_to_check: ['Frecuencia temporal regular'],
            alternatives: ['descriptive_summary'],
            execution_id: 'py_stats_time_series_trend',
          }
        );
        break;
      }

      case 'descriptive':
      default: {
        const targetCol = resolveCol(interpretation.variables.target[0] || firstNumeric);
        usedVariables.push(targetCol);

        reasoning = `Para caracterizar la variable "${targetCol}", se calculan estadísticas de tendencia central (media, mediana), dispersión (desviación típica, IQR) y forma (asimetría, curtosis), complementadas con el test de normalidad.`;
        methods.push(
          {
            method_id: 'descriptive_summary',
            purpose: `Calcular métricas descriptivas completas para ${targetCol}`,
            input_variables: [targetCol],
            assumptions_to_check: ['Comprobar proporción de valores nulos o atípicos'],
            alternatives: ['distribution_normality'],
            execution_id: 'py_stats_descriptive_summary',
          },
          {
            method_id: 'distribution_normality',
            purpose: `Evaluar la normalidad de la distribución de ${targetCol}`,
            input_variables: [targetCol],
            assumptions_to_check: ['Datos cuantitativos continuos'],
            alternatives: ['resumen_robusto_mediana_iqr'],
            execution_id: 'py_stats_distribution_normality',
          }
        );
        break;
      }
    }

    return {
      schema_version: '1.0',
      agent: 'statistical_analyst',
      status: 'success',
      objective: interpretation.objective,
      analysis_plan: {
        dataset_requirements: [`Dataset con al menos ${methods[0]?.input_variables.length || 1} variables requeridas`],
        variables: Array.from(new Set(usedVariables)),
        methods,
      },
      validation: { valid: true, errors: [], warnings: [] },
      execution_required: true,
      reasoning_summary: reasoning,
      metadata: {
        modelUsed,
        durationMs,
        source: 'methodological-fallback',
        warning,
      },
    };
  }

  private buildClarificationPlan(
    interpretation: QueryInterpretation,
    dataset: DatasetMetadata,
    startTime: number,
    modelUsed: string
  ): StatisticalAnalysisPlan {
    return {
      schema_version: '1.0',
      agent: 'statistical_analyst',
      status: 'needs_clarification',
      objective: interpretation.objective,
      analysis_plan: {
        dataset_requirements: ['Especificar variable dependiente o criterio de análisis'],
        variables: [],
        methods: [],
      },
      validation: {
        valid: false,
        errors: [interpretation.clarification_question || 'La consulta es ambigua y requiere mayor especificidad.'],
        warnings: [],
      },
      execution_required: false,
      reasoning_summary: `No es posible estructurar un plan estadístico sin resolver la ambigüedad: "${interpretation.clarification_question || 'Consulta incompleta'}".`,
      metadata: {
        modelUsed,
        durationMs: Date.now() - startTime,
        source: 'methodological-fallback',
      },
    };
  }
}
