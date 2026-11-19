"""DataLens AI - Statistical Execution Engine (Fase 4)
Motor de cálculo numérico y pruebas estadísticas deterministas.
"""

from .engine import StatisticalExecutionEngine
from .registry import EXECUTION_REGISTRY

__all__ = ["StatisticalExecutionEngine", "EXECUTION_REGISTRY"]
