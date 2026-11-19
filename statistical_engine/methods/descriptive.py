"""Cálculos de estadística descriptiva y evaluación de normalidad.
"""

from typing import Dict, Any, List
import numpy as np
import pandas as pd
from scipy import stats


def run_descriptive_summary(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    col = variables[0]
    series = pd.to_numeric(df[col], errors="coerce").dropna()
    n = len(series)

    if n < 3:
        raise ValueError(f"Muestra insuficiente en '{col}' (n={n}, mínimo 3)")

    mean_val = float(series.mean())
    median_val = float(series.median())
    std_val = float(series.std(ddof=1)) if n > 1 else 0.0
    var_val = float(series.var(ddof=1)) if n > 1 else 0.0
    min_val = float(series.min())
    max_val = float(series.max())
    q25 = float(series.quantile(0.25))
    q75 = float(series.quantile(0.75))
    iqr = float(q75 - q25)
    skew = float(stats.skew(series, bias=False)) if n > 2 else 0.0
    kurt = float(stats.kurtosis(series, bias=False)) if n > 3 else 0.0

    return {
        "variable": col,
        "sample_size": n,
        "null_count": int(df[col].isna().sum()),
        "mean": round(mean_val, 4),
        "median": round(median_val, 4),
        "std_dev": round(std_val, 4),
        "variance": round(var_val, 4),
        "min": round(min_val, 4),
        "max": round(max_val, 4),
        "q25": round(q25, 4),
        "q75": round(q75, 4),
        "iqr": round(iqr, 4),
        "skewness": round(skew, 4),
        "kurtosis": round(kurt, 4),
        "interpretation": "Distribución simétrica" if abs(skew) < 0.5 else ("Sesgo positivo (derecha)" if skew > 0 else "Sesgo negativo (izquierda)"),
    }


def run_normality_test(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    col = variables[0]
    series = pd.to_numeric(df[col], errors="coerce").dropna()
    n = len(series)

    if n < 8:
        raise ValueError(f"Prueba de Shapiro-Wilk requiere al menos n=8 observaciones (disponibles: {n})")

    # Muestreo si n > 5000 para Shapiro-Wilk
    sample = series.sample(min(n, 5000), random_state=42) if n > 5000 else series
    stat, p_val = stats.shapiro(sample)
    is_normal = p_val > 0.05

    return {
        "variable": col,
        "test_name": "Shapiro-Wilk",
        "sample_size": n,
        "statistic": round(float(stat), 5),
        "p_value": round(float(p_val), 6),
        "alpha": 0.05,
        "is_normal": bool(is_normal),
        "decision": "No se rechaza H0: Los datos son compatibles con una distribución normal." if is_normal else "Se rechaza H0 (p < 0.05): Los datos NO siguen una distribución normal; se recomiendan métodos no paramétricos.",
    }


def run_time_series_trend(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    target_col = variables[0]
    time_col = variables[1] if len(variables) > 1 else None

    clean_df = df.dropna(subset=[target_col])
    if time_col and time_col in clean_df.columns:
        clean_df[time_col] = pd.to_datetime(clean_df[time_col], errors="coerce")
        clean_df = clean_df.dropna(subset=[time_col]).sort_values(by=time_col)

    series = pd.to_numeric(clean_df[target_col], errors="coerce").dropna()
    n = len(series)

    if n < 3:
        raise ValueError("Datos temporales insuficientes")

    pct_change = series.pct_change().dropna()
    mean_growth = float(pct_change.mean()) * 100
    peak_idx = int(series.idxmax())
    lowest_idx = int(series.idxmin())

    return {
        "target_variable": target_col,
        "time_variable": time_col,
        "observations": n,
        "mean_period_growth_pct": round(mean_growth, 2),
        "peak_value": round(float(series.max()), 2),
        "lowest_value": round(float(series.min()), 2),
        "direction": "Creciente" if mean_growth > 0.5 else ("Decreciente" if mean_growth < -0.5 else "Estable"),
    }
