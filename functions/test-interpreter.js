const { OllamaProvider } = require('./lib/providers/ollama.provider');
const { AIService } = require('./lib/services/ai.service');
const { QueryInterpreterAgent } = require('./lib/agents/query-interpreter.agent');
const fs = require('fs');
const path = require('path');

// Leer API key de .secret.local
let apiKey = '';
const secretPath = path.join(__dirname, '.secret.local');
if (fs.existsSync(secretPath)) {
  const content = fs.readFileSync(secretPath, 'utf8');
  const match = content.match(/OLLAMA_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error('ERROR: No se encontró OLLAMA_API_KEY en .secret.local');
  process.exit(1);
}

const provider = new OllamaProvider({
  apiKey,
  baseUrl: 'https://ollama.com',
  defaultModel: 'gpt-oss:20b',
});
const aiService = new AIService([provider]);
const agent = new QueryInterpreterAgent(aiService, 'gpt-oss:20b');

const testScenarios = [
  'Calcula el promedio de ventas',
  'Compara las ventas entre regiones',
  'Encuentra los meses con mayor crecimiento',
  'Filtra los registros del año 2025',
  'Analiza la relación entre edad e ingresos',
  '¿Qué tipo de análisis puedo hacer con mis datos?',
  'Dime algo sobre el negocio', // Caso adicional: consulta ambigua para verificar needs_clarification
];

async function runAllTests() {
  console.log('================================================================');
  console.log('DATALENS AI - FASE 3: PRUEBAS DEL AGENTE INTÉRPRETE DE CONSULTAS');
  console.log('================================================================');

  for (let i = 0; i < testScenarios.length; i++) {
    const query = testScenarios[i];
    console.log(`\n[Prueba ${i + 1}/${testScenarios.length}]: "${query}"`);
    const startTime = Date.now();
    const result = await agent.interpret(query);
    const duration = Date.now() - startTime;

    console.log(`  -> Intent detectado:       ${result.intent}`);
    console.log(`  -> Objetivo:               ${result.objective}`);
    console.log(`  -> Tipo(s) de análisis:    ${JSON.stringify(result.analysis_type)}`);
    console.log(`  -> Variables:              target: [${result.variables.target.join(', ')}], group_by: [${result.variables.group_by.join(', ')}], time: [${result.variables.time.join(', ')}]`);
    console.log(`  -> Filtros detectados:     ${JSON.stringify(result.filters)}`);
    console.log(`  -> Métricas solicitadas:   [${result.requested_metrics.join(', ')}]`);
    console.log(`  -> Requiere aclaración:    ${result.needs_clarification}`);
    if (result.needs_clarification) {
      console.log(`  -> Pregunta sugerida:      "${result.clarification_question}"`);
    }
    console.log(`  -> Confianza:              ${result.confidence}`);
    console.log(`  -> Fuente / Tiempo:        ${result.metadata?.source} (${duration}ms)`);

    // Validaciones de sanidad
    if (!result.intent || !result.objective || !Array.isArray(result.analysis_type)) {
      console.error('  ERROR: Estructura JSON incompleta o no válida.');
      process.exit(1);
    }
  }

  console.log('\n================================================================');
  console.log('TODAS LAS PRUEBAS DEL AGENTE INTÉRPRETE COMPLETADAS CON ÉXITO');
  console.log('================================================================\n');
}

runAllTests();
