
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

setGlobalOptions({
  maxInstances: 2,
});

if (getApps().length === 0) {
  initializeApp();
}

// Configuración del proveedor DeepSeek
const DEEPSEEK_URL = defineString("DEEPSEEK_URL");
const DEEPSEEK_API_KEY = defineSecret("DEEPSEEK_API_KEY");

// Contrato de entrada
interface DeepSeekRequest {
  prompt: string;
  max_new_tokens?: number;
}

export const analyzeWithDeepSeek = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "1GiB",
    secrets: [DEEPSEEK_API_KEY],
  },
  async (req, res) => {
    // 1. Validar método HTTP
    if (req.method !== "POST") {
      res.status(405).json({
        status: "error",
        message: "Método no permitido",
      });
      return;
    }

    try {
      // 2. Validar autenticación Firebase
      const authorization = req.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
          status: "error",
          message: "Autenticación requerida",
        });
        return;
      }

      const idToken = authorization.substring(7);

      await getAuth().verifyIdToken(idToken);

      // 3. Validar entrada
      const body = req.body as DeepSeekRequest;

      if (
        !body ||
        typeof body.prompt !== "string" ||
        body.prompt.trim().length === 0
      ) {
        res.status(400).json({
          status: "error",
          message: "Se requiere un prompt válido",
        });
        return;
      }

      const maxTokens = body.max_new_tokens ?? 1024;

      if (
        !Number.isInteger(maxTokens) ||
        maxTokens < 1 ||
        maxTokens > 4096
      ) {
        res.status(400).json({
          status: "error",
          message: "max_new_tokens debe estar entre 1 y 4096",
        });
        return;
      }

      // 4. Preparar conexión con DeepSeek
      const baseUrl = DEEPSEEK_URL.value().replace(/\/+$/, "");
      const apiKey = DEEPSEEK_API_KEY.value();

      logger.info("Enviando solicitud al proveedor DeepSeek", {
        promptLength: body.prompt.length,
        maxTokens,
      });

      // 5. Ejecutar inferencia
      const upstream = await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: body.prompt,
          max_new_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(240000),
      });

      const upstreamText = await upstream.text();

      if (!upstream.ok) {
        logger.error("Error del proveedor DeepSeek", {
          status: upstream.status,
        });

        res.status(502).json({
          status: "error",
          message: "El proveedor DeepSeek no pudo procesar la solicitud",
          upstreamStatus: upstream.status,
        });
        return;
      }

      // 6. Devolver respuesta
      let result: unknown;

      try {
        result = JSON.parse(upstreamText);
      } catch {
        logger.error("Respuesta no válida del proveedor DeepSeek");

        res.status(502).json({
          status: "error",
          message: "Respuesta inválida del proveedor",
        });
        return;
      }

      logger.info("Inferencia DeepSeek completada");

      res.status(200).json(result);

    } catch (error) {
      logger.error("Error en analyzeWithDeepSeek", error);

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        res.status(504).json({
          status: "error",
          message: "Tiempo de espera agotado",
        });
        return;
      }

      res.status(500).json({
        status: "error",
        message: "Error interno al ejecutar el agente DeepSeek",
      });
    }
  }
);
