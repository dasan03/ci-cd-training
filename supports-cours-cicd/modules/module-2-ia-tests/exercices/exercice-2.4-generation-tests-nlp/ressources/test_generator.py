#!/usr/bin/env python3
"""
Générateur de cas de test automatisé utilisant des modèles NLP
Génère des tests à partir de spécifications en langage naturel
"""

import json
import re
import yaml
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
import logging
from datetime import datetime

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TestCase:
    """Structure d'un cas de test généré"""
    name: str
    description: str
    preconditions: List[str]
    steps: List[Dict[str, str]]
    expected_result: str
    test_data: Dict
    test_type: str  # positive, negative, edge_case
    priority: str   # high, medium, low

class SpecificationParser:
    """Parse les spécifications pour extraire les informations pertinentes"""
    
    def __init__(self):
        self.user_story_pattern = r"En tant que (.+?), je veux (.+?) afin de (.+?)\."
        self.acceptance_criteria_pattern = r"- (.+)"
        
    def parse_specification(self, spec_content: str) -> Dict:
        """
        Parse une spécification et extrait les éléments clés
        
        Args:
            spec_content: Contenu de la spécification
            
        Returns:
            Dictionnaire avec les éléments parsés
        """
        parsed = {
            'user_stories': [],
            'acceptance_criteria': [],
            'business_rules': [],
            'api_endpoints': [],
            'data_models': []
        }
        
        # Extraction des user stories
        user_stories = re.findall(self.user_story_pattern, spec_content, re.IGNORECASE)
        for role, action, benefit in user_stories:
            parsed['user_stories'].append({
                'role': role.strip(),
                'action': action.strip(),
                'benefit': benefit.strip()
            })
        
        # Extraction des critères d'acceptation
        lines = spec_content.split('\n')
        in_acceptance_section = False
        
        for line in lines:
            line = line.strip()
            if 'critères d\'acceptation' in line.lower() or 'acceptance criteria' in line.lower():
                in_acceptance_section = True
                continue
            elif line.startswith('#') and in_acceptance_section:
                in_acceptance_section = False
            elif in_acceptance_section and line.startswith('-'):
                criterion = line[1:].strip()
                parsed['acceptance_criteria'].append(criterion)
        
        # Extraction des endpoints API
        api_patterns = [
            r'(GET|POST|PUT|DELETE|PATCH)\s+(/[^\s]+)',
            r'endpoint[:\s]+([^\s]+)',
            r'API[:\s]+([^\s]+)'
        ]
        
        for pattern in api_patterns:
            matches = re.findall(pattern, spec_content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    parsed['api_endpoints'].append({
                        'method': match[0],
                        'path': match[1]
                    })
                else:
                    parsed['api_endpoints'].append({
                        'method': 'GET',
                        'path': match
                    })
        
        return parsed

class TestGenerator:
    """Générateur principal de cas de test"""
    
    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialise le générateur
        
        Args:
            config_path: Chemin vers le fichier de configuration
        """
        self.config = self._load_config(config_path)
        self.parser = SpecificationParser()
        self.templates = self._load_templates()
        
    def _load_config(self, config_path: str) -> Dict:
        """Charge la configuration"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Fichier de config {config_path} non trouvé, utilisation des valeurs par défaut")
            return {
                'generation': {
                    'test_types': ['positive', 'negative', 'edge_case'],
                    'max_tests_per_story': 5,
                    'include_performance_tests': False,
                    'include_security_tests': True
                },
                'output': {
                    'format': 'pytest',
                    'language': 'python'
                }
            }
    
    def _load_templates(self) -> Dict[str, str]:
        """Charge les templates de génération de tests"""
        return {
            'positive_test': """
def test_{test_name}():
    \"\"\"
    {description}
    
    Préconditions:
    {preconditions}
    \"\"\"
    # Arrange
    {test_data_setup}
    
    # Act
    {test_actions}
    
    # Assert
    {assertions}
""",
            'negative_test': """
def test_{test_name}_invalid_input():
    \"\"\"
    {description} - Test avec données invalides
    
    Préconditions:
    {preconditions}
    \"\"\"
    # Arrange
    {invalid_test_data}
    
    # Act & Assert
    with pytest.raises({expected_exception}):
        {test_actions}
""",
            'api_test': """
def test_{endpoint_name}_{test_type}():
    \"\"\"Test {method} {path} - {description}\"\"\"
    # Arrange
    {setup_code}
    
    # Act
    response = client.{method_lower}("{path}", {request_params})
    
    # Assert
    assert response.status_code == {expected_status}
    {additional_assertions}
"""
        }
    
    def generate_from_specification(self, spec_path: str) -> List[TestCase]:
        """
        Génère des cas de test à partir d'une spécification
        
        Args:
            spec_path: Chemin vers le fichier de spécification
            
        Returns:
            Liste des cas de test générés
        """
        logger.info(f"Génération de tests à partir de {spec_path}")
        
        # Lecture de la spécification
        with open(spec_path, 'r', encoding='utf-8') as f:
            spec_content = f.read()
        
        # Parse de la spécification
        parsed_spec = self.parser.parse_specification(spec_content)
        
        # Génération des tests
        test_cases = []
        
        # Tests basés sur les user stories
        for story in parsed_spec['user_stories']:
            test_cases.extend(self._generate_tests_from_user_story(story, parsed_spec))
        
        # Tests basés sur les endpoints API
        for endpoint in parsed_spec['api_endpoints']:
            test_cases.extend(self._generate_api_tests(endpoint, parsed_spec))
        
        # Tests basés sur les critères d'acceptation
        for criterion in parsed_spec['acceptance_criteria']:
            test_cases.extend(self._generate_tests_from_criterion(criterion, parsed_spec))
        
        logger.info(f"Génération terminée: {len(test_cases)} tests créés")
        return test_cases
    
    def _generate_tests_from_user_story(self, story: Dict, parsed_spec: Dict) -> List[TestCase]:
        """Génère des tests à partir d'une user story"""
        test_cases = []
        base_name = self._sanitize_name(story['action'])
        
        # Test positif principal
        positive_test = TestCase(
            name=f"test_{base_name}_success",
            description=f"Vérifie que {story['role']} peut {story['action']}",
            preconditions=["Système initialisé", "Utilisateur authentifié"],
            steps=[
                {"action": "Préparer les données de test", "data": "valid_data"},
                {"action": "Exécuter l'action", "data": story['action']},
                {"action": "Vérifier le résultat", "data": "success_criteria"}
            ],
            expected_result=f"L'action '{story['action']}' est réalisée avec succès",
            test_data=self._generate_test_data(story, 'positive'),
            test_type='positive',
            priority='high'
        )
        test_cases.append(positive_test)
        
        # Test négatif
        negative_test = TestCase(
            name=f"test_{base_name}_invalid_data",
            description=f"Vérifie la gestion d'erreur quand {story['role']} utilise des données invalides",
            preconditions=["Système initialisé"],
            steps=[
                {"action": "Préparer des données invalides", "data": "invalid_data"},
                {"action": "Tenter l'action", "data": story['action']},
                {"action": "Vérifier l'erreur", "data": "error_handling"}
            ],
            expected_result="Erreur appropriée retournée",
            test_data=self._generate_test_data(story, 'negative'),
            test_type='negative',
            priority='medium'
        )
        test_cases.append(negative_test)
        
        return test_cases
    
    def _generate_api_tests(self, endpoint: Dict, parsed_spec: Dict) -> List[TestCase]:
        """Génère des tests pour un endpoint API"""
        test_cases = []
        method = endpoint['method'].lower()
        path = endpoint['path']
        endpoint_name = self._sanitize_name(path.replace('/', '_'))
        
        # Test de succès
        success_test = TestCase(
            name=f"test_{method}_{endpoint_name}_success",
            description=f"Test {method.upper()} {path} avec données valides",
            preconditions=["API démarrée", "Base de données accessible"],
            steps=[
                {"action": f"Envoyer requête {method.upper()}", "data": path},
                {"action": "Vérifier status code", "data": "200-299"},
                {"action": "Vérifier format réponse", "data": "JSON valide"}
            ],
            expected_result=f"Requête {method.upper()} {path} réussie",
            test_data=self._generate_api_test_data(endpoint, 'success'),
            test_type='positive',
            priority='high'
        )
        test_cases.append(success_test)
        
        # Test d'erreur 400
        if method in ['post', 'put', 'patch']:
            error_test = TestCase(
                name=f"test_{method}_{endpoint_name}_bad_request",
                description=f"Test {method.upper()} {path} avec données invalides",
                preconditions=["API démarrée"],
                steps=[
                    {"action": f"Envoyer requête {method.upper()} invalide", "data": path},
                    {"action": "Vérifier status code 400", "data": "400"},
                    {"action": "Vérifier message d'erreur", "data": "error_message"}
                ],
                expected_result="Erreur 400 avec message explicite",
                test_data=self._generate_api_test_data(endpoint, 'error'),
                test_type='negative',
                priority='medium'
            )
            test_cases.append(error_test)
        
        return test_cases
    
    def _generate_tests_from_criterion(self, criterion: str, parsed_spec: Dict) -> List[TestCase]:
        """Génère des tests à partir d'un critère d'acceptation"""
        test_cases = []
        criterion_name = self._sanitize_name(criterion[:50])  # Limiter la longueur
        
        test_case = TestCase(
            name=f"test_{criterion_name}",
            description=f"Vérifie le critère: {criterion}",
            preconditions=["Système configuré selon les spécifications"],
            steps=[
                {"action": "Configurer l'environnement de test", "data": "setup"},
                {"action": "Exécuter le scénario", "data": criterion},
                {"action": "Vérifier le critère", "data": "validation"}
            ],
            expected_result=f"Le critère '{criterion}' est respecté",
            test_data={"criterion": criterion},
            test_type='positive',
            priority='medium'
        )
        test_cases.append(test_case)
        
        return test_cases
    
    def _generate_test_data(self, story: Dict, test_type: str) -> Dict:
        """Génère des données de test appropriées"""
        if test_type == 'positive':
            return {
                "user_role": story['role'],
                "action": story['action'],
                "valid_input": True,
                "expected_outcome": "success"
            }
        else:
            return {
                "user_role": story['role'],
                "action": story['action'],
                "valid_input": False,
                "expected_outcome": "error"
            }
    
    def _generate_api_test_data(self, endpoint: Dict, test_type: str) -> Dict:
        """Génère des données de test pour les API"""
        base_data = {
            "method": endpoint['method'],
            "path": endpoint['path']
        }
        
        if test_type == 'success':
            base_data.update({
                "expected_status": 200 if endpoint['method'] == 'GET' else 201,
                "valid_payload": True
            })
        else:
            base_data.update({
                "expected_status": 400,
                "valid_payload": False,
                "error_type": "validation_error"
            })
        
        return base_data
    
    def _sanitize_name(self, name: str) -> str:
        """Nettoie un nom pour en faire un nom de fonction valide"""
        # Remplacer les caractères spéciaux par des underscores
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
        # Supprimer les underscores multiples
        sanitized = re.sub(r'_+', '_', sanitized)
        # Supprimer les underscores en début/fin
        sanitized = sanitized.strip('_')
        return sanitized
    
    def export_tests(self, test_cases: List[TestCase], output_path: str, format_type: str = 'pytest'):
        """
        Exporte les cas de test dans le format spécifié
        
        Args:
            test_cases: Liste des cas de test à exporter
            output_path: Chemin de sortie
            format_type: Format d'export (pytest, unittest, etc.)
        """
        if format_type == 'pytest':
            self._export_pytest(test_cases, output_path)
        elif format_type == 'json':
            self._export_json(test_cases, output_path)
        else:
            raise ValueError(f"Format {format_type} non supporté")
    
    def _export_pytest(self, test_cases: List[TestCase], output_path: str):
        """Exporte au format pytest"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # En-tête du fichier
            f.write('"""Tests générés automatiquement"""\n')
            f.write('import pytest\n')
            f.write('from unittest.mock import Mock, patch\n\n')
            
            # Génération des tests
            for test_case in test_cases:
                if test_case.test_type == 'positive':
                    template = self.templates['positive_test']
                else:
                    template = self.templates['negative_test']
                
                test_code = template.format(
                    test_name=test_case.name.replace('test_', ''),
                    description=test_case.description,
                    preconditions='\n    '.join([f"- {p}" for p in test_case.preconditions]),
                    test_data_setup=self._generate_setup_code(test_case),
                    test_actions=self._generate_action_code(test_case),
                    assertions=self._generate_assertion_code(test_case),
                    invalid_test_data=self._generate_invalid_data_code(test_case),
                    expected_exception="ValueError"  # Par défaut
                )
                
                f.write(test_code)
                f.write('\n\n')
        
        logger.info(f"Tests exportés vers {output_file}")
    
    def _export_json(self, test_cases: List[TestCase], output_path: str):
        """Exporte au format JSON"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        test_data = []
        for test_case in test_cases:
            test_data.append({
                'name': test_case.name,
                'description': test_case.description,
                'preconditions': test_case.preconditions,
                'steps': test_case.steps,
                'expected_result': test_case.expected_result,
                'test_data': test_case.test_data,
                'test_type': test_case.test_type,
                'priority': test_case.priority
            })
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(test_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Tests exportés vers {output_file}")
    
    def _generate_setup_code(self, test_case: TestCase) -> str:
        """Génère le code de setup pour un test"""
        return f"# Setup basé sur: {test_case.test_data}\n    test_data = {test_case.test_data}"
    
    def _generate_action_code(self, test_case: TestCase) -> str:
        """Génère le code d'action pour un test"""
        actions = []
        for step in test_case.steps:
            actions.append(f"# {step['action']}")
        return '\n    '.join(actions)
    
    def _generate_assertion_code(self, test_case: TestCase) -> str:
        """Génère le code d'assertion pour un test"""
        return f"# Vérifier: {test_case.expected_result}\n    assert True  # TODO: Implémenter les assertions spécifiques"
    
    def _generate_invalid_data_code(self, test_case: TestCase) -> str:
        """Génère le code pour les données invalides"""
        return f"invalid_data = {{'invalid': True}}"

def main():
    """Fonction principale pour tester le générateur"""
    generator = TestGenerator()
    
    # Exemple de spécification
    spec_content = """
    # Gestion des Utilisateurs
    
    ## User Story
    En tant qu'administrateur, je veux créer un nouvel utilisateur afin de lui donner accès au système.
    
    ## Critères d'acceptation
    - L'utilisateur doit avoir un nom d'utilisateur unique
    - L'email doit être valide
    - Le mot de passe doit respecter la politique de sécurité
    - L'utilisateur créé doit recevoir un email de confirmation
    
    ## API
    POST /api/users
    GET /api/users/{id}
    """
    
    # Sauvegarde temporaire de la spec
    with open('temp_spec.md', 'w', encoding='utf-8') as f:
        f.write(spec_content)
    
    # Génération des tests
    test_cases = generator.generate_from_specification('temp_spec.md')
    
    # Export
    generator.export_tests(test_cases, 'generated_tests.py', 'pytest')
    generator.export_tests(test_cases, 'generated_tests.json', 'json')
    
    print(f"Génération terminée: {len(test_cases)} tests créés")

if __name__ == "__main__":
    main()