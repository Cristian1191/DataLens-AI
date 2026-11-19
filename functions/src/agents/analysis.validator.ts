/**
 * DataLens AI - Validador Determinista de Planes de Análisis (Fase 4)
 * COMPONENTE DETERMINISTA: No depende del LLM.
 * Valida variables, compatibilidad de tipos, restricciones muestrales y catálogo.
 */

import {
  AnalysisValidationResult,
  ColumnMetadata,
  DatasetMetadata,
  StatisticalAnalysisPlan,
} from './analyst.types';
import { StatisticalMethodRegistry } from './statistical-method.registry';

export class AnalysisValidator {
  /**
   * Ejecuta una batería exhaustiva de validaciones deterministas sobre el plan propuesto.
   */
  public static validate(
    plan: StatisticalAnalysisPlan,
    dataset: DatasetMetadata
  ): AnalysisValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validar integridad básica del plan
    if (!plan || typeof plan !== 'object') {
      return { valid: false, errors: ['El plan de análisis es nulo o no tiene formato de objeto válido.'], warnings };
    }

    if (!plan.objective || typeof plan.objective !== 'string') {
      errors.push('El plan no contiene un objetivo analítico definido.');
    }

    if (!plan.analysis_plan || !Array.isArray(plan.analysis_plan.methods)) {
      errors.push('El plan no contiene una lista válida de métodos estadísticos.');
      return { valid: false, errors, warnings };
    }

    if (plan.analysis_plan.methods.length === 0) {
      errors.push('El plan no incluye ningún método estadístico para ejecutar.');
    }

    // 2. Validar tamaño muestral del dataset
    if (dataset.rowCount <= 0) {
      errors.push(`El dataset "${dataset.datasetId}" está vacío (0 filas). No se puede realizar análisis estadístico.`);
    }

    const columnMap = new Map<string, ColumnMetadata>();
    for (const col of dataset.columns) {
      columnMap.set(col.name.toLowerCase().trim(), col);
    }

    // 3. Validar cada método del plan
    for (let i = 0; i < plan.analysis_plan.methods.length; i++) {
      const methodPlan = plan.analysis_plan.methods[i];
      const methodIndexLabel = `Método [${i + 1}: ${methodPlan.method_id || 'desconocido'}]`;

      // a) Verificar existencia en catálogo cerrado
      const registryDef = StatisticalMethodRegistry.getMethod(methodPlan.method_id);
      if (!registryDef) {
        errors.push(`${methodIndexLabel} no existe en el catálogo centralizado de métodos estadísticos autorizados.`);
        continue;
      }

      // b) Verificar execution_id correcto
      if (methodPlan.execution_id !== registryDef.executionId) {
        warnings.push(`${methodIndexLabel}: execution_id ("${methodPlan.execution_id}") corregido al estándar del catálogo ("${registryDef.executionId}").`);
        methodPlan.execution_id = registryDef.executionId;
      }

      // c) Verificar tamaño muestral mínimo requerido por el método
      if (dataset.rowCount < registryDef.minSampleSize) {
        errors.push(
          `${methodIndexLabel}: Tamaño muestral insuficiente. El método requiere al menos n=${registryDef.minSampleSize} observaciones, pero el dataset cuenta con n=${dataset.rowCount}.`
        );
      }

      // d) Verificar variables de entrada especificadas
      if (!Array.isArray(methodPlan.input_variables) || methodPlan.input_variables.length === 0) {
        errors.push(`${methodIndexLabel}: No se indicaron variables de entrada para su ejecución.`);
        continue;
      }

      // e) Verificar existencia de cada columna y compatibilidad de tipos
      const resolvedCols: ColumnMetadata[] = [];
      for (const varName of methodPlan.input_variables) {
        const col = columnMap.get(varName.toLowerCase().trim());
        if (!col) {
          errors.push(
            `${methodIndexLabel}: La variable "${varName}" no existe en las columnas del dataset [${dataset.columns.map((c) => c.name).join(', ')}].`
          );
        } else {
          resolvedCols.push(col);

          // Alerta de valores ausentes elevados (> 30%)
          const nullRatio = col.totalCount > 0 ? col.nullCount / col.totalCount : 0;
          if (nullRatio > 0.3) {
            warnings.push(
              `Variable "${col.name}" tiene un ${(nullRatio * 100).toFixed(1)}% de valores nulos. Se requerirá imputación o eliminación por lista.`
            );
          }
        }
      }

      // f) Validar compatibilidad de tipos según la categoría del método
      this.validateTypeCompatibility(registryDef.id, resolvedCols, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateTypeCompatibility(
    methodId: string,
    cols: ColumnMetadata[],
    errors: string[],
    warnings: string[]
  ): void {
    if (cols.length === 0) return;

    switch (methodId) {
      case 'descriptive_summary':
      case 'distribution_normality': {
        const target = cols[0];
        if (target && target.type !== 'numeric') {
          errors.push(`El método "${methodId}" requiere una variable cuantitativa numérica, pero "${target.name}" es de tipo "${target.type}".`);
        }
        break;
      }

      case 'independent_t_test':
      case 'mann_whitney_u': {
        if (cols.length >= 2) {
          const [target, group] = cols;
          if (target && target.type !== 'numeric') {
            errors.push(`El método "${methodId}" requiere que la variable analizada sea numérica, pero "${target.name}" es "${target.type}".`);
          }
          if (group && group.type !== 'categorical' && group.type !== 'boolean') {
            errors.push(`El método "${methodId}" requiere que la variable de agrupación sea categórica o binaria, pero "${group.name}" es "${group.type}".`);
          }
          if (group && group.cardinality !== 2 && group.cardinality > 0) {
            warnings.push(`El método "${methodId}" está optimizado para exactamente 2 grupos. La variable "${group.name}" reporta cardinalidad ${group.cardinality}. Se sugiere ANOVA o filtrar a 2 niveles.`);
          }
        }
        break;
      }

      case 'one_way_anova':
      case 'kruskal_wallis': {
        if (cols.length >= 2) {
          const [target, group] = cols;
          if (target && target.type !== 'numeric') {
            errors.push(`El método "${methodId}" requiere variable objetivo numérica, pero "${target.name}" es "${target.type}".`);
          }
          if (group && group.type !== 'categorical' && group.type !== 'boolean') {
            errors.push(`El método "${methodId}" requiere variable de segmentación categórica, pero "${group.name}" es "${group.type}".`);
          }
        }
        break;
      }

      case 'pearson_correlation':
      case 'spearman_correlation': {
        for (const c of cols) {
          if (c.type !== 'numeric') {
            errors.push(`El método de correlación "${methodId}" requiere variables numéricas, pero "${c.name}" es "${c.type}".`);
          }
        }
        break;
      }

      case 'linear_regression_ols': {
        if (cols.length >= 2) {
          const dependent = cols[0];
          if (dependent && dependent.type !== 'numeric') {
            errors.push(`La variable dependiente para regresión OLS debe ser cuantitativa numérica ("${dependent.name}" es "${dependent.type}").`);
          }
        }
        break;
      }

      case 'chi_square_independence': {
        for (const c of cols) {
          if (c.type === 'numeric' && c.cardinality > 15) {
            warnings.push(`Chi-cuadrado sobre variable continua "${c.name}" con alta cardinalidad (${c.cardinality}) requiere discretización previa o categorización.`);
          }
        }
        break;
      }
    }
  }
}
