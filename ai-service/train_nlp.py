import random
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix)

random.seed(42)

needs = {
    'Food': ['khana nahi hai', 'bhook lag rahi hai', 'ration chahiye',
             'bachon ke liye khana chahiye', 'ghar mein aata nahi hai',
             'کھانا نہیں ہے', 'راشن چاہیے', 'بچے بھوکے ہیں', 'آٹا چاول چاہیے'],
    'Medical': ['dawai chahiye', 'doctor ki zaroorat hai', 'mareez ko hospital le jana hai',
                'bukhar hai', 'operation ke paise nahi hain', 'wo bohat bimar hain',
                'دوائی چاہیے', 'ڈاکٹر کی ضرورت ہے', 'مریض ہسپتال لے جانا ہے',
                'علاج کے پیسے نہیں ہیں', 'وہ بہت بیمار ہیں'],
    'Shelter': ['ghar nahi hai', 'chhat gir gayi', 'tent chahiye',
                'sailab mein ghar tabah ho gaya', 'rehne ki jagah nahi hai',
                'گھر نہیں ہے', 'چھت گر گئی', 'خیمہ چاہیے', 'رہنے کی جگہ نہیں ہے'],
    'Education': ['bachon ki school fees', 'kitabein chahiye', 'parhai ke liye madad chahiye',
                  'school bhejne ke paise nahi hain',
                  'بچوں کی سکول فیس', 'کتابیں چاہئیں', 'پڑھائی کے لیے مدد چاہیے',
                  'سکول بھیجنے کے پیسے نہیں ہیں'],
    'Other': ['kapre chahiye', 'kaam nahi mil raha', 'bijli ka bill bharna hai',
              'koi madad kar dein', 'کپڑے چاہئیں', 'کام نہیں مل رہا',
              'بجلی کا بل بھرنا ہے', 'کوئی مدد کر دیں'],
}

urgency_phrases = {
    'High': ['foran', 'abhi chahiye', 'bohat zaroori hai', 'jaan ko khatra hai',
             'emergency hai', 'do din se kuch nahi',
             'فوراً', 'ابھی چاہیے', 'بہت ضروری ہے', 'جان کو خطرہ ہے', 'ایمرجنسی ہے'],
    'Medium': ['jald', 'is hafte tak', 'mushkil mein hain', 'zaroorat hai',
               'جلد', 'اس ہفتے تک', 'مشکل میں ہیں', 'ضرورت ہے'],
    'Low': ['jab ho sake', 'koi jaldi nahi', 'thori si madad', 'agle mahine tak',
            'جب ہو سکے', 'کوئی جلدی نہیں', 'تھوڑی سی مدد', 'اگلے مہینے تک'],
}

prefixes = ['', 'assalam o alaikum', 'meherbani karke', 'please',
            'السلام علیکم', 'مہربانی کر کے']

levels = ['Low', 'Medium', 'High']
rows = []
for i in range(2400):
    need = random.choice(list(needs.keys()))
    level = random.choice(levels)
    parts = [random.choice(needs[need]), random.choice(urgency_phrases[level])]
    random.shuffle(parts)
    parts.insert(0, random.choice(prefixes))
    text = ' '.join(p for p in parts if p)
    shown = level
    if random.random() < 0.08:
        shown = random.choice(levels)
    rows.append({'text': text, 'need_type': need, 'urgency': shown})

df = pd.DataFrame(rows)
df.to_csv('nlp_dataset.csv', index=False, encoding='utf-8')
print('Dataset saved: nlp_dataset.csv with', len(df), 'rows')


def build():
    return Pipeline([
        ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4))),
        ('clf', LogisticRegression(max_iter=1000)),
    ])


def run(target, labels, filename):
    X_train, X_test, y_train, y_test = train_test_split(
        df['text'], df[target], test_size=0.2, random_state=42, stratify=df[target])
    model = build()
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    print('--- ' + target + ' model ---')
    print('Accuracy :', round(accuracy_score(y_test, pred), 3))
    print('Precision:', round(precision_score(y_test, pred, average='weighted'), 3))
    print('Recall   :', round(recall_score(y_test, pred, average='weighted'), 3))
    print('F1-score :', round(f1_score(y_test, pred, average='weighted'), 3))
    print('Labels order:', labels)
    print(confusion_matrix(y_test, pred, labels=labels))
    joblib.dump(model, filename)
    print('Saved:', filename)


run('need_type', ['Food', 'Medical', 'Shelter', 'Education', 'Other'], 'need_model.joblib')
run('urgency', ['Low', 'Medium', 'High'], 'urgency_model.joblib')







