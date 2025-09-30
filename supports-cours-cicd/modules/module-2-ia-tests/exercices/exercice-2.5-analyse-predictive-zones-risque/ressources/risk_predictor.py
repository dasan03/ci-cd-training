#!/usr/bin/env python3
"""
Prédicteur de risques pour l'analyse de code
Utilise des algorithmes de machine learning pour prédire les zones de code à risque
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.feature_selection import SelectKBest, f_classif
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiskPredictor:
    """
    Prédicteur de risques basé sur les métriques de code et l'historique Git
    """
    
    def __init__(self, model_type: str = 'random_forest'):
        """
        Initialise le prédicteur de risques
        
        Args:
            model_type: Type de modèle ('random_forest', 'gradient_boosting', 'logistic')
        """
        self.model_type = model_type
        self.model = self._create_model(model_type)
        self.scaler = StandardScaler()
        self.feature_selector = SelectKBest(f_classif, k=15)
        self.label_encoders = {}
        self.feature_names = []
        self.is_trained = False
        
    def _create_model(self, model_type: str):
        """Crée le modèle selon le type spécifié"""
        if model_type == 'random_forest':
            return RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        elif model_type == 'gradient_boosting':
            return GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
        elif model_type == 'logistic':
            return LogisticRegression(
                random_state=42,
                max_iter=1000
            )
        else:
            raise ValueError(f"Type de modèle non supporté: {model_type}")
    
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prépare les features pour l'entraînement ou la prédiction
        
        Args:
            data: DataFrame avec les données brutes
            
        Returns:
            DataFrame avec les features préparées
        """
        features = data.copy()
        
        # Features de complexité de code
        if 'cyclomatic_complexity' in features.columns:
            features['complexity_high'] = (features['cyclomatic_complexity'] > 10).astype(int)
            features['complexity_very_high'] = (features['cyclomatic_complexity'] > 20).astype(int)
        
        # Features de taille
        if 'lines_of_code' in features.columns:
            features['loc_large'] = (features['lines_of_code'] > 200).astype(int)
            features['loc_very_large'] = (features['lines_of_code'] > 500).astype(int)
        
        # Features de changements Git
        if 'commit_count' in features.columns:
            features['high_churn'] = (features['commit_count'] > features['commit_count'].quantile(0.8)).astype(int)
            features['very_high_churn'] = (features['commit_count'] > features['commit_count'].quantile(0.95)).astype(int)
        
        # Features temporelles
        if 'file_age_days' in features.columns:
            features['file_new'] = (features['file_age_days'] < 30).astype(int)
            features['file_old'] = (features['file_age_days'] > 365).astype(int)
        
        # Features d'équipe
        if 'author_count' in features.columns:
            features['multiple_authors'] = (features['author_count'] > 1).astype(int)
            features['many_authors'] = (features['author_count'] > 3).astype(int)
        
        # Ratios et interactions
        if 'lines_added' in features.columns and 'lines_deleted' in features.columns:
            features['churn_ratio'] = features['lines_added'] / (features['lines_deleted'] + 1)
            features['total_churn'] = features['lines_added'] + features['lines_deleted']
        
        if 'bug_count' in features.columns and 'commit_count' in features.columns:
            features['bug_density'] = features['bug_count'] / (features['commit_count'] + 1)
        
        # Features de qualité de code
        if 'code_smells' in features.columns:
            features['has_code_smells'] = (features['code_smells'] > 0).astype(int)
            features['many_code_smells'] = (features['code_smells'] > 5).astype(int)
        
        # Encodage des variables catégorielles
        categorical_columns = features.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                features[col] = self.label_encoders[col].fit_transform(features[col].astype(str))
            else:
                # Pour les nouvelles données, utiliser l'encodeur existant
                try:
                    features[col] = self.label_encoders[col].transform(features[col].astype(str))
                except ValueError:
                    # Gérer les nouvelles catégories non vues pendant l'entraînement
                    features[col] = 0
        
        # Gestion des valeurs manquantes
        features = features.fillna(0)
        
        return features
    
    def train(self, data: pd.DataFrame, target_column: str = 'is_buggy', 
              validation_split: float = 0.2) -> Dict:
        """
        Entraîne le modèle de prédiction de risques
        
        Args:
            data: Données d'entraînement
            target_column: Nom de la colonne cible
            validation_split: Proportion des données pour la validation
            
        Returns:
            Métriques d'entraînement
        """
        logger.info(f"Entraînement du modèle {self.model_type} sur {len(data)} échantillons")
        
        # Préparation des features
        features = self.prepare_features(data.drop(columns=[target_column]))
        target = data[target_column]
        
        # Division train/validation
        X_train, X_val, y_train, y_val = train_test_split(
            features, target, test_size=validation_split, 
            random_state=42, stratify=target
        )
        
        # Normalisation
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        # Sélection des features
        X_train_selected = self.feature_selector.fit_transform(X_train_scaled, y_train)
        X_val_selected = self.feature_selector.transform(X_val_scaled)
        
        # Sauvegarde des noms de features sélectionnées
        selected_indices = self.feature_selector.get_support(indices=True)
        self.feature_names = [features.columns[i] for i in selected_indices]
        
        # Entraînement
        self.model.fit(X_train_selected, y_train)
        self.is_trained = True
        
        # Prédictions
        y_train_pred = self.model.predict(X_train_selected)
        y_val_pred = self.model.predict(X_val_selected)
        y_train_proba = self.model.predict_proba(X_train_selected)[:, 1]
        y_val_proba = self.model.predict_proba(X_val_selected)[:, 1]
        
        # Calcul des métriques
        metrics = {
            'train_accuracy': np.mean(y_train_pred == y_train),
            'val_accuracy': np.mean(y_val_pred == y_val),
            'train_auc': roc_auc_score(y_train, y_train_proba),
            'val_auc': roc_auc_score(y_val, y_val_proba),
            'feature_count': len(self.feature_names),
            'train_samples': len(X_train),
            'val_samples': len(X_val)
        }
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train_selected, y_train, cv=5, scoring='roc_auc')
        metrics['cv_auc_mean'] = cv_scores.mean()
        metrics['cv_auc_std'] = cv_scores.std()
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
            metrics['feature_importance'] = sorted(feature_importance.items(), 
                                                 key=lambda x: x[1], reverse=True)
        
        logger.info(f"Entraînement terminé. AUC validation: {metrics['val_auc']:.3f}")
        
        return metrics
    
    def predict_risk(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prédit les risques pour de nouvelles données
        
        Args:
            data: Nouvelles données à analyser
            
        Returns:
            DataFrame avec les prédictions de risque
        """
        if not self.is_trained:
            raise ValueError("Le modèle doit être entraîné avant la prédiction")
        
        # Préparation des features
        features = self.prepare_features(data)
        
        # S'assurer que toutes les features sont présentes
        for feature in self.feature_names:
            if feature not in features.columns:
                features[feature] = 0
        
        # Normalisation et sélection
        features_scaled = self.scaler.transform(features)
        features_selected = self.feature_selector.transform(features_scaled)
        
        # Prédictions
        risk_probabilities = self.model.predict_proba(features_selected)[:, 1]
        risk_predictions = self.model.predict(features_selected)
        
        # Création du DataFrame de résultats
        results = data.copy()
        results['risk_probability'] = risk_probabilities
        results['risk_prediction'] = risk_predictions
        results['risk_level'] = self._categorize_risk(risk_probabilities)
        
        return results
    
    def _categorize_risk(self, probabilities: np.ndarray) -> List[str]:
        """Catégorise les probabilités de risque en niveaux"""
        categories = []
        for prob in probabilities:
            if prob >= 0.8:
                categories.append('ÉLEVÉ')
            elif prob >= 0.6:
                categories.append('MOYEN-ÉLEVÉ')
            elif prob >= 0.4:
                categories.append('MOYEN')
            elif prob >= 0.2:
                categories.append('FAIBLE-MOYEN')
            else:
                categories.append('FAIBLE')
        return categories
    
    def analyze_file_risk(self, file_path: str, metrics: Dict) -> Dict:
        """
        Analyse le risque d'un fichier spécifique
        
        Args:
            file_path: Chemin du fichier
            metrics: Métriques du fichier
            
        Returns:
            Analyse détaillée du risque
        """
        # Créer un DataFrame avec les métriques du fichier
        file_data = pd.DataFrame([metrics])
        
        # Prédire le risque
        risk_result = self.predict_risk(file_data)
        
        analysis = {
            'file_path': file_path,
            'risk_probability': float(risk_result['risk_probability'].iloc[0]),
            'risk_level': risk_result['risk_level'].iloc[0],
            'risk_factors': self._identify_risk_factors(metrics),
            'recommendations': self._generate_recommendations(metrics, risk_result['risk_probability'].iloc[0])
        }
        
        return analysis
    
    def _identify_risk_factors(self, metrics: Dict) -> List[str]:
        """Identifie les facteurs de risque principaux"""
        factors = []
        
        if metrics.get('cyclomatic_complexity', 0) > 10:
            factors.append(f"Complexité élevée ({metrics['cyclomatic_complexity']})")
        
        if metrics.get('lines_of_code', 0) > 300:
            factors.append(f"Fichier volumineux ({metrics['lines_of_code']} lignes)")
        
        if metrics.get('commit_count', 0) > 20:
            factors.append(f"Nombreuses modifications ({metrics['commit_count']} commits)")
        
        if metrics.get('author_count', 0) > 3:
            factors.append(f"Nombreux contributeurs ({metrics['author_count']} auteurs)")
        
        if metrics.get('bug_count', 0) > 0:
            factors.append(f"Historique de bugs ({metrics['bug_count']} bugs)")
        
        return factors
    
    def _generate_recommendations(self, metrics: Dict, risk_prob: float) -> List[str]:
        """Génère des recommandations basées sur l'analyse"""
        recommendations = []
        
        if risk_prob > 0.8:
            recommendations.append("🔴 PRIORITÉ ÉLEVÉE: Refactoring immédiat recommandé")
            recommendations.append("📋 Code review obligatoire pour toute modification")
            recommendations.append("🧪 Augmenter la couverture de tests")
        
        if metrics.get('cyclomatic_complexity', 0) > 15:
            recommendations.append("🔧 Réduire la complexité cyclomatique")
            recommendations.append("📦 Diviser en fonctions plus petites")
        
        if metrics.get('lines_of_code', 0) > 500:
            recommendations.append("✂️ Diviser le fichier en modules plus petits")
        
        if metrics.get('commit_count', 0) > 30:
            recommendations.append("🔍 Analyser les raisons des modifications fréquentes")
        
        if not recommendations:
            recommendations.append("✅ Fichier dans les normes, surveillance continue")
        
        return recommendations
    
    def save_model(self, filepath: str):
        """Sauvegarde le modèle entraîné"""
        if not self.is_trained:
            raise ValueError("Aucun modèle entraîné à sauvegarder")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_selector': self.feature_selector,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'model_type': self.model_type
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Modèle sauvegardé dans {filepath}")
    
    def load_model(self, filepath: str):
        """Charge un modèle pré-entraîné"""
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_selector = model_data['feature_selector']
        self.label_encoders = model_data['label_encoders']
        self.feature_names = model_data['feature_names']
        self.model_type = model_data['model_type']
        self.is_trained = True
        
        logger.info(f"Modèle chargé depuis {filepath}")
    
    def plot_feature_importance(self, top_n: int = 15):
        """Affiche l'importance des features"""
        if not hasattr(self.model, 'feature_importances_'):
            logger.warning("Le modèle ne supporte pas l'importance des features")
            return
        
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False).head(top_n)
        
        plt.figure(figsize=(10, 8))
        sns.barplot(data=importance_df, x='importance', y='feature')
        plt.title(f'Top {top_n} Features les Plus Importantes')
        plt.xlabel('Importance')
        plt.tight_layout()
        plt.show()

def main():
    """Fonction principale pour tester le prédicteur"""
    # Données d'exemple
    sample_data = pd.DataFrame({
        'cyclomatic_complexity': [5, 15, 8, 25, 3],
        'lines_of_code': [100, 450, 200, 800, 50],
        'commit_count': [5, 30, 12, 45, 2],
        'author_count': [1, 4, 2, 6, 1],
        'bug_count': [0, 3, 1, 5, 0],
        'file_age_days': [30, 365, 120, 730, 15],
        'code_smells': [0, 8, 2, 12, 0],
        'is_buggy': [0, 1, 0, 1, 0]
    })
    
    # Créer et entraîner le prédicteur
    predictor = RiskPredictor('random_forest')
    metrics = predictor.train(sample_data)
    
    print("Métriques d'entraînement:")
    for key, value in metrics.items():
        if key != 'feature_importance':
            print(f"  {key}: {value}")
    
    # Test de prédiction
    test_file = {
        'cyclomatic_complexity': 18,
        'lines_of_code': 350,
        'commit_count': 25,
        'author_count': 3,
        'bug_count': 2,
        'file_age_days': 200,
        'code_smells': 5
    }
    
    analysis = predictor.analyze_file_risk('test_file.py', test_file)
    print(f"\nAnalyse de risque pour test_file.py:")
    print(f"  Probabilité de risque: {analysis['risk_probability']:.2%}")
    print(f"  Niveau de risque: {analysis['risk_level']}")
    print(f"  Facteurs de risque: {analysis['risk_factors']}")
    print(f"  Recommandations: {analysis['recommendations']}")

if __name__ == "__main__":
    main()