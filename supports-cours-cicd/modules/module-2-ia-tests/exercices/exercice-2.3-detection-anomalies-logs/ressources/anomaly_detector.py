#!/usr/bin/env python3
"""
Détecteur d'anomalies dans les logs avec Machine Learning
Utilise l'algorithme Isolation Forest pour détecter les patterns anormaux
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import logging
from typing import Dict, List, Tuple, Optional
import re

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LogAnomalyDetector:
    """
    Détecteur d'anomalies pour logs applicatifs utilisant Isolation Forest
    """
    
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        """
        Initialise le détecteur d'anomalies
        
        Args:
            contamination: Proportion d'anomalies attendues (0.1 = 10%)
            random_state: Graine pour la reproductibilité
        """
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.is_trained = False
        
    def extract_features(self, log_entries: List[Dict]) -> pd.DataFrame:
        """
        Extrait les features des entrées de logs
        
        Args:
            log_entries: Liste des entrées de logs
            
        Returns:
            DataFrame avec les features extraites
        """
        features = []
        
        for entry in log_entries:
            try:
                # Features temporelles
                timestamp = pd.to_datetime(entry.get('timestamp', datetime.now()))
                hour_of_day = timestamp.hour
                day_of_week = timestamp.weekday()
                
                # Features de requête HTTP
                status_code = int(entry.get('status_code', 200))
                response_time = float(entry.get('response_time', 0))
                request_size = int(entry.get('request_size', 0))
                response_size = int(entry.get('response_size', 0))
                
                # Features de contenu
                method = entry.get('method', 'GET')
                method_encoded = self._encode_method(method)
                
                # Features d'erreur
                error_count = len(re.findall(r'error|exception|fail', 
                                           entry.get('message', '').lower()))
                
                # Features de performance
                cpu_usage = float(entry.get('cpu_usage', 0))
                memory_usage = float(entry.get('memory_usage', 0))
                
                # Features de sécurité
                suspicious_patterns = self._detect_suspicious_patterns(entry)
                
                feature_dict = {
                    'hour_of_day': hour_of_day,
                    'day_of_week': day_of_week,
                    'status_code': status_code,
                    'response_time': response_time,
                    'request_size': request_size,
                    'response_size': response_size,
                    'method_encoded': method_encoded,
                    'error_count': error_count,
                    'cpu_usage': cpu_usage,
                    'memory_usage': memory_usage,
                    'suspicious_patterns': suspicious_patterns,
                    'status_is_error': 1 if status_code >= 400 else 0,
                    'response_time_high': 1 if response_time > 5000 else 0,
                    'size_ratio': response_size / max(request_size, 1)
                }
                
                features.append(feature_dict)
                
            except Exception as e:
                logger.warning(f"Erreur lors de l'extraction des features: {e}")
                continue
                
        df = pd.DataFrame(features)
        
        # Gestion des valeurs manquantes
        df = df.fillna(0)
        
        return df
    
    def _encode_method(self, method: str) -> int:
        """Encode les méthodes HTTP en valeurs numériques"""
        method_mapping = {
            'GET': 1, 'POST': 2, 'PUT': 3, 'DELETE': 4,
            'PATCH': 5, 'HEAD': 6, 'OPTIONS': 7
        }
        return method_mapping.get(method.upper(), 0)
    
    def _detect_suspicious_patterns(self, entry: Dict) -> int:
        """Détecte des patterns suspects dans les logs"""
        suspicious_count = 0
        message = entry.get('message', '').lower()
        url = entry.get('url', '').lower()
        
        # Patterns d'attaque courants
        attack_patterns = [
            r'sql.*injection', r'xss', r'script.*alert',
            r'union.*select', r'drop.*table', r'../.*/',
            r'cmd.*exec', r'eval\(', r'base64_decode'
        ]
        
        for pattern in attack_patterns:
            if re.search(pattern, message + ' ' + url):
                suspicious_count += 1
                
        return suspicious_count
    
    def train(self, log_entries: List[Dict], validation_split: float = 0.2) -> Dict:
        """
        Entraîne le modèle de détection d'anomalies
        
        Args:
            log_entries: Données d'entraînement
            validation_split: Proportion des données pour la validation
            
        Returns:
            Métriques d'entraînement
        """
        logger.info(f"Entraînement sur {len(log_entries)} entrées de logs")
        
        # Extraction des features
        features_df = self.extract_features(log_entries)
        self.feature_columns = features_df.columns.tolist()
        
        # Division train/validation
        X_train, X_val = train_test_split(
            features_df, test_size=validation_split, random_state=self.random_state
        )
        
        # Normalisation
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        # Entraînement
        self.model.fit(X_train_scaled)
        self.is_trained = True
        
        # Évaluation
        train_predictions = self.model.predict(X_train_scaled)
        val_predictions = self.model.predict(X_val_scaled)
        
        # Calcul des scores d'anomalie
        train_scores = self.model.decision_function(X_train_scaled)
        val_scores = self.model.decision_function(X_val_scaled)
        
        metrics = {
            'train_anomalies': np.sum(train_predictions == -1),
            'val_anomalies': np.sum(val_predictions == -1),
            'train_anomaly_rate': np.mean(train_predictions == -1),
            'val_anomaly_rate': np.mean(val_predictions == -1),
            'train_score_mean': np.mean(train_scores),
            'val_score_mean': np.mean(val_scores),
            'feature_count': len(self.feature_columns)
        }
        
        logger.info(f"Entraînement terminé. Anomalies détectées: "
                   f"Train={metrics['train_anomalies']}, Val={metrics['val_anomalies']}")
        
        return metrics
    
    def predict(self, log_entries: List[Dict]) -> List[Dict]:
        """
        Prédit les anomalies dans de nouvelles entrées de logs
        
        Args:
            log_entries: Nouvelles entrées à analyser
            
        Returns:
            Liste des prédictions avec scores
        """
        if not self.is_trained:
            raise ValueError("Le modèle doit être entraîné avant la prédiction")
        
        features_df = self.extract_features(log_entries)
        
        # S'assurer que toutes les features sont présentes
        for col in self.feature_columns:
            if col not in features_df.columns:
                features_df[col] = 0
        
        features_df = features_df[self.feature_columns]
        features_scaled = self.scaler.transform(features_df)
        
        # Prédictions et scores
        predictions = self.model.predict(features_scaled)
        scores = self.model.decision_function(features_scaled)
        
        results = []
        for i, (entry, pred, score) in enumerate(zip(log_entries, predictions, scores)):
            result = {
                'log_entry': entry,
                'is_anomaly': pred == -1,
                'anomaly_score': float(score),
                'confidence': abs(float(score)),
                'timestamp': entry.get('timestamp', datetime.now().isoformat())
            }
            results.append(result)
        
        return results
    
    def save_model(self, filepath: str):
        """Sauvegarde le modèle entraîné"""
        if not self.is_trained:
            raise ValueError("Aucun modèle entraîné à sauvegarder")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'contamination': self.contamination,
            'random_state': self.random_state
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Modèle sauvegardé dans {filepath}")
    
    def load_model(self, filepath: str):
        """Charge un modèle pré-entraîné"""
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.contamination = model_data['contamination']
        self.random_state = model_data['random_state']
        self.is_trained = True
        
        logger.info(f"Modèle chargé depuis {filepath}")

def main():
    """Fonction principale pour tester le détecteur"""
    # Exemple d'utilisation
    detector = LogAnomalyDetector(contamination=0.1)
    
    # Données d'exemple
    sample_logs = [
        {
            'timestamp': '2024-01-15T10:30:00Z',
            'status_code': 200,
            'response_time': 150,
            'method': 'GET',
            'url': '/api/users',
            'request_size': 1024,
            'response_size': 2048,
            'message': 'Request processed successfully',
            'cpu_usage': 45.2,
            'memory_usage': 67.8
        },
        {
            'timestamp': '2024-01-15T10:31:00Z',
            'status_code': 500,
            'response_time': 5000,
            'method': 'POST',
            'url': '/api/login',
            'request_size': 512,
            'response_size': 128,
            'message': 'Database connection error - timeout after 5000ms',
            'cpu_usage': 89.5,
            'memory_usage': 92.1
        }
    ]
    
    # Entraînement (normalement avec plus de données)
    metrics = detector.train(sample_logs * 100)  # Répéter pour avoir plus de données
    print("Métriques d'entraînement:", metrics)
    
    # Prédiction
    predictions = detector.predict(sample_logs)
    for pred in predictions:
        print(f"Anomalie: {pred['is_anomaly']}, Score: {pred['anomaly_score']:.3f}")

if __name__ == "__main__":
    main()