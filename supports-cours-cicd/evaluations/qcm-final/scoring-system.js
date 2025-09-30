/**
 * Système de scoring pour le QCM Final CI/CD
 * Conforme aux exigences ECF et aux compétences définies
 */

class QCMScoringSystem {
    constructor(qcmData) {
        this.qcmData = qcmData;
        this.competenceMapping = {
            'C8': 'Réaliser des tests d\'intégration',
            'C17': 'Automatiser les tests',
            'C18': 'Exécuter les tests de performance',
            'C19': 'Utiliser l\'intelligence artificielle pour optimiser les tests',
            'C20': 'Documenter et monitorer les tests',
            'C33': 'Collaborer à la gestion d\'un projet informatique'
        };
    }

    /**
     * Calcule le score global et par compétence
     * @param {Object} userAnswers - Réponses de l'utilisateur
     * @returns {Object} Résultats détaillés
     */
    calculateScore(userAnswers) {
        const results = {
            totalScore: 0,
            totalQuestions: this.qcmData.questions.length,
            competenceScores: {},
            moduleScores: {},
            detailedResults: [],
            passed: false,
            timestamp: new Date().toISOString()
        };

        // Initialiser les scores par compétence
        Object.keys(this.competenceMapping).forEach(comp => {
            results.competenceScores[comp] = {
                score: 0,
                total: 0,
                percentage: 0,
                validated: false,
                questions: []
            };
        });

        // Initialiser les scores par module
        const modules = ['module-1', 'module-2', 'module-3', 'module-4'];
        modules.forEach(module => {
            results.moduleScores[module] = {
                score: 0,
                total: 0,
                percentage: 0
            };
        });

        // Évaluer chaque question
        this.qcmData.questions.forEach(question => {
            const userAnswer = userAnswers[question.numero];
            const isCorrect = this.evaluateAnswer(question, userAnswer);
            
            const questionResult = {
                questionId: question.id,
                questionNumber: question.numero,
                module: question.module,
                competence: question.competence,
                userAnswer: userAnswer,
                correctAnswer: question.reponse_correcte,
                isCorrect: isCorrect,
                explanation: question.explication,
                difficulty: question.difficulte
            };

            results.detailedResults.push(questionResult);

            // Mettre à jour les scores
            if (isCorrect) {
                results.totalScore++;
                results.competenceScores[question.competence].score++;
            }

            results.competenceScores[question.competence].total++;
            results.competenceScores[question.competence].questions.push(questionResult);
            results.moduleScores[question.module].total++;
            
            if (isCorrect) {
                results.moduleScores[question.module].score++;
            }
        });

        // Calculer les pourcentages et validations
        this.calculatePercentagesAndValidation(results);

        return results;
    }

    /**
     * Évalue une réponse individuelle
     * @param {Object} question - Question du QCM
     * @param {*} userAnswer - Réponse de l'utilisateur
     * @returns {boolean} True si la réponse est correcte
     */
    evaluateAnswer(question, userAnswer) {
        if (userAnswer === undefined || userAnswer === null) {
            return false;
        }

        switch (question.type) {
            case 'choix-multiple':
                return userAnswer === question.reponse_correcte;
                
            case 'vrai-faux':
                return userAnswer === question.reponse_correcte;
                
            case 'association':
                if (!Array.isArray(userAnswer) || !Array.isArray(question.associations_correctes)) {
                    return false;
                }
                
                if (userAnswer.length !== question.associations_correctes.length) {
                    return false;
                }
                
                // Vérifier chaque association
                return question.associations_correctes.every(correctAssoc => {
                    return userAnswer.some(userAssoc => 
                        userAssoc[0] === correctAssoc[0] && userAssoc[1] === correctAssoc[1]
                    );
                });
                
            default:
                return false;
        }
    }

    /**
     * Calcule les pourcentages et détermine les validations
     * @param {Object} results - Résultats à mettre à jour
     */
    calculatePercentagesAndValidation(results) {
        // Score global
        results.percentage = (results.totalScore / results.totalQuestions) * 100;
        results.passed = results.totalScore >= this.qcmData.scoring.seuil_validation;

        // Scores par compétence
        Object.keys(results.competenceScores).forEach(comp => {
            const compData = results.competenceScores[comp];
            if (compData.total > 0) {
                compData.percentage = (compData.score / compData.total) * 100;
                
                // Validation selon les seuils définis
                const competenceConfig = this.qcmData.scoring.scoring_par_competence[comp];
                if (competenceConfig) {
                    compData.validated = compData.score >= competenceConfig.seuil;
                } else {
                    // Seuil par défaut de 60%
                    compData.validated = compData.percentage >= 60;
                }
            }
        });

        // Scores par module
        Object.keys(results.moduleScores).forEach(module => {
            const moduleData = results.moduleScores[module];
            if (moduleData.total > 0) {
                moduleData.percentage = (moduleData.score / moduleData.total) * 100;
            }
        });
    }

    /**
     * Génère un rapport détaillé
     * @param {Object} results - Résultats du scoring
     * @param {Object} candidateInfo - Informations du candidat
     * @returns {Object} Rapport formaté
     */
    generateReport(results, candidateInfo = {}) {
        const report = {
            candidateInfo: {
                name: candidateInfo.name || '[NOM_CANDIDAT]',
                date: candidateInfo.date || new Date().toLocaleDateString('fr-FR'),
                evaluator: candidateInfo.evaluator || '[NOM_EVALUATEUR]'
            },
            globalResults: {
                score: results.totalScore,
                total: results.totalQuestions,
                percentage: results.percentage.toFixed(1),
                passed: results.passed,
                status: results.passed ? 'VALIDÉ' : 'NON_VALIDÉ'
            },
            competenceResults: {},
            moduleResults: {},
            recommendations: this.generateRecommendations(results),
            strengths: this.identifyStrengths(results),
            improvements: this.identifyImprovements(results)
        };

        // Détails par compétence
        Object.entries(results.competenceScores).forEach(([comp, data]) => {
            report.competenceResults[comp] = {
                name: this.competenceMapping[comp],
                score: data.score,
                total: data.total,
                percentage: data.percentage.toFixed(1),
                validated: data.validated,
                status: data.validated ? 'VALIDÉ' : 'NON_VALIDÉ'
            };
        });

        // Détails par module
        Object.entries(results.moduleScores).forEach(([module, data]) => {
            report.moduleResults[module] = {
                score: data.score,
                total: data.total,
                percentage: data.percentage.toFixed(1)
            };
        });

        return report;
    }

    /**
     * Génère des recommandations personnalisées
     * @param {Object} results - Résultats du scoring
     * @returns {Array} Liste de recommandations
     */
    generateRecommendations(results) {
        const recommendations = [];

        // Recommandations basées sur les compétences faibles
        Object.entries(results.competenceScores).forEach(([comp, data]) => {
            if (data.percentage < 60) {
                switch (comp) {
                    case 'C8':
                        recommendations.push('Approfondir les concepts d\'intégration continue et les stratégies de tests d\'intégration');
                        break;
                    case 'C17':
                        recommendations.push('Renforcer les compétences en automatisation des tests avec les outils Selenium, Cypress et frameworks de test');
                        break;
                    case 'C18':
                        recommendations.push('Étudier les tests de performance, JMeter et les métriques de performance');
                        break;
                    case 'C19':
                        recommendations.push('Explorer davantage les outils d\'IA pour les tests (Testim, Applitools, ML pour l\'optimisation)');
                        break;
                    case 'C20':
                        recommendations.push('Améliorer les compétences en documentation et monitoring avec Allure, Grafana, Prometheus');
                        break;
                    case 'C33':
                        recommendations.push('Développer les compétences de collaboration et gestion de projet en contexte CI/CD');
                        break;
                }
            }
        });

        // Recommandations générales
        if (results.percentage < 70) {
            recommendations.push('Réviser les concepts fondamentaux de CI/CD et pratiquer avec des exercices supplémentaires');
        }

        if (results.percentage >= 80) {
            recommendations.push('Excellent niveau ! Considérer des formations avancées en DevOps ou architecture de tests');
        }

        return recommendations;
    }

    /**
     * Identifie les points forts
     * @param {Object} results - Résultats du scoring
     * @returns {Array} Liste des points forts
     */
    identifyStrengths(results) {
        const strengths = [];

        Object.entries(results.competenceScores).forEach(([comp, data]) => {
            if (data.percentage >= 80) {
                strengths.push(`Excellente maîtrise de ${this.competenceMapping[comp]}`);
            } else if (data.percentage >= 70) {
                strengths.push(`Bonne compréhension de ${this.competenceMapping[comp]}`);
            }
        });

        return strengths;
    }

    /**
     * Identifie les axes d'amélioration
     * @param {Object} results - Résultats du scoring
     * @returns {Array} Liste des axes d'amélioration
     */
    identifyImprovements(results) {
        const improvements = [];

        Object.entries(results.competenceScores).forEach(([comp, data]) => {
            if (data.percentage < 60) {
                improvements.push(`${this.competenceMapping[comp]} nécessite un renforcement`);
            }
        });

        // Analyse par difficulté
        const difficultQuestions = results.detailedResults.filter(q => 
            q.difficulty === 'difficile' && !q.isCorrect
        );

        if (difficultQuestions.length > 0) {
            improvements.push('Approfondir les concepts avancés et les cas d\'usage complexes');
        }

        return improvements;
    }

    /**
     * Exporte les résultats au format ECF
     * @param {Object} results - Résultats du scoring
     * @param {Object} candidateInfo - Informations du candidat
     * @returns {string} Rapport au format ECF
     */
    exportToECF(results, candidateInfo = {}) {
        const report = this.generateReport(results, candidateInfo);
        
        // Template ECF (simplifié)
        return `
# RAPPORT D'ÉVALUATION ECF - FORMATION CI/CD

## CANDIDAT
Nom: ${report.candidateInfo.name}
Date: ${report.candidateInfo.date}
Évaluateur: ${report.candidateInfo.evaluator}

## RÉSULTATS GLOBAUX
Score: ${report.globalResults.score}/${report.globalResults.total}
Pourcentage: ${report.globalResults.percentage}%
Statut: ${report.globalResults.status}

## COMPÉTENCES ÉVALUÉES
${Object.entries(report.competenceResults).map(([comp, data]) => `
${comp} - ${data.name}:
  Score: ${data.score}/${data.total} (${data.percentage}%)
  Statut: ${data.status}
`).join('')}

## RECOMMANDATIONS
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## POINTS FORTS
${report.strengths.map(strength => `- ${strength}`).join('\n')}

## AXES D'AMÉLIORATION
${report.improvements.map(improvement => `- ${improvement}`).join('\n')}
        `.trim();
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QCMScoringSystem;
} else if (typeof window !== 'undefined') {
    window.QCMScoringSystem = QCMScoringSystem;
}