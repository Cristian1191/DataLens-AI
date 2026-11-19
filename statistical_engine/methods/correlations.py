"""Cálculos de correlación bivariada (Pearson y Spearman).
"""

from typing import Dict, Any, List
import pandas as pd
from scipy import stats


def run_pearson_correlation(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    if len(variables) < 2:
        raise ValueError("La correlación de Pearson requiere al menos 2 variables cuantitativas.")

    var_x = variables[0]
    var_y = variables[1]

    clean_df = df[[var_x, var_y]].dropna()
    clean_df[var_x] = pd.to_numeric(clean_df[var_x], errors="coerce")
    clean_df[var_y] = pd.to_numeric(clean_df[var_y], errors="coerce")
    clean_df = clean_df.dropna()

    n = len(clean_df)
    if n < 5:
        raise ValueError(f"Muestra insuficiente para correlación (n={n}, mínimo 5)")

    r, p_val = stats.pearsonr(clean_df[var_x], clean_df[var_y])
    r_squared = r ** 2

    # Interpretación cualitativa según magnitud de Cohen
    abs_r = abs(r)
    strength = "Muy débil / nula" if abs_r < 0.1 else ("Débil" if abs_r < 0.3 else ("Moderada" if abs_r < 0.5 else ("Fuerte" if abs_r < 0.8 else "Muy fuerte")))
    direction = "positiva" if r > 0 else "negativa"

    return {
        "test_name": "Coeficiente de Correlación Lineal de Pearson",
        "variable_x": var_x,
        "variable_y": var_y,
        "sample_size": n,
        "pearson_r": round(float(r), 4),
        "r_squared": round(float(r_squared), 4),
        "p_value": round(float(p_val), 6),
        "significant": bool(p_val < 0.05),
        "direction": direction,
        "strength": strength,
        "interpretation": f"Correlación lineal {direction} {strength.lower()} (r={round(float(r), 2)}, p={round(float(p_val), 4)}).",
    }


def run_spearman_correlation(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    if len(variables) < 2:
        raise ValueError("La correlación de Spearman requiere al menos 2 variables.")

    var_x = variables[0]
    var_y = variables[1]

    clean_df = df[[var_x, var_y]].dropna()
    clean_df[var_x] = pd.to_numeric(clean_df[var_x], errors="coerce")
    clean_df[var_y] = pd.to_numeric(clean_df[var_y], errors="coerce")
    clean_df = clean_df.dropna()

    n = len(clean_df)
    rho, p_val = stats.spearmanr(clean_df[var_x], clean_df[var_y])

    return {
        "test_name": "Coeficiente de Correlación por Rangos de Spearman (No paramétrica)",
        "variable_x": var_x,
        "variable_y": var_y,
        "sample_size": n,
        "spearman_rho": round(float(rho), 4),
        "p_value": round(float(p_val), 6),
        "significant": bool(p_val < 0.05),
    }
