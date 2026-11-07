from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

model = joblib.load('crisis_model.joblib')

NEED_KEYWORDS = {
    'Food': 'food cooking cook ration distribution kitchen',
    'Medical': 'medical doctor nurse first aid health medicine',
    'Shelter': 'shelter construction housing tent building',
    'Education': 'teaching teacher tutor education school',
    'Other': '',
}


@app.route('/predict-severity', methods=['POST'])
def predict_severity():
    data = request.get_json() or {}
    try:
        people = int(data.get('affected_people') or 0)
    except ValueError:
        people = 0
    row = pd.DataFrame([{
        'type': data.get('type') or 'Other',
        'log_people': float(np.log1p(people)),
        'description': data.get('description') or '',
    }])
    severity = model.predict(row)[0]
    confidence = float(max(model.predict_proba(row)[0]))
    return jsonify({'severity': severity, 'confidence': round(confidence * 100, 1)})


@app.route('/match-volunteers', methods=['POST'])
def match_volunteers():
    data = request.get_json() or {}
    req = data.get('request') or {}
    vols = data.get('volunteers') or []
    if len(vols) == 0:
        return jsonify([])

    need = req.get('need_type') or ''
    query = (need + ' ' + NEED_KEYWORDS.get(need, '') + ' ' + (req.get('message') or '')).lower()
    skill_docs = [(v.get('skills') or '').lower().replace(',', ' ') for v in vols]

    try:
        vec = TfidfVectorizer()
        matrix = vec.fit_transform([query] + skill_docs)
        sims = cosine_similarity(matrix[0:1], matrix[1:])[0]
    except ValueError:
        sims = np.zeros(len(vols))

    req_city = (req.get('city') or '').strip().lower()
    results = []
    for v, sim in zip(vols, sims):
        vol_city = (v.get('city') or '').strip().lower()
        city_match = 1.0 if (vol_city != '' and vol_city == req_city) else 0.0
        available = 1.0 if (v.get('availability') or 'Available') == 'Available' else 0.0
        score = 0.6 * float(sim) + 0.25 * city_match + 0.15 * available
        results.append({
            'id': v.get('id'),
            'name': v.get('name'),
            'skills': v.get('skills') or '',
            'city': v.get('city') or '',
            'availability': v.get('availability') or 'Available',
            'score': round(score * 100, 1),
        })

    results.sort(key=lambda r: r['score'], reverse=True)
    return jsonify(results)

need_model = joblib.load('need_model.joblib')
urgency_model = joblib.load('urgency_model.joblib')


@app.route('/analyze-request', methods=['POST'])
def analyze_request():
    data = request.get_json() or {}
    text = (data.get('message') or '').strip()
    if text == '':
        return jsonify({'message': 'Empty message'}), 400
    need = need_model.predict([text])[0]
    urgency = urgency_model.predict([text])[0]
    conf_need = float(max(need_model.predict_proba([text])[0]))
    conf_urg = float(max(urgency_model.predict_proba([text])[0]))
    reply = 'آپ کی درخواست کی قسم: ' + need + '، ضرورت: ' + urgency + '۔ ہم جلد رابطہ کریں گے۔'
    return jsonify({
        'need_type': need,
        'urgency': urgency,
        'confidence': round(min(conf_need, conf_urg) * 100, 1),
        'reply': reply,
    })
news_model = joblib.load('news_model.joblib')


@app.route('/classify-news', methods=['POST'])
def classify_news():
    data = request.get_json() or {}
    headline = (data.get('headline') or '').strip()
    if headline == '':
        return jsonify({'message': 'Empty headline'}), 400
    category = news_model.predict([headline])[0]
    confidence = float(max(news_model.predict_proba([headline])[0]))
    return jsonify({
        'category': category,
        'is_relevant': category != 'Irrelevant',
        'confidence': round(confidence * 100, 1),
    })
if __name__ == '__main__':
    app.run(port=8000)