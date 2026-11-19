/**
 * DataLens AI - Catálogo Centralizado de Métodos Estadísticos Permitidos (Fase 4)
 * Evita que el modelo invente nombres de métodos o identificadores de ejecución.
 */

import { StatisticalCategory, StatisticalMethodDefinition } from './analyst.types';

export class StatisticalMethodRegistry {
  private static methods: Map<string, StatisticalMethodDefinition> = new Map();

  static {
    this.registerDefaults();
  }

  private static registerDefaults(): void {
    const defaultCatalog: StatisticalMethodDefinition[] = [
      // 1. Estadística Descriptiva
      {
        id: 'descriptive_summary',
        name: 'Resumen Descriptivo Paramétrico y No Paramétrico',
        category: 'descriptive',
        description: 'Cálculo de media, mediana, desviación estándar, rango intercuartílico, asimetría y curtosis.',
        supportedVariableTypes: {
          target: ['numeric'],
        },
        minSampleSize: 3,
        assumptionsToCheck: ['Comprobar proporción de valores nulos o atípicos'],
        alternatives: ['resumen_robusto_mediana_iqr'],
        executionId: 'py_stats_descriptive_summary',
      },
      {
        id: 'distribution_normality',
        name: 'Evaluación de Normalidad (Shapiro-Wilk / D\'Agostino)',
        category: 'distribution',
        description: 'Prueba de bondad de ajuste para evaluar si una variable cuantitativa sigue distribución normal.',
        supportedVariableTypes: {
          target: ['numeric'],
        },
        minSampleSize: 8,
        assumptionsToCheck: ['Datos continuos independientes'],
        alternatives: ['inspeccion_qq_plot', 'histograma_kde'],
        executionId: 'py_stats_distribution_normality',
      },

      // 2. Comparación de 2 Grupos
      {
        id: 'independent_t_test',
        name: 'Prueba t de Student para Muestras Independientes',
        category: 'group_comparison',
        description: 'Evalúa si existen diferencias estadísticamente significativas en las medias de dos grupos.',
        supportedVariableTypes: {
          target: ['numeric'],
          group_by: ['categorical', 'boolean'],
        },
        minSampleSize: 15,
        assumptionsToCheck: [
          'Normalidad en cada grupo (Shapiro-Wilk)',
          'Homocedasticidad o igualdad de varianzas (Prueba de Levene)',
          'Independencia de las observaciones',
        ],
        alternatives: ['mann_whitney_u', 'welch_t_test'],
        executionId: 'py_stats_independent_t_test',
      },
      {
        id: 'mann_whitney_u',
        name: 'Prueba U de Mann-Whitney (No paramétrica para 2 grupos)',
        category: 'group_comparison',
        description: 'Alternativa no paramétrica a la prueba t cuando no se cumple el supuesto de normalidad.',
        supportedVariableTypes: {
          target: ['numeric'],
          group_by: ['categorical', 'boolean'],
        },
        minSampleSize: 10,
        assumptionsToCheck: ['Independencia de las observaciones', 'Variable ordinal o continua'],
        alternatives: ['independent_t_test'],
        executionId: 'py_stats_mann_whitney_u',
      },

      // 3. Comparación de Múltiples Grupos (>= 3)
      {
        id: 'one_way_anova',
        name: 'Análisis de Varianza de un Factor (One-Way ANOVA)',
        category: 'group_comparison',
        description: 'Determina si existen diferencias significativas entre las medias de 3 o más grupos independientes.',
        supportedVariableTypes: {
          target: ['numeric'],
          group_by: ['categorical'],
        },
        minSampleSize: 20,
        assumptionsToCheck: [
          'Normalidad de los residuos',
          'Homogeneidad de varianzas (Levene)',
          'Independencia muestral',
        ],
        alternatives: ['kruskal_wallis', 'welch_anova'],
        executionId: 'py_stats_one_way_anova',
      },
      {
        id: 'kruskal_wallis',
        name: 'Prueba de Kruskal-Wallis (ANOVA No Paramétrico)',
        category: 'group_comparison',
        description: 'Alternativa no paramétrica a ANOVA de un factor para comparar medianas de 3 o más grupos.',
        supportedVariableTypes: {
          target: ['numeric'],
          group_by: ['categorical'],
        },
        minSampleSize: 15,
        assumptionsToCheck: ['Independencia entre grupos', 'Escala ordinal o continua'],
        alternatives: ['one_way_anova'],
        executionId: 'py_stats_kruskal_wallis',
      },

      // 4. Correlación
      {
        id: 'pearson_correlation',
        name: 'Coeficiente de Correlación Lineal de Pearson',
        category: 'correlation',
        description: 'Mide la fuerza y dirección de la relación lineal entre dos variables cuantitativas continuas.',
        supportedVariableTypes: {
          target: ['numeric'],
          secondary: ['numeric'],
        },
        minSampleSize: 10,
        assumptionsToCheck: [
          'Relación lineal entre variables',
          'Normalidad bivariada',
          'Ausencia de valores atípicos severos',
        ],
        alternatives: ['spearman_correlation'],
        executionId: 'py_stats_pearson_correlation',
      },
      {
        id: 'spearman_correlation',
        name: 'Coeficiente de Correlación por Rangos de Spearman',
        category: 'correlation',
        description: 'Evalúa relaciones monótonas (lineales o no) entre variables ordinales o cuantitativas asimétricas.',
        supportedVariableTypes: {
          target: ['numeric'],
          secondary: ['numeric'],
        },
        minSampleSize: 10,
        assumptionsToCheck: ['Relación monótona', 'Datos ordinales o continuos'],
        alternatives: ['kendall_tau', 'pearson_correlation'],
        executionId: 'py_stats_spearman_correlation',
      },

      // 5. Regresión
      {
        id: 'linear_regression_ols',
        name: 'Regresión Lineal por Mínimos Cuadrados Ordinarios (OLS)',
        category: 'regression',
        description: 'Modela la relación entre una variable dependiente cuantitativa y una o más variables predictoras.',
        supportedVariableTypes: {
          target: ['numeric'],
          secondary: ['numeric', 'categorical'],
        },
        minSampleSize: 25,
        assumptionsToCheck: [
          'Linealidad en los parámetros',
          'Homocedasticidad de los residuos (Breusch-Pagan)',
          'Normalidad de los residuos (Jarque-Bera)',
          'Independencia de los errores (Durbin-Watson)',
          'Ausencia de multicolinealidad severa (VIF < 5)',
        ],
        alternatives: ['robust_linear_regression', 'quantile_regression'],
        executionId: 'py_stats_linear_regression_ols',
      },

      // 6. Variables Categóricas
      {
        id: 'chi_square_independence',
        name: 'Prueba de Chi-Cuadrado de Independencia',
        category: 'hypothesis_testing',
        description: 'Evalúa si dos variables categóricas están asociadas o son estadísticamente independientes.',
        supportedVariableTypes: {
          target: ['categorical', 'boolean'],
          group_by: ['categorical', 'boolean'],
        },
        minSampleSize: 30,
        assumptionsToCheck: [
          'Frecuencias esperadas >= 5 en al menos el 80% de las celdas',
          'Ninguna frecuencia esperada < 1',
          'Observaciones independientes',
        ],
        alternatives: ['fishers_exact_test'],
        executionId: 'py_stats_chi_square_independence',
      },

      // 7. Análisis Temporal
      {
        id: 'time_series_trend',
        name: 'Descomposición y Análisis de Tendencia Temporal',
        category: 'time_series',
        description: 'Analiza picos estacionales, tendencia subyacente y tasa de variación interperiodo.',
        supportedVariableTypes: {
          target: ['numeric'],
          time: ['datetime'],
        },
        minSampleSize: 12,
        assumptionsToCheck: [
          'Frecuencia temporal regular',
          'Ausencia de saltos de fecha no justificados',
        ],
        alternatives: ['moving_average_smoothing'],
        executionId: 'py_stats_time_series_trend',
      },
    ];

    for (const m of defaultCatalog) {
      this.methods.set(m.id, m);
    }
  }

  public static getMethod(id: string): StatisticalMethodDefinition | undefined {
    return this.methods.get(id);
  }

  public static getAllMethods(): StatisticalMethodDefinition[] {
    return Array.from(this.methods.values());
  }

  public static getMethodsByCategory(category: StatisticalCategory): StatisticalMethodDefinition[] {
    return Array.from(this.methods.values()).filter((m) => m.category === category);
  }

  public static exists(id: string): boolean {
    return this.methods.has(id);
  }
}
