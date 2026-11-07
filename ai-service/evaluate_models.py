import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, classification_report)

summary = []
details = []


def evaluate(task, X, y, builders, labels):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    for name, build in builders.items():
        print('Running:', task, '-', name)
        model = build()
        model.fit(X_train, y_train)
        pred = model.predict(X_test)
        cv = cross_val_score(build(), X, y, cv=5, scoring='f1_weighted')
        summary.append({
            'Task': task,
            'Model': name,
            'Accuracy': accuracy_score(y_test, pred),
            'Precision': precision_score(y_test, pred, average='weighted', zero_division=0),
            'Recall': recall_score(y_test, pred, average='weighted', zero_division=0),
            'F1': f1_score(y_test, pred, average='weighted', zero_division=0),
            'CV F1 (5-fold)': cv.mean(),
        })
        if name == 'Logistic Regression':
            cm = confusion_matrix(y_test, pred, labels=labels)
            cm_df = pd.DataFrame(
                cm,
                index=['actual ' + l for l in labels],
                columns=['pred ' + l for l in labels])
            details.append((task, cm_df, classification_report(y_test, pred, zero_division=0)))


def text_models(vec_args):
    return {
        'Logistic Regression': lambda: Pipeline([
            ('tfidf', TfidfVectorizer(**vec_args)),
            ('clf', LogisticRegression(max_iter=1000))]),
        'Linear SVM': lambda: Pipeline([
            ('tfidf', TfidfVectorizer(**vec_args)),
            ('clf', LinearSVC())]),
        'Naive Bayes': lambda: Pipeline([
            ('tfidf', TfidfVectorizer(**vec_args)),
            ('clf', MultinomialNB())]),
    }


def crisis_pre():
    return ColumnTransformer([
        ('type', OneHotEncoder(handle_unknown='ignore'), ['type']),
        ('people', StandardScaler(), ['log_people']),
        ('text', TfidfVectorizer(ngram_range=(1, 2)), 'description'),
    ])


crisis_models = {
    'Logistic Regression': lambda: Pipeline([
        ('pre', crisis_pre()), ('clf', LogisticRegression(max_iter=1000))]),
    'Linear SVM': lambda: Pipeline([
        ('pre', crisis_pre()), ('clf', LinearSVC())]),
    'Random Forest': lambda: Pipeline([
        ('pre', crisis_pre()), ('clf', RandomForestClassifier(n_estimators=100, random_state=42))]),
}

crisis = pd.read_csv('crisis_dataset.csv')
nlp = pd.read_csv('nlp_dataset.csv', encoding='utf-8')
news = pd.read_csv('news_dataset.csv')

evaluate('Crisis severity', crisis[['type', 'log_people', 'description']],
         crisis['severity'], crisis_models, ['Low', 'Medium', 'High'])

urdu_args = dict(analyzer='char_wb', ngram_range=(2, 4))
evaluate('Request need type', nlp['text'], nlp['need_type'], text_models(urdu_args),
         ['Food', 'Medical', 'Shelter', 'Education', 'Other'])
evaluate('Request urgency', nlp['text'], nlp['urgency'], text_models(urdu_args),
         ['Low', 'Medium', 'High'])

evaluate('News classification', news['headline'], news['category'],
         text_models(dict(ngram_range=(1, 2))),
         ['Flood', 'Earthquake', 'Hunger', 'Medical', 'Fire', 'Irrelevant'])

table = pd.DataFrame(summary)
for col in ['Accuracy', 'Precision', 'Recall', 'F1', 'CV F1 (5-fold)']:
    table[col] = table[col].round(3)
table.to_csv('model_comparison.csv', index=False)

print()
print('===== MODEL COMPARISON =====')
print(table.to_string(index=False))

for task, cm_df, report in details:
    print()
    print('===== ' + task + ' (Logistic Regression, deployed model) =====')
    print('Confusion matrix:')
    print(cm_df.to_string())
    print(report)