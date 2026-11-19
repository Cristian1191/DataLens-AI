// Prueba de integración directa con la lógica del backend (AIService + OllamaProvider)
const { OllamaProvider } = require('./lib/providers/ollama.provider');
const { AIService } = require('./lib/services/ai.service');
const fs = require('fs');
const path = require('path');

// Leer API key del archivo de secretos locales del backend
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

console.log('----------------------------------------------------');
console.log('DATALENS AI - PRUEBA FUNCIONAL DE OLLAMA CLOUD');
console.log('----------------------------------------------------');
console.log('1. API Key cargada desde backend secrets:', apiKey.slice(0, 8) + '...' + apiKey.slice(-6));

const provider = new OllamaProvider({
  apiKey,
  baseUrl: 'https://ollama.com',
  defaultModel: 'gpt-oss:20b',
});

const aiService = new AIService([provider]);

async function runTest() {
  const query = 'Explica qué es la media aritmética y proporciona un ejemplo sencillo con los valores 5, 10 y 15.';
  console.log(`2. Enviando consulta de prueba a Ollama Cloud: "${query}"`);

  const startTime = Date.now();
  const result = await aiService.executeChat({
    provider: 'ollama',
    model: 'gpt-oss:20b',
    messages: [
      { role: 'user', content: query }
    ]
  });
  const duration = Date.now() - startTime;

  console.log('----------------------------------------------------');
  console.log('3. RESULTADO DE LA RESPUESTA DE OLLAMA CLOUD:');
  console.log('Success:', result.success);
  console.log('Duración:', duration + 'ms');
  console.log('Modelo:', result.executionInfo.model);

  if (result.success) {
    console.log('Respuesta recibida:');
    console.log(result.content);
  } else {
    console.log('Error capturado y procesado por el backend:');
    console.log('Código:', result.error?.code);
    console.log('Status HTTP:', result.error?.statusCode);
    console.log('Mensaje:', result.error?.message);
    if (result.error?.details) {
      console.log('Detalles del error:', JSON.stringify(result.error.details, null, 2));
    }
  }
  console.log('----------------------------------------------------');
}

runTest();
