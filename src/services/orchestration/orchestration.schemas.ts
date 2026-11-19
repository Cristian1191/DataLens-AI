/**
 * DataLens AI — Fase 4: Validación de esquemas en runtime
 *
 * Valida las respuestas de proveedores y las solicitudes de orquestación
 * ANTES de que continúen al siguiente stage del pipeline.
 * No acepta JSON malformado, incompleto o fuera de esquema.
 */

import type {
  OrchestrationRequest,
  DeepSeekAnalysisResult,
  ProviderExecutionResult,
} from './orchestration.types';
import type { QueryInterpretation } from '../ai/ai.types';

// ─── Resultado de validación ──────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ─── Validar solicitud de orquestación ────────────────────────────────────────

export function validateOrchestrationRequest(req: unknown): ValidationResult {
  if (!req || typeof req !== 'object') {
    return fail('La solicitud de orquestación es nula o no es un objeto.');
  }

  const r = req as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof r['operationId'] !== 'string' || r['operationId'] === '') {
    errors.push('operationId es requerido y debe ser un string no vacío.');
  }

  if (typeof r['query'] !== 'string' || (r['query'] as string).trim() === '') {
    errors.push('query es requerido y no puede estar vacío.');
  }

  if (typeof r['query'] === 'string' && (r['query'] as string).length > 4000) {
    errors.push('query supera el límite de 4000 caracteres.');
  }

  if (typeof r['createdAt'] !== 'number' || r['createdAt'] <= 0) {
    errors.push('createdAt debe ser un timestamp positivo.');
  }

  if (typeof r['requestVersion'] !== 'string') {
    errors.push('requestVersion es requerido.');
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

// ─── Validar interpretación de Fase 3 ─────────────────────────────────────────

export function validateInterpretation(interp: unknown): ValidationResult {
  if (!interp || typeof interp !== 'object') {
    return fail('La interpretación es nula o no es un objeto.');
  }

  const i = interp as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof i['intent'] !== 'string' || i['intent'] === '') {
    errors.push('intent es requerido.');
  }

  if (typeof i['objective'] !== 'string' || i['objective'] === '') {
    errors.push('objective es requerido.');
  }

  if (!Array.isArray(i['analysis_type'])) {
    errors.push('analysis_type debe ser un array.');
  }

  if (!i['variables'] || typeof i['variables'] !== 'object') {
    errors.push('variables debe ser un objeto.');
  } else {
    const v = i['variables'] as Record<string, unknown>;
    if (!Array.isArray(v['target'])) errors.push('variables.target debe ser un array.');
    if (!Array.isArray(v['group_by'])) errors.push('variables.group_by debe ser un array.');
    if (!Array.isArray(v['time'])) errors.push('variables.time debe ser un array.');
  }

  if (typeof i['confidence'] !== 'number' || i['confidence'] < 0 || i['confidence'] > 1) {
    errors.push('confidence debe ser un número entre 0 y 1.');
  }

  if (typeof i['needs_clarification'] !== 'boolean') {
    errors.push('needs_clarification es requerido y debe ser boolean.');
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

// ─── Validar respuesta de DeepSeek ────────────────────────────────────────────

export function validateDeepSeekResult(result: unknown): ValidationResult {
  if (!result || typeof result !== 'object') {
    return fail('La respuesta de DeepSeek es nula o no es un objeto.');
  }

  // La respuesta de DeepSeek es flexible (el modelo puede devolver distintas estructuras),
  // pero debe ser al menos un objeto JSON válido con algún contenido.
  const r = result as Record<string, unknown>;
  const hasContent =
    typeof r['analysis'] === 'string' ||
    (r['structured'] && typeof r['structured'] === 'object') ||
    r['raw'] !== undefined;

  if (!hasContent) {
    return fail('La respuesta de DeepSeek no contiene análisis, datos estructurados ni contenido raw.');
  }

  return ok();
}

// ─── Validar resultado de ejecución de proveedor ──────────────────────────────

export function validateProviderResult(result: unknown): ValidationResult {
  if (!result || typeof result !== 'object') {
    return fail('El resultado del proveedor es nulo o no es un objeto.');
  }

  const r = result as Record<string, unknown>;

  if (typeof r['success'] !== 'boolean') {
    return fail('El resultado del proveedor debe incluir success (boolean).');
  }

  if (typeof r['provider'] !== 'string') {
    return fail('El resultado del proveedor debe incluir provider (string).');
  }

  if (r['success'] === true && r['data'] === undefined) {
    return fail('Un resultado exitoso debe incluir data.');
  }

  if (r['success'] === false && typeof r['error'] !== 'string') {
    return fail('Un resultado fallido debe incluir un mensaje de error.');
  }

  return ok();
}
