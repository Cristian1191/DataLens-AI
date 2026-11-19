# ◈ DataLens AI

### Generative Business Intelligence · Hierarchical Multi-Agent Systems

**From Enterprise Data to Intelligent Decisions.**

Plataforma de Business Intelligence impulsada por IA generativa que transforma consultas en lenguaje natural en análisis estadísticos, insights empresariales y reportes interactivos.

### Technology Stack

**Frontend & Backend**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Data Engineering & Analytics**

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)
![Microsoft Excel](https://img.shields.io/badge/Excel-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white)
![Microsoft SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)

**Artificial Intelligence & LLMs**

![Anthropic Claude](https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)
![Gemini Nano 4](https://img.shields.io/badge/Gemini_Nano_4-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)
![DeepSeek](https://img.shields.io/badge/DeepSeek-4D6BFE?style=for-the-badge&logo=deepseek&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)
![Firebase AI](https://img.shields.io/badge/Firebase_AI_Logic-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**Infrastructure & Containerization**

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![NVIDIA CUDA](https://img.shields.io/badge/NVIDIA_CUDA-76B900?style=for-the-badge&logo=nvidia&logoColor=white)

**Business Intelligence & Visualization**

![Power BI](https://img.shields.io/badge/Power_BI-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

---

### Technology Architecture

| Área | Tecnologías |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Firebase Cloud Functions |
| Data Engineering | Python, Pandas, NumPy |
| Data Sources | Microsoft SQL Server, Excel, CSV |
| Database | Microsoft SQL Server |
| AI Infrastructure | Ollama, LLMs |
| Reasoning Models | DeepSeek-R1-Distill-Qwen-7B |
| Containerization | Docker, Docker Compose |
| GPU Acceleration | NVIDIA CUDA |
| Model Serving | Python API, REST APIs, Ollama |
| Business Intelligence | Power BI, Interactive BI |
| Data Visualization | Chart.js, Dynamic Reports |
| Communication | REST APIs, JSON |
| Analytics | Statistical Analysis, Data Validation |

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

    U --> O

    subgraph ORCHESTRATION["ORCHESTRATION AND CONTROL"]
        PLAN["Task Planning"]
        STATE["Execution State and Context Management"]
        O --> PLAN
        PLAN --> STATE
        STATE -.-> O
    end

    subgraph AGENTS["SPECIALIZED AI AGENTS"]
        I["Query Interpreter"]
        E["Data Execution Agent"]
        A["Statistical Analysis Agent"]
        AU["Audit and Validation Agent"]
        EV["Evaluation and Quality Agent"]
        R["Generative Report Agent"]
    end

    subgraph INFRA["DATA AND AI INFRASTRUCTURE"]
        DB[("Microsoft SQL Server")]
        PY["Python Analytics Engine"]
        DOCKER["Docker Container"]
        LLM["Ollama and DeepSeek LLM"]
    end

    subgraph OUTPUT["INTELLIGENT BI OUTPUT"]
        DATA["Structured Analytical Results"]
        REPORT["Generated Insights and Narrative"]
        UI["Interactive BI Dashboard"]
    end

    O --> I
    O --> E
    O --> A
    O --> AU
    O --> EV
    O --> R

    I <--> LLM
    I -->|"Query Specification"| E

    E -->|"SQL Queries"| DB
    DB -->|"Retrieved Data"| E
    E -->|"Prepared Dataset"| A

    A <--> PY
    A -->|"Statistical Results"| AU

    AU -->|"Validated Findings"| EV
    EV -->|"Quality Feedback"| O

    EV -->|"Approved Results"| DATA
    DATA --> R

    R <--> LLM
    R --> REPORT
    REPORT --> UI

    DOCKER -->|"Hosts Model Server"| LLM

    E -.->|"Execution Errors"| O
    A -.->|"Analysis Errors"| O
    AU -.->|"Validation Issues"| O
    EV -.->|"Evaluation Feedback"| O

```

### Agentes especializados

| Agente | Responsabilidad |
|---|---|
| **Orchestrator** | Coordina tareas, agentes y flujo de ejecución. |
| **Query Interpreter** | Convierte lenguaje natural en instrucciones analíticas estructuradas (JSON). |
| **Execution Agent** | Gestiona consultas, servicios y recuperación de datos. |
| **Statistical Analyst** | Determina y ejecuta procedimientos estadísticos. |
| **Audit Agent** | Verifica coherencia, integridad y consistencia de resultados. |
| **Evaluation Agent** | Evalúa precisión y calidad mediante criterios de validación. |
| **Report Generator** | Convierte resultados en reportes e insights visuales. |

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
- **DeepSeek-R1-Distill-Qwen-7B:** modelo utilizado para experimentación con razonamiento especializado.
- **Docker:** containerización del entorno de ejecución del modelo y sus servicios asociados.
- **Docker Compose:** configuración y administración de los servicios mediante una definición centralizada.
- **LLM Orchestration:** interpretación, planificación y coordinación de agentes.
- **Generative AI:** generación de explicaciones, síntesis y narrativas analíticas.

Los cálculos estadísticos se delegan a herramientas deterministas, evitando depender exclusivamente de los modelos generativos para obtener resultados numéricos.

## ◈ Infrastructure & Deployment

DataLens AI incorpora una infraestructura basada en contenedores para facilitar la ejecución y administración de sus componentes de inteligencia artificial.

**Docker & Containerization**

- **Docker Engine:** ejecución de servicios y entornos aislados mediante contenedores.
- **Docker Compose:** definición, configuración y administración de servicios.
- **Containerized LLM Server:** ejecución del servidor de inferencia de DeepSeek en un entorno Docker.
- **NVIDIA CUDA:** soporte para aceleración por GPU en entornos compatibles.
- **REST API:** comunicación entre el backend de la aplicación y el servidor de modelos.

Esta implementación permite mantener el servidor de inferencia independiente del frontend y de los servicios de orquestación, reduciendo la dependencia de ejecuciones manuales y facilitando la continuidad del entorno de desarrollo.

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

---
