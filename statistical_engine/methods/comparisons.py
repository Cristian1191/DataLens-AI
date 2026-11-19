"""Pruebas estadísticas para comparación de grupos (paramétricas y no paramétricas).
"""

from typing import Dict, Any, List
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd


def run_independent_t_test(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    target_col = variables[0]
    group_col = variables[1]

    clean_df = df[[target_col, group_col]].dropna()
    clean_df[target_col] = pd.to_numeric(clean_df[target_col], errors="coerce")
    clean_df = clean_df.dropna()

    groups = clean_df[group_col].unique()
    if len(groups) != 2:
        raise ValueError(f"La prueba t requiere exactamente 2 grupos. Encontrados {len(groups)} en '{group_col}': {groups[:5]}")

    group_a_data = clean_df[clean_df[group_col] == groups[0]][target_col]
    group_b_data = clean_df[clean_df[group_col] == groups[1]][target_col]

    n_a = len(group_a_data)
    n_b = len(group_b_data)

    if n_a < 3 or n_b < 3:
        raise ValueError(f"Tamaño muestral insuficiente en uno de los grupos (n_a={n_a}, n_b={n_b})")

    # 1. Prueba de homocedasticidad de Levene
    levene_stat, levene_p = stats.levene(group_a_data, group_b_data)
    equal_var = levene_p > 0.05

    # 2. Prueba t (Student o Welch según varianzas)
    t_stat, t_p = stats.ttest_ind(group_a_data, group_b_data, equal_var=equal_var)

    # 3. Tamaño del efecto: d de Cohen
    pooled_std = np.sqrt(((n_a - 1) * group_a_data.var() + (n_b - 1) * group_b_data.var()) / (n_a + n_b - 2))
    cohen_d = float((group_a_data.mean() - group_b_data.mean()) / pooled_std) if pooled_std > 0 else 0.0

    return {
        "test_name": "Prueba t de Student para Muestras Independientes" if equal_var else "Prueba t de Welch (Varianzas Heterogéneas)",
        "target_variable": target_col,
        "group_variable": group_col,
        "group_a": {
            "name": str(groups[0]),
            "n": n_a,
            "mean": round(float(group_a_data.mean()), 4),
            "std": round(float(group_a_data.std()), 4),
        },
        "group_b": {
            "name": str(groups[1]),
            "n": n_b,
            "mean": round(float(group_b_data.mean()), 4),
            "std": round(float(group_b_data.std()), 4),
        },
        "levene_test": {
            "statistic": round(float(levene_stat), 5),
            "p_value": round(float(levene_p), 6),
            "equal_variances_assumed": bool(equal_var),
        },
        "t_statistic": round(float(t_stat), 5),
        "p_value": round(float(t_p), 6),
        "significant": bool(t_p < 0.05),
        "cohens_d": round(cohen_d, 4),
        "conclusion": "Diferencia estadísticamente significativa entre las medias (p < 0.05)" if t_p < 0.05 else "No se hallaron diferencias estadísticamente significativas entre las medias (p >= 0.05)",
    }


def run_mann_whitney_u(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    target_col = variables[0]
    group_col = variables[1]

    clean_df = df[[target_col, group_col]].dropna()
    clean_df[target_col] = pd.to_numeric(clean_df[target_col], errors="coerce")
    clean_df = clean_df.dropna()

    groups = clean_df[group_col].unique()
    if len(groups) != 2:
        raise ValueError(f"La prueba U de Mann-Whitney requiere exactamente 2 grupos.")

    group_a_data = clean_df[clean_df[group_col] == groups[0]][target_col]
    group_b_data = clean_df[clean_df[group_col] == groups[1]][target_col]

    stat, p_val = stats.mannwhitneyu(group_a_data, group_b_data, alternative="two-sided")

    return {
        "test_name": "Prueba U de Mann-Whitney (No paramétrica)",
        "target_variable": target_col,
        "group_variable": group_col,
        "group_a": {
            "name": str(groups[0]),
            "n": len(group_a_data),
            "median": round(float(group_a_data.median()), 4),
        },
        "group_b": {
            "name": str(groups[1]),
            "n": len(group_b_data),
            "median": round(float(group_b_data.median()), 4),
        },
        "u_statistic": round(float(stat), 4),
        "p_value": round(float(p_val), 6),
        "significant": bool(p_val < 0.05),
        "conclusion": "Diferencia de rangos estadísticamente significativa (p < 0.05)" if p_val < 0.05 else "No se halló diferencia significativa entre las distribuciones (p >= 0.05)",
    }


def run_one_way_anova(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    target_col = variables[0]
    group_col = variables[1]

    clean_df = df[[target_col, group_col]].dropna()
    clean_df[target_col] = pd.to_numeric(clean_df[target_col], errors="coerce")
    clean_df = clean_df.dropna()

    groups = clean_df[group_col].unique()
    if len(groups) < 2:
        raise ValueError(f"ANOVA requiere al menos 2 grupos (encontrados: {len(groups)})")

    group_data_list = [clean_df[clean_df[group_col] == g][target_col] for g in groups]

    # ANOVA F-test
    f_stat, p_val = stats.f_oneway(*group_data_list)

    # Post-hoc Tukey HSD si es significativo y hay >= 3 grupos
    post_hoc_results = []
    if p_val < 0.05 and len(groups) >= 3:
        try:
            tukey = pairwise_tukeyhsd(clean_df[target_col], clean_df[group_col], alpha=0.05)
            for row in tukey.summary().data[1:]:
                post_hoc_results.append({
                    "group1": str(row[0]),
                    "group2": str(row[1]),
                    "diff": round(float(row[2]), 4),
                    "p_adj": round(float(row[3]), 4),
                    "reject": bool(row[5]),
                })
        except Exception:
            pass

    group_summaries = []
    for g, data in zip(groups, group_data_list):
        group_summaries.append({
            "group": str(g),
            "n": len(data),
            "mean": round(float(data.mean()), 4),
            "std": round(float(data.std()), 4),
        })

    return {
        "test_name": "Análisis de Varianza de un Factor (One-Way ANOVA)",
        "target_variable": target_col,
        "group_variable": group_col,
        "number_of_groups": len(groups),
        "groups": group_summaries,
        "f_statistic": round(float(f_stat), 5),
        "p_value": round(float(p_val), 6),
        "significant": bool(p_val < 0.05),
        "post_hoc_tukey": post_hoc_results,
        "conclusion": "Existen diferencias significativas entre al menos dos grupos (p < 0.05)" if p_val < 0.05 else "No se observan diferencias estadísticamente significativas entre las medias de los grupos (p >= 0.05)",
    }


def run_kruskal_wallis(df: pd.DataFrame, variables: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
    target_col = variables[0]
    group_col = variables[1]

    clean_df = df[[target_col, group_col]].dropna()
    clean_df[target_col] = pd.to_numeric(clean_df[target_col], errors="coerce")
    clean_df = clean_df.dropna()

    groups = clean_df[group_col].unique()
    group_data_list = [clean_df[clean_df[group_col] == g][target_col] for g in groups]

    h_stat, p_val = stats.kruskal(*group_data_list)

    return {
        "test_name": "Prueba de Kruskal-Wallis (ANOVA no paramétrico)",
        "target_variable": target_col,
        "group_variable": group_col,
        "number_of_groups": len(groups),
        "h_statistic": round(float(h_stat), 5),
        "p_value": round(float(p_val), 6),
        "significant": bool(p_val < 0.05),
    }
