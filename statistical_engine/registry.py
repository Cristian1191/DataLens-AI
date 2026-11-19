"""DataLens AI - Registro de Métodos Ejecutables en Python
"""

from typing import Callable, Dict, Any

EXECUTION_REGISTRY: Dict[str, Dict[str, Any]] = {
    "py_stats_descriptive_summary": {
        "name": "Resumen Descriptivo Completo",
        "category": "descriptive",
        "module": "statistical_engine.methods.descriptive",
        "func": "run_descriptive_summary",
        "min_n": 3,
    },
    "py_stats_distribution_normality": {
        "name": "Prueba de Normalidad (Shapiro-Wilk)",
        "category": "distribution",
        "module": "statistical_engine.methods.descriptive",
        "func": "run_normality_test",
        "min_n": 8,
    },
    "py_stats_independent_t_test": {
        "name": "Prueba t de Student para Muestras Independientes",
        "category": "group_comparison",
        "module": "statistical_engine.methods.comparisons",
        "func": "run_independent_t_test",
        "min_n": 10,
    },
    "py_stats_mann_whitney_u": {
        "name": "Prueba U de Mann-Whitney",
        "category": "group_comparison",
        "module": "statistical_engine.methods.comparisons",
        "func": "run_mann_whitney_u",
        "min_n": 8,
    },
    "py_stats_one_way_anova": {
        "name": "ANOVA de un Factor",
        "category": "group_comparison",
        "module": "statistical_engine.methods.comparisons",
        "func": "run_one_way_anova",
        "min_n": 15,
    },
    "py_stats_kruskal_wallis": {
        "name": "Prueba de Kruskal-Wallis",
        "category": "group_comparison",
        "module": "statistical_engine.methods.comparisons",
        "func": "run_kruskal_wallis",
        "min_n": 12,
    },
    "py_stats_pearson_correlation": {
        "name": "Correlación de Pearson",
        "category": "correlation",
        "module": "statistical_engine.methods.correlations",
        "func": "run_pearson_correlation",
        "min_n": 10,
    },
    "py_stats_spearman_correlation": {
        "name": "Correlación de Spearman",
        "category": "correlation",
        "module": "statistical_engine.methods.correlations",
        "func": "run_spearman_correlation",
        "min_n": 10,
    },
    "py_stats_linear_regression_ols": {
        "name": "Regresión Lineal OLS",
        "category": "regression",
        "module": "statistical_engine.methods.regression",
        "func": "run_linear_regression_ols",
        "min_n": 20,
    },
    "py_stats_chi_square_independence": {
        "name": "Chi-Cuadrado de Independencia",
        "category": "categorical",
        "module": "statistical_engine.methods.categorical",
        "func": "run_chi_square_independence",
        "min_n": 20,
    },
    "py_stats_time_series_trend": {
        "name": "Análisis de Tendencia Temporal",
        "category": "time_series",
        "module": "statistical_engine.methods.descriptive",
        "func": "run_time_series_trend",
        "min_n": 10,
    },
}
