"""
Продвинутая система ML-рекомендаций для SmartSwipe
Включает несколько алгоритмов: Content-Based, User-Based, Ensemble
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import os
from typing import List, Dict, Tuple, Optional
import uuid
from datetime import datetime

from ..models import User, Idea, Swipe, IdeaView
from ..crud.swipe import get_user_likes, get_user_swipe_history


class AdvancedRecommender:
    """Продвинутая система рекомендаций"""
    
    def __init__(self, model_dir: str = "backend/ml_models"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Модели
        self.content_model = None
        self.user_model = None
        self.ensemble_model = None
        
        # Предобработчики
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.domain_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        
        # Матрицы сходства
        self.content_similarity_matrix = None
        self.user_similarity_matrix = None
        
        # Метаданные
        self.ideas_df = None
        self.users_df = None
        self.training_metrics = {}
        
    
    def _prepare_idea_features(self, ideas: List[Idea]) -> pd.DataFrame:
        """Подготавливает признаки идей"""
        
        data = []
        for idea in ideas:
            # Объединяем title, description, tags в один текст
            combined_text = f"{idea.title} {idea.description} {' '.join(idea.tags)}"
            
            data.append({
                'id': str(idea.id),
                'title': idea.title,
                'description': idea.description,
                'tags': idea.tags,
                'domain': idea.domain,
                'combined_text': combined_text,
                'text_length': len(combined_text),
                'tag_count': len(idea.tags),
                'created_at': idea.created_at
            })
        
        df = pd.DataFrame(data)
        
        if len(df) > 0:
            # Кодируем домены
            df['domain_encoded'] = self.domain_encoder.fit_transform(df['domain'])
            
            # TF-IDF для текста
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(df['combined_text'])
            
            # Добавляем TF-IDF как признаки
            tfidf_df = pd.DataFrame(
                tfidf_matrix.toarray(),
                columns=[f'tfidf_{i}' for i in range(tfidf_matrix.shape[1])]
            )
            
            df = pd.concat([df.reset_index(drop=True), tfidf_df], axis=1)
        
        return df
    
    
    def _prepare_user_features(self, db_session, users: List[User]) -> pd.DataFrame:
        """Подготавливает признаки пользователей"""
        
        data = []
        for user in users:
            # Получаем статистику пользователя
            user_likes = get_user_likes(db_session, user.id)
            user_history = get_user_swipe_history(db_session, user.id)
            
            # Статистика доменов
            liked_domains = [like.idea.domain for like in user_likes if like.idea]
            domain_stats = {}
            for domain in set(liked_domains):
                domain_stats[f'liked_{domain}'] = liked_domains.count(domain)
            
            # Общая статистика
            total_swipes = len(user_history)
            total_likes = len(user_likes)
            like_ratio = total_likes / total_swipes if total_swipes > 0 else 0
            
            # Средняя длина тегов в лайкнутых идеях
            avg_tags_per_like = np.mean([len(like.idea.tags) for like in user_likes if like.idea]) if user_likes else 0
            
            # Доля лайкнутых доменов
            user_domains = user.selected_domains or []
            liked_domains_ratio = len(set(liked_domains)) / len(user_domains) if user_domains else 0
            
            user_data = {
                'id': str(user.id),
                'total_swipes': total_swipes,
                'total_likes': total_likes,
                'like_ratio': like_ratio,
                'avg_tags_per_like': avg_tags_per_like,
                'liked_domains_ratio': liked_domains_ratio,
                'swipe_history_length': total_swipes,
                'selected_domains_count': len(user_domains),
                **domain_stats
            }
            
            data.append(user_data)
        
        return pd.DataFrame(data)
    
    
    def _prepare_training_data(self, db_session) -> Tuple[np.ndarray, np.ndarray]:
        """Подготавливает данные для обучения"""
        
        # Получаем все свайпы
        swipes = db_session.query(Swipe).join(Idea).join(User).all()
        
        training_data = []
        labels = []
        
        for swipe in swipes:
            if not swipe.idea or not swipe.user:
                continue
                
            # Признаки идеи
            idea = swipe.idea
            combined_text = f"{idea.title} {idea.description} {' '.join(idea.tags)}"
            
            # Признаки пользователя
            user = swipe.user
            user_likes = get_user_likes(db_session, user.id)
            user_history = get_user_swipe_history(db_session, user.id)
            
            # Вектор признаков
            features = [
                # Признаки идеи
                len(combined_text),  # длина текста
                len(idea.tags),      # количество тегов
                self.domain_encoder.fit_transform([idea.domain])[0] if hasattr(self.domain_encoder, 'classes_') else 0,
                
                # Признаки пользователя
                len(user_history),   # история свайпов
                len(user_likes),     # количество лайков
                len(user_likes) / len(user_history) if user_history else 0,  # соотношение лайков
                len(user.selected_domains or []),  # количество выбранных доменов
                
                # Взаимодействие пользователь-идея
                1 if idea.domain in (user.selected_domains or []) else 0,  # идея в доменах пользователя
            ]
            
            training_data.append(features)
            labels.append(1 if swipe.swipe else 0)
        
        return np.array(training_data), np.array(labels)
    
    
    def train_content_based_model(self, ideas: List[Idea]):
        """Обучает content-based модель"""
        
        self.ideas_df = self._prepare_idea_features(ideas)
        
        if len(self.ideas_df) < 2:
            print("❌ Недостаточно идей для content-based модели")
            return
        
        # Создаем матрицу сходства по содержанию
        tfidf_columns = [col for col in self.ideas_df.columns if col.startswith('tfidf_')]
        if tfidf_columns:
            tfidf_matrix = self.ideas_df[tfidf_columns].values
            self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
        
        print(f"✅ Content-based модель обучена на {len(ideas)} идеях")
    
    
    def train_user_based_model(self, db_session, users: List[User]):
        """Обучает user-based модель"""
        
        self.users_df = self._prepare_user_features(db_session, users)
        
        if len(self.users_df) < 2:
            print("❌ Недостаточно пользователей для user-based модели")
            return
        
        # Создаем матрицу сходства пользователей
        feature_columns = ['like_ratio', 'avg_tags_per_like', 'liked_domains_ratio']
        available_columns = [col for col in feature_columns if col in self.users_df.columns]
        
        if available_columns:
            user_features = self.users_df[available_columns].fillna(0)
            user_features_scaled = self.scaler.fit_transform(user_features)
            self.user_similarity_matrix = cosine_similarity(user_features_scaled)
        
        print(f"✅ User-based модель обучена на {len(users)} пользователях")
    
    
    def train_ensemble_model(self, db_session):
        """Обучает ensemble модель"""
        
        X, y = self._prepare_training_data(db_session)
        
        if len(X) < 10:
            print("❌ Недостаточно данных для ensemble модели")
            return
        
        # Проверяем, что в выборке есть как минимум два класса (и лайки, и дизлайки)
        unique_classes = np.unique(y)
        if unique_classes.shape[0] < 2:
            print("❌ Недостаточно классов для обучения (нужны и лайки, и дизлайки)")
            # Сохраним пояснение в метриках, чтобы отдать его через /api/ml/metrics
            self.training_metrics["ensemble"] = {
                "error": "single_class",
                "message": "Training requires at least two classes in swipe labels",
                "positive_rate": float(y.mean()) if len(y) > 0 else 0.0,
                "samples": int(len(y))
            }
            # Модель не обучаем
            self.ensemble_model = None
            return
        
        # Разделяем данные
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Нормализуем признаки
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Обучаем несколько моделей
        models = {
            'logistic': LogisticRegression(random_state=42),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(random_state=42)
        }
        
        best_model = None
        best_score = 0
        
        for name, model in models.items():
            # Кросс-валидация
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=3, scoring='accuracy')
            
            # Обучаем на всех данных
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            
            # Метрики
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, zero_division=0)
            recall = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            metrics = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            self.training_metrics[name] = metrics
            
            print(f"📊 {name}: Accuracy={accuracy:.3f}, F1={f1:.3f}")
            
            if accuracy > best_score:
                best_score = accuracy
                best_model = model
        
        self.ensemble_model = best_model
        
        # Сохраняем модель
        model_path = os.path.join(self.model_dir, 'ensemble_model.joblib')
        joblib.dump(self.ensemble_model, model_path)
        
        # Сохраняем scaler
        scaler_path = os.path.join(self.model_dir, 'scaler.joblib')
        joblib.dump(self.scaler, scaler_path)
        
        print(f"✅ Ensemble модель обучена и сохранена. Лучшая точность: {best_score:.3f}")
    
    
    def predict_user_preference(self, db_session, user: User, idea: Idea) -> Dict:
        """Предсказывает предпочтение пользователя к идее"""
        
        if not self.ensemble_model:
            return {"probability": 0.5, "confidence": "low", "method": "random"}
        
        try:
            # Подготавливаем признаки
            user_likes = get_user_likes(db_session, user.id)
            user_history = get_user_swipe_history(db_session, user.id)
            
            combined_text = f"{idea.title} {idea.description} {' '.join(idea.tags)}"
            
            features = [
                len(combined_text),
                len(idea.tags),
                self.domain_encoder.transform([idea.domain])[0] if hasattr(self.domain_encoder, 'classes_') and idea.domain in self.domain_encoder.classes_ else 0,
                len(user_history),
                len(user_likes),
                len(user_likes) / len(user_history) if user_history else 0,
                len(user.selected_domains or []),
                1 if idea.domain in (user.selected_domains or []) else 0,
            ]
            
            # Предсказание
            features_scaled = self.scaler.transform([features])
            probability = self.ensemble_model.predict_proba(features_scaled)[0][1]
            
            # Уверенность
            confidence = "high" if abs(probability - 0.5) > 0.3 else "medium" if abs(probability - 0.5) > 0.1 else "low"
            
            return {
                "probability": float(probability),
                "confidence": confidence,
                "method": "ensemble_ml"
            }
            
        except Exception as e:
            print(f"❌ Ошибка предсказания: {e}")
            return {"probability": 0.5, "confidence": "low", "method": "fallback"}
    
    
    def get_recommendations(self, db_session, user: User, ideas: List[Idea], top_k: int = 10) -> List[Dict]:
        """Получает топ-K рекомендаций для пользователя"""
        
        recommendations = []
        
        for idea in ideas:
            prediction = self.predict_user_preference(db_session, user, idea)
            
            recommendations.append({
                "idea": idea,
                "probability": prediction["probability"],
                "confidence": prediction["confidence"],
                "method": prediction["method"]
            })
        
        # Сортируем по вероятности
        recommendations.sort(key=lambda x: x["probability"], reverse=True)
        
        return recommendations[:top_k]
    
    
    def get_feature_importance(self) -> Dict:
        """Возвращает важность признаков"""
        
        if not self.ensemble_model or not hasattr(self.ensemble_model, 'feature_importances_'):
            return {}
        
        feature_names = [
            'text_length', 'tag_count', 'domain', 'user_history_length',
            'user_likes_count', 'like_ratio', 'selected_domains_count', 'domain_match'
        ]
        
        importances = self.ensemble_model.feature_importances_
        
        return dict(zip(feature_names, importances.tolist()))
    
    
    def get_training_metrics(self) -> Dict:
        """Возвращает метрики обучения"""
        return self.training_metrics


# Глобальный инстанс рекомендателя
advanced_recommender = AdvancedRecommender() 