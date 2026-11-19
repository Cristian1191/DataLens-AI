# ◈ DataLens AI

### Generative Business Intelligence · Hierarchical Multi-Agent Systems

\<p align="center">   \<strong>From Enterprise Data to Intelligent Decisions.\</strong> \</p>

\<p align="center">   Plataforma de Business Intelligence impulsada por IA generativa que transforma consultas en lenguaje natural en análisis estadísticos, insights empresariales y reportes interactivos. \</p>

\<p align="center">   \<img src="[https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)" alt="React" />   \<img src="[https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)" alt="TypeScript" />   \<img src="[https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)" alt="Node.js" />   \<img src="[https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white](https://img.shields.io/badge/Python-3776AB?style=for-the-badge\&logo=python\&logoColor=white)" alt="Python" /> \</p>

\<p align="center">
&#x20; \<img src="[https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white](https://img.shields.io/badge/Ollama-000000?style=for-the-badge\&logo=ollama\&logoColor=white)" alt="Ollama" />
&#x20; \<img src="[https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge\&logo=firebase\&logoColor=black)" alt="Firebase" />
&#x20; \<img src="[https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge\&logo=microsoftsqlserver\&logoColor=white)" alt="Microsoft SQL Server" />
&#x20; \<img src="[https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)" alt="Tailwind CSS" />
\</p>

---

## ✦ ¿Qué es DataLens AI?

DataLens AI es una plataforma de **Intelligent Analytics** que combina ingeniería de datos, modelos de lenguaje (LLMs), razonamiento especializado y sistemas multiagente para automatizar procesos de análisis empresarial.

Su propuesta es sencilla: permitir que cualquier usuario consulte información empresarial mediante lenguaje natural y obtenga resultados estructurados, respaldados por operaciones estadísticas y presentados mediante reportes dinámicos.

**No se trata solamente de consultar datos con IA, sino de construir un sistema capaz de interpretar, planificar, analizar, verificar y comunicar resultados.**

## ◈ Arquitectura inteligente

El núcleo de DataLens AI utiliza una arquitectura de **orquestación jerárquica multiagente**, donde cada agente tiene responsabilidades especializadas y trabaja bajo la coordinación de un supervisor central.

```mermaid
flowchart TD
    U(["User Query"])
    O["Hierarchical Orchestrator"]

    subgraph AGENTS["SPECIALIZED AGENTS"]
        I["Query Interpreter"]
        E["Execution Agent"]
        A["Statistical Analyst"]
        AU["Audit Agent"]
        EV["Evaluation Agent"]
        R["Generative Report Agent"]
    end

    subgraph INFRA["DATA & AI INFRASTRUCTURE"]
        DB[("SQL Server")]
        PY["Python Analytics"]
        LLM["Ollama / LLMs"]
    end

    UI["Interactive BI Report"]

    U --> O
    O --> I
    I --> LLM
    I --> E
    E --> DB
    DB --> PY
    E --> A
    A --> AU
    AU --> EV
    EV --> O
    O --> R
    R --> LLM
    R --> UI
```

### Agentes especializados

| Agente                  | Responsabilidad                                                              |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Orchestrator**        | Coordina tareas, agentes y flujo de ejecución.                               |
| **Query Interpreter**   | Convierte lenguaje natural en instrucciones analíticas estructuradas (JSON). |
| **Execution Agent**     | Gestiona consultas, servicios y recuperación de datos.                       |
| **Statistical Analyst** | Determina y ejecuta procedimientos estadísticos.                             |
| **Audit Agent**         | Verifica coherencia, integridad y consistencia de resultados.                |
| **Evaluation Agent**    | Evalúa precisión y calidad mediante criterios de validación.                 |
| **Report Generator**    | Convierte resultados en reportes e insights visuales.                        |

## ⚡ Pipeline de inteligencia

```text
01  DATA INGESTION
    SQL Server · CSV · Excel
              ↓
02  QUERY INTERPRETATION
    Natural Language → Structured JSON
              ↓
03  HIERARCHICAL ORCHESTRATION
    Task Planning · Agent Coordination
              ↓
04  DATA PROCESSING & ANALYTICS
    Python · Statistical Analysis
              ↓
05  AUDIT & EVALUATION
    Consistency · Accuracy · Validation
              ↓
06  GENERATIVE REPORTING
    LLMs · Insights · Interactive BI
```

## ◈ Inteligencia artificial

La arquitectura contempla una estrategia multimodelo, distribuyendo las responsabilidades de acuerdo con la naturaleza de cada tarea.

- **Ollama:** infraestructura de ejecución y administración de modelos LLM.
- **DeepSeek-R1-Distill-Qwen-7B:** modelo considerado para experimentación con razonamiento especializado.
- **LLM Orchestration:** interpretación, planificación y coordinación de agentes.
- **Generative AI:** generación de explicaciones, síntesis y narrativas analíticas.

Los cálculos estadísticos se delegan a herramientas deterministas, evitando depender exclusivamente de los modelos generativos para obtener resultados numéricos.

## ◈ Data Engineering & Business Intelligence

La solución contempla integración con fuentes de datos empresariales, particularmente Microsoft SQL Server, mediante una arquitectura que separa el acceso a datos de la lógica de inteligencia artificial.

**Capacidades analíticas contempladas:**

- Estadística descriptiva y análisis comparativo.
- Identificación de tendencias y anomalías.
- Evaluación de KPIs y variaciones porcentuales.
- Análisis de correlaciones y distribuciones.
- Generación de resúmenes ejecutivos.
- Visualizaciones y reportes interactivos.

## ◈ Experiencia de usuario

Una interfaz de análisis conversacional inspirada en el enfoque de Generative UI.

- **Conversational Analytics:** consultas empresariales en lenguaje natural.
- **Agent Step Tracker:** seguimiento del flujo de ejecución.
- **Interactive Reports:** métricas, tablas y visualizaciones.
- **Query Refinement:** refinamiento contextual de consultas.
- **Dynamic Reporting:** presentación estructurada de resultados.

## 🛠️ Tech Stack

| Área              | Tecnologías                           |
| ----------------- | ------------------------------------- |
| Frontend          | React, TypeScript, Tailwind CSS       |
| Backend           | Node.js, Firebase Cloud Functions     |
| Data Engineering  | Python, Pandas, NumPy                 |
| Database          | Microsoft SQL Server                  |
| AI Infrastructure | Ollama, LLMs                          |
| Reasoning Models  | DeepSeek-R1-Distill-Qwen-7B           |
| Communication     | REST APIs, JSON                       |
| Analytics         | Statistical Analysis, Data Validation |

---

## 🚀 Visión

Construir una nueva generación de herramientas de Business Intelligence donde los usuarios no necesiten saber cómo consultar o procesar los datos: simplemente necesitan saber qué quieren descubrir.

**DataLens AI — Turning Data into Intelligence.**
