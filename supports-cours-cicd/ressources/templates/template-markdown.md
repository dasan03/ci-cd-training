# Template Markdown - Formation CI/CD

## Structure Standard pour les Documents Sources

Ce template définit la structure standard pour tous les documents Markdown de la formation CI/CD.

---

## En-tête du Document

```markdown
# {{TITRE_MODULE}} - {{SOUS_TITRE}}

**Module:** {{NUMERO_MODULE}}  
**Durée:** {{DUREE}}  
**Niveau:** {{NIVEAU}}  
**Dernière mise à jour:** {{DATE}}

---

## 🎯 Objectifs d'Apprentissage

À la fin de cette section, vous serez capable de :

- {{OBJECTIF_1}}
- {{OBJECTIF_2}}
- {{OBJECTIF_3}}

## 📋 Prérequis

- {{PREREQUIS_1}}
- {{PREREQUIS_2}}
- {{PREREQUIS_3}}

---
```

## Structure du Contenu Théorique

```markdown
## 📚 Contenu Théorique

### {{SOUS_SECTION_1}}

{{INTRODUCTION_CONCEPT}}

#### Définition

> **{{TERME_CLE}}** : {{DEFINITION_CLAIRE}}

#### Concepts Clés

- **{{CONCEPT_1}}** : {{EXPLICATION_COURTE}}
- **{{CONCEPT_2}}** : {{EXPLICATION_COURTE}}
- **{{CONCEPT_3}}** : {{EXPLICATION_COURTE}}

#### Exemple Pratique

```{{LANGAGE}}
{{CODE_EXEMPLE}}
```

**Explication du code :**
{{EXPLICATION_DETAILLEE}}

#### 💡 Points Importants

> ⚠️ **Attention :** {{POINT_ATTENTION}}

> ✅ **Bonne Pratique :** {{BONNE_PRATIQUE}}

> 📊 **Métrique :** {{METRIQUE_IMPORTANTE}}
```

## Structure des Exercices

```markdown
## 🔧 Exercice {{NUMERO}} - {{TITRE_EXERCICE}}

### Objectif
{{DESCRIPTION_OBJECTIF}}

### Durée Estimée
⏱️ {{DUREE_MINUTES}} minutes

### Prérequis Techniques
- [ ] {{PREREQUIS_TECHNIQUE_1}}
- [ ] {{PREREQUIS_TECHNIQUE_2}}
- [ ] {{PREREQUIS_TECHNIQUE_3}}

### Matériel Nécessaire
- {{OUTIL_1}} (version {{VERSION}})
- {{OUTIL_2}} (version {{VERSION}})
- {{FICHIER_RESSOURCE}}

### Instructions

#### Étape 1 : {{TITRE_ETAPE_1}}
{{INSTRUCTION_DETAILLEE_1}}

```{{LANGAGE}}
{{CODE_ETAPE_1}}
```

#### Étape 2 : {{TITRE_ETAPE_2}}
{{INSTRUCTION_DETAILLEE_2}}

```{{LANGAGE}}
{{CODE_ETAPE_2}}
```

#### Étape 3 : {{TITRE_ETAPE_3}}
{{INSTRUCTION_DETAILLEE_3}}

### Résultat Attendu
{{DESCRIPTION_RESULTAT}}

### Vérification
Pour vérifier que l'exercice est réussi :
1. {{VERIFICATION_1}}
2. {{VERIFICATION_2}}
3. {{VERIFICATION_3}}

### 🔍 Solution
<details>
<summary>Cliquer pour voir la solution</summary>

{{SOLUTION_COMPLETE}}

**Explications :**
{{EXPLICATIONS_SOLUTION}}

</details>

### 🚨 Dépannage
| Problème | Solution |
|----------|----------|
| {{PROBLEME_1}} | {{SOLUTION_1}} |
| {{PROBLEME_2}} | {{SOLUTION_2}} |
| {{PROBLEME_3}} | {{SOLUTION_3}} |
```

## Structure des QCM

```markdown
## 📋 QCM - {{TITRE_SECTION}}

### Question {{NUMERO}}
{{TEXTE_QUESTION}}

**Compétence évaluée :** {{CODE_COMPETENCE}}

a) {{OPTION_A}}
b) {{OPTION_B}}
c) {{OPTION_C}}
d) {{OPTION_D}}

<details>
<summary>Voir la réponse</summary>

**Réponse correcte :** {{LETTRE_REPONSE}}

**Explication :** {{EXPLICATION_DETAILLEE}}

**Points clés à retenir :**
- {{POINT_CLE_1}}
- {{POINT_CLE_2}}

</details>

---
```

## Éléments Visuels Standards

### Icônes et Émojis à Utiliser

```markdown
🎯 Objectifs
📚 Théorie
🔧 Exercices pratiques
📋 Évaluations
💡 Points importants
⚠️ Attention/Avertissement
✅ Bonnes pratiques
❌ À éviter
📊 Métriques/Statistiques
🔍 Détails/Solution
🚨 Dépannage
⏱️ Durée
📁 Fichiers/Ressources
🌐 Liens externes
💻 Code/Terminal
🔗 Références
📖 Documentation
🎓 Compétences
```

### Blocs d'Information

```markdown
> 💡 **Astuce :** {{ASTUCE_UTILE}}

> ⚠️ **Attention :** {{POINT_ATTENTION}}

> ✅ **Bonne Pratique :** {{RECOMMANDATION}}

> 📊 **Statistique :** {{DONNEE_CHIFFREE}}

> 🔗 **Référence :** [{{TITRE_LIEN}}]({{URL}})
```

### Tableaux de Comparaison

```markdown
| Critère | Option A | Option B | Option C |
|---------|----------|----------|----------|
| {{CRITERE_1}} | {{VALEUR_A1}} | {{VALEUR_B1}} | {{VALEUR_C1}} |
| {{CRITERE_2}} | {{VALEUR_A2}} | {{VALEUR_B2}} | {{VALEUR_C2}} |
| {{CRITERE_3}} | {{VALEUR_A3}} | {{VALEUR_B3}} | {{VALEUR_C3}} |
```

## Pied de Page Standard

```markdown
---

## 📖 Ressources Complémentaires

### Documentation Officielle
- [{{TITRE_DOC_1}}]({{URL_1}})
- [{{TITRE_DOC_2}}]({{URL_2}})

### Articles et Tutoriels
- [{{TITRE_ARTICLE_1}}]({{URL_ARTICLE_1}})
- [{{TITRE_ARTICLE_2}}]({{URL_ARTICLE_2}})

### Outils Mentionnés
- [{{NOM_OUTIL_1}}]({{URL_OUTIL_1}}) - {{DESCRIPTION_COURTE}}
- [{{NOM_OUTIL_2}}]({{URL_OUTIL_2}}) - {{DESCRIPTION_COURTE}}

---

## 🔄 Prochaines Étapes

1. {{ETAPE_SUIVANTE_1}}
2. {{ETAPE_SUIVANTE_2}}
3. {{ETAPE_SUIVANTE_3}}

---

**Navigation :**
← [{{SECTION_PRECEDENTE}}]({{LIEN_PRECEDENT}}) | [Sommaire]({{LIEN_SOMMAIRE}}) | [{{SECTION_SUIVANTE}}]({{LIEN_SUIVANT}}) →

---

*Formation CI/CD - {{ANNEE}} - Version {{VERSION_DOCUMENT}}*
```

## Instructions d'Utilisation

### 1. Création d'un Nouveau Document

1. Copier ce template
2. Remplacer tous les placeholders `{{VARIABLE}}` par les valeurs appropriées
3. Adapter la structure selon le type de contenu
4. Respecter la hiérarchie des titres (H1 → H2 → H3 → H4)

### 2. Conventions de Nommage

- **Fichiers :** `numero-titre-kebab-case.md`
- **Images :** `module-X-concept-description.png`
- **Liens internes :** `#ancre-en-minuscules`

### 3. Validation du Contenu

Avant publication, vérifier :
- [ ] Tous les placeholders sont remplacés
- [ ] Les liens fonctionnent
- [ ] Les blocs de code sont testés
- [ ] L'orthographe et la grammaire
- [ ] La cohérence avec les autres modules

### 4. Métadonnées YAML (Optionnel)

```yaml
---
title: "{{TITRE_COMPLET}}"
module: "{{NUMERO_MODULE}}"
duration: "{{DUREE_MINUTES}}"
level: "{{NIVEAU}}"
competencies: ["{{COMP_1}}", "{{COMP_2}}"]
tools: ["{{OUTIL_1}}", "{{OUTIL_2}}"]
updated: "{{DATE_ISO}}"
version: "{{VERSION}}"
---
```

## Exemples d'Application

### Document de Support Théorique
Utiliser la structure complète avec toutes les sections théoriques.

### Guide d'Exercice
Se concentrer sur la section exercice avec instructions détaillées.

### QCM Intermédiaire
Utiliser uniquement la structure QCM avec plusieurs questions.

### Document de Synthèse
Combiner points clés, ressources et prochaines étapes.