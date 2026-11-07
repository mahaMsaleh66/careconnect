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

places = ['Sindh', 'Dadu', 'Karachi', 'Hyderabad', 'Lahore', 'Swat', 'Quetta',
          'Peshawar', 'Multan', 'Larkana', 'Sukkur', 'Gilgit']

templates = {
    'Flood': [
        'Heavy rains cause flooding in {p}, thousands displaced',
        'Flood waters wash away homes and crops in {p}',
        'Rescue teams evacuate families as river overflows near {p}',
        '{p} submerged as monsoon floods worsen',
        'Relief camps set up for flood victims in {p}',
        'sailab ne {p} mein tabahi macha di',
    ],
    'Earthquake': [
        'Earthquake of magnitude 5.8 jolts {p}, buildings damaged',
        'Tremors felt across {p}, people rush out of homes',
        'Aftershocks hit {p} after strong earthquake',
        'Rescue operation continues in {p} after earthquake collapses houses',
        'zalzala ke jhatke {p} mein mehsoos kiye gaye',
    ],
    'Hunger': [
        'Food shortage hits families in {p}, children malnourished',
        'Rising flour prices leave poor households hungry in {p}',
        'Charity group distributes ration packs to needy families in {p}',
        'Drought brings famine fears to {p}',
        'Poor families in {p} struggle to afford one meal a day',
        '{p} mein ghareeb khandan bhook se pareshan',
    ],
    'Medical': [
        'Dengue outbreak spreads in {p}, hospitals overwhelmed',
        'Shortage of medicines reported at public hospital in {p}',
        'Free medical camp organised for poor patients in {p}',
        'Cholera cases rise in {p} after contaminated water',
        'Polio campaign launched in {p} to protect children',
        '{p} ke hospital mein dawai ki kami',
    ],
    'Fire': [
        'Fire destroys homes in a slum area of {p}, families homeless',
        'Massive blaze at market in {p}, dozens lose livelihoods',
        'Factory fire in {p} leaves workers injured',
        'Fire brigade battles huge fire in {p}',
        '{p} mein aag lagne se kai ghar jal gaye',
    ],
    'Irrelevant': [
        'Pakistan wins thrilling cricket match against rivals',
        'Star actor announces new movie release date',
        'Stock market closes higher as investors cheer budget',
        'New smartphone launched with faster camera and battery',
        'Fashion week in {p} showcases new designer collections',
        'Local team wins football tournament final in {p}',
        'Singer releases new album, fans celebrate online',
        'Government announces new highway project in {p}',
        'Tech company reports record quarterly profit',
        'Wedding season brings boom to shopping centres in {p}',
        'cricket team ne series jeet li',
        'film ka naya trailer release ho gaya',
    ],
}

rows = []
for i in range(2000):
    label = random.choice(list(templates.keys()))
    text = random.choice(templates[label]).format(p=random.choice(places))
    shown = label
    if random.random() < 0.05:
        shown = random.choice(list(templates.keys()))
    rows.append({'headline': text, 'category': shown})

df = pd.DataFrame(rows)
df.to_csv('news_dataset.csv', index=False)
print('Dataset saved: news_dataset.csv with', len(df), 'rows')

X_train, X_test, y_train, y_test = train_test_split(
    df['headline'], df['category'], test_size=0.2, random_state=42,
    stratify=df['category'])

model = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
    ('clf', LogisticRegression(max_iter=1000)),
])
model.fit(X_train, y_train)
pred = model.predict(X_test)

labels = ['Flood', 'Earthquake', 'Hunger', 'Medical', 'Fire', 'Irrelevant']
print('Accuracy :', round(accuracy_score(y_test, pred), 3))
print('Precision:', round(precision_score(y_test, pred, average='weighted'), 3))
print('Recall   :', round(recall_score(y_test, pred, average='weighted'), 3))
print('F1-score :', round(f1_score(y_test, pred, average='weighted'), 3))
print('Labels order:', labels)
print(confusion_matrix(y_test, pred, labels=labels))

joblib.dump(model, 'news_model.joblib')
print('Saved: news_model.joblib')