import sys
import pandas as pd
import colorsys
import os
from catboost import CatBoostClassifier

EPS = 1e-6
feature_cols = [
  'r', 'g', 'b', 'brightness', 'r_chroma', 'g_chroma', 'b_chroma',
  'rg_ratio', 'gb_ratio', 'br_ratio', 'hue', 'saturation', 'value'
]

def add_features(d):
    d = d.copy()
    for c in ['r','g','b']:
        d[c] = d[c].astype(float)
    s = d[['r','g','b']].sum(axis=1) + EPS
    d['brightness'] = s / 3.0
    d['r_chroma'] = d['r'] / s
    d['g_chroma'] = d['g'] / s
    d['b_chroma'] = d['b'] / s
    d['rg_ratio'] = d['r'] / (d['g'] + EPS)
    d['gb_ratio'] = d['g'] / (d['b'] + EPS)
    d['br_ratio'] = d['b'] / (d['r'] + EPS)

    hsv_list = d[['r','g','b']].apply(
        lambda row: colorsys.rgb_to_hsv(row['r']/255, row['g']/255, row['b']/255), axis=1
    )
    d['hue'] = [h for h,s,v in hsv_list]
    d['saturation'] = [s for h,s,v in hsv_list]
    d['value'] = [v for h,s,v in hsv_list]
    return d

try:
    model_path = os.path.join(os.path.dirname(__file__), 'catboost_banana_model.cbm')

    model = CatBoostClassifier()
    model.load_model(model_path)

    r_val = sys.argv[1]
    g_val = sys.argv[2]
    b_val = sys.argv[3]

    temp = pd.DataFrame([{'r': r_val, 'g': g_val, 'b': b_val}])
    temp = add_features(temp)
    x_input = temp[feature_cols]

    pred = model.predict(x_input)
    
    print(pred[0][0]) 

except Exception as e:
    print(f"Error_in_python: {e}", file=sys.stderr)
    sys.exit(1)