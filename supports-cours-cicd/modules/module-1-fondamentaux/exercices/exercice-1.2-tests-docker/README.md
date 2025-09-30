# Exercice 1.2 - Configuration de tests automatisés avec Docker

## Objectifs
- Comprendre l'intégration de Docker dans les pipelines CI/CD
- Configurer un environnement de test isolé avec Docker
- Automatiser l'exécution des tests dans des conteneurs
- Gérer les dépendances et l'environnement de test

## Prérequis
- Docker installé et configuré
- Connaissances de base des conteneurs Docker
- Compréhension des pipelines CI/CD (Exercice 1.1 complété)
- Node.js et npm (pour l'application de test)

## Matériel
- Application Node.js avec tests unitaires
- Dockerfile pour l'environnement de test
- Configuration GitHub Actions avec Docker
- Base de données de test (MongoDB)

## Durée Estimée
45 minutes

## Contexte
Dans cet exercice, vous allez apprendre à utiliser Docker pour créer un environnement de test reproductible et isolé. Vous configurerez un pipeline CI/CD qui exécute les tests dans des conteneurs Docker, garantissant ainsi la cohérence entre les environnements de développement, de test et de production.

## Instructions

### Étape 1 : Analyse du projet existant
1. Examinez la structure du projet dans le dossier `ressources/`
2. Identifiez les dépendances de l'application
3. Notez les services externes requis (base de données)

### Étape 2 : Création du Dockerfile de test
1. Créez un `Dockerfile.test` dans le dossier `ressources/`
2. Configurez l'image de base Node.js
3. Installez les dépendances de test
4. Configurez l'environnement de test

### Étape 3 : Configuration Docker Compose pour les tests
1. Créez un fichier `docker-compose.test.yml`
2. Définissez le service de l'application
3. Ajoutez le service MongoDB pour les tests
4. Configurez les variables d'environnement

### Étape 4 : Adaptation des tests pour Docker
1. Modifiez la configuration de test pour utiliser MongoDB en conteneur
2. Ajoutez les scripts de préparation de la base de données
3. Configurez les timeouts appropriés

### Étape 5 : Intégration dans GitHub Actions
1. Modifiez le workflow GitHub Actions existant
2. Ajoutez les étapes Docker
3. Configurez l'exécution des tests en conteneur
4. Gérez les artefacts et logs

### Étape 6 : Test et validation
1. Poussez les modifications sur GitHub
2. Vérifiez l'exécution du pipeline
3. Analysez les logs et résultats
4. Testez la reproductibilité

## Résultat Attendu
À la fin de cet exercice, vous devriez avoir :
- Un environnement de test complètement dockerisé
- Un pipeline CI/CD qui exécute les tests dans des conteneurs
- Une configuration reproductible sur tous les environnements
- Des tests qui passent de manière cohérente

## Critères de Validation
- [ ] Le Dockerfile.test construit sans erreur
- [ ] Docker Compose lance tous les services correctement
- [ ] Les tests s'exécutent avec succès dans les conteneurs
- [ ] Le pipeline GitHub Actions fonctionne avec Docker
- [ ] Les logs sont accessibles et informatifs
- [ ] L'environnement est reproductible

## Points Clés à Retenir
- **Isolation** : Docker garantit un environnement de test isolé et reproductible
- **Cohérence** : Même environnement en développement, test et production
- **Dépendances** : Gestion simplifiée des services externes (bases de données, caches)
- **Parallélisation** : Possibilité d'exécuter plusieurs environnements de test simultanément
- **Débogage** : Facilité de reproduction des problèmes localement

## Ressources Complémentaires
- [Documentation Docker pour CI/CD](https://docs.docker.com/ci-cd/)
- [GitHub Actions avec Docker](https://docs.github.com/en/actions/using-containerized-services)
- [Bonnes pratiques Docker pour les tests](https://docs.docker.com/develop/dev-best-practices/)

## Dépannage Courant
- **Problème de connexion à MongoDB** : Vérifiez les variables d'environnement et la configuration réseau
- **Tests lents** : Optimisez les images Docker et utilisez le cache des layers
- **Erreurs de permissions** : Configurez correctement les utilisateurs dans les conteneurs