import sys
import pandas as pd
import colorsys
import os
from catboost import CatBoostClassifier

EPS = 1e-6
feature_cols = [
  'R', 'G', 'B', 'brightness', 'r_chroma', 'g_chroma', 'b_chroma',
  'rg_ratio', 'gb_ratio', 'br_ratio'
]

def add_features(d):
    d = d.copy()
    for c in ['R','G','B']:
        d[c] = d[c].astype(float)
    s = d[['R','G','B']].sum(axis=1) + EPS
    d['brightness'] = s / 3.0
    d['r_chroma'] = d['R'] / s
    d['g_chroma'] = d['G'] / s
    d['b_chroma'] = d['B'] / s
    d['rg_ratio'] = d['R'] / (d['G'] + EPS)
    d['gb_ratio'] = d['G'] / (d['B'] + EPS)
    d['br_ratio'] = d['B'] / (d['R'] + EPS)
    return d

try:
    model_path = os.path.join(os.path.dirname(__file__), 'catboost_banana_model.cbm')

    model = CatBoostClassifier()
    model.load_model(model_path)

    r_val = sys.argv[1]
    g_val = sys.argv[2]
    b_val = sys.argv[3]

    temp = pd.DataFrame([{'R': r_val, 'G': g_val, 'B': b_val}])
    temp = add_features(temp)
    x_input = temp[feature_cols]

    pred = model.predict(x_input)
    
    print(pred[0][0]) 

except Exception as e:
    print(f"Error_in_python: {e}", file=sys.stderr)
    sys.exit(1)