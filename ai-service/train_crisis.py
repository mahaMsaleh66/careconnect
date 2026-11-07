import random
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, classification_report)

random.seed(42)
np.random.seed(42)

types = ['Flood', 'Earthquake', 'Hunger', 'Medical', 'Fire', 'Other']

phrases = {
    'Low': ['minor damage', 'small area affected', 'situation under control',
            'few families need support', 'roads are open', 'limited supplies needed'],
    'Medium': ['many families displaced', 'shortage of food and water',
               'some houses damaged', 'medical help needed',
               'roads partly blocked', 'several people injured'],
    'High': ['many deaths reported', 'houses collapsed', 'children trapped',
             'no food or water', 'hospital overwhelmed', 'urgent rescue needed',
             'roads destroyed', 'thousands homeless'],
}
people_range = {'Low': (5, 600), 'Medium': (200, 3000), 'High': (1000, 20000)}
neighbours = {'Low': 'Medium', 'Medium': 'High', 'High': 'Medium'}

rows = []
for i in range(1500):
    sev = random.choice(['Low', 'Medium', 'High'])
    t = random.choice(types)
    lo, hi = people_range[sev]
    people = random.randint(lo, hi)
    chosen = []
    for k in range(3):
        level = sev
        if random.random() < 0.2:
            level = neighbours[sev]
        chosen.append(random.choice(phrases[level]))
    rows.append({
        'type': t,
        'affected_people': people,
        'description': ' and '.join(chosen),
        'severity': sev,
    })

df = pd.DataFrame(rows)
df['log_people'] = np.log1p(df['affected_people'])
df.to_csv('crisis_dataset.csv', index=False)
print('Dataset saved: crisis_dataset.csv with', len(df), 'rows')

X = df[['type', 'log_people', 'description']]
y = df['severity']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

pre = ColumnTransformer([
    ('type', OneHotEncoder(handle_unknown='ignore'), ['type']),
    ('people', StandardScaler(), ['log_people']),
    ('text', TfidfVectorizer(ngram_range=(1, 2)), 'description'),
])

model = Pipeline([
    ('pre', pre),
    ('clf', LogisticRegression(max_iter=1000)),
])

model.fit(X_train, y_train)
pred = model.predict(X_test)

labels = ['Low', 'Medium', 'High']
print('Accuracy :', round(accuracy_score(y_test, pred), 3))
print('Precision:', round(precision_score(y_test, pred, average='weighted'), 3))
print('Recall   :', round(recall_score(y_test, pred, average='weighted'), 3))
print('F1-score :', round(f1_score(y_test, pred, average='weighted'), 3))
print('Confusion matrix (rows = actual, columns = predicted, order Low/Medium/High):')
print(confusion_matrix(y_test, pred, labels=labels))
print(classification_report(y_test, pred))

joblib.dump(model, 'crisis_model.joblib')
print('Model saved: crisis_model.joblib')