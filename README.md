# Application de gestion des interventions — ERI

Une application web moderne pour la gestion des interventions, construite avec React, Vite, TailwindCSS et Supabase.

## Stack technique

- **Frontend** : React + Vite + TailwindCSS
- **Backend / BDD** : Supabase (auth + base de données PostgreSQL)
- **Déploiement** : Prévu pour Vercel ou équivalent

## Fonctionnalités

### 🔐 Authentification
- Connexion sécurisée avec Supabase Auth
- Email + mot de passe
- Redirection automatique vers le dashboard
- Bouton de déconnexion

### 📊 Dashboard
- Statistiques en temps réel des interventions
- Graphiques de répartition par mois
- Liste des dernières interventions modifiées
- Indicateurs de performance

### 📋 Gestion des interventions
- Tableau complet avec pagination
- Recherche globale multi-champs
- Filtres par statut, mois, compagnon
- Création/modification/suppression d'interventions
- Interface modale élégante

### 📁 Import/Export Excel
- Import de fichiers Excel avec mapping automatique des colonnes
- Export des données filtrées au format Excel
- Aperçu avant importation
- Gestion des erreurs

## Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- Un compte Supabase

### 1. Cloner le projet
```bash
git clone <repository-url>
cd gestion-intervention
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer Supabase
1. Créez un nouveau projet sur [supabase.com](https://supabase.com)
2. Allez dans Settings > API et copiez:
   - Project URL
   - anon public key
3. Créez un fichier `.env` à la racine du projet:
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### 4. Configurer la base de données
1. Allez dans le dashboard Supabase > SQL Editor
2. Exécutez le contenu du fichier `database-schema.sql`
3. Cela créera la table `interventions` avec tous les champs nécessaires

### 5. Démarrer l'application
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## Structure du projet

```
src/
├── components/
│   ├── Navbar.jsx              # Barre de navigation
│   ├── InterventionModal.jsx   # Modal de création/modification
│   └── ImportModal.jsx         # Modal d'import Excel
├── contexts/
│   └── AuthContext.jsx         # Contexte d'authentification
├── lib/
│   └── supabase.js            # Client Supabase
├── pages/
│   ├── Login.jsx               # Page de connexion
│   ├── Dashboard.jsx           # Dashboard avec statistiques
│   └── Interventions.jsx       # Liste des interventions
├── App.jsx                     # Composant principal avec routing
└── index.css                   # Styles globaux
```

## Base de données

### Table `interventions`

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Clé primaire |
| actif | Boolean | Statut actif (défaut: true) |
| mois_facture | Integer | Mois de facturation (1-12) |
| statut | Enum | 'a_faire', 'planifie', 'fait' |
| date_statut | Date | Date du statut |
| planifie_le | Date | Date de planification |
| equiv | Float | Valeur EQUIV |
| nom_client | Text | Nom du client (obligatoire) |
| adresse_intervention | Text | Adresse d'intervention |
| ville | Text | Ville |
| code_postal | Text | Code postal |
| mail_client | Text | Email du client |
| commentaire_commande | Text | Commentaire |
| adresse_facturation | Text | Adresse de facturation |
| mail_facturation | Text | Email de facturation |
| chiffrage | Text | Détails du chiffrage |
| total_ht | Float | Total HT |
| reste_a_payer | Float | Reste à payer |
| compagnon | Text | Nom du compagnon/technicien |
| affaire | Text | Référence de l'affaire |
| created_at | Timestamp | Date de création |
| updated_at | Timestamp | Date de modification |

## Utilisation

### 1. Connexion
- Utilisez un email et mot de passe valides
- L'application vous redirigera automatiquement vers le dashboard

### 2. Dashboard
- Consultez les statistiques en temps réel
- Visualisez les graphiques de répartition
- Accédez rapidement aux dernières interventions

### 3. Gestion des interventions
- **Créer**: Cliquez sur "Créer une intervention"
- **Modifier**: Cliquez sur l'icône crayon dans le tableau
- **Supprimer**: Cliquez sur l'icône corbeille avec confirmation
- **Rechercher**: Utilisez la barre de recherche globale
- **Filtrer**: Utilisez les filtres par statut, mois, compagnon

### 4. Import Excel
- Cliquez sur "Importer Excel"
- Uploadez un fichier .xlsx ou .xls
- Mappez les colonnes si nécessaire
- Confirmez l'importation

### 5. Export Excel
- Appliquez vos filtres si nécessaire
- Cliquez sur "Exporter Excel"
- Le fichier sera téléchargé automatiquement

## Déploiement

### Vercel (recommandé)
1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Déployez automatiquement à chaque push

### Autres plateformes
L'application peut être déployée sur n'importe quelle plateforme supportant les applications React statiques (Netlify, Heroku, etc.).

## Contribuer

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Commitez vos changements
4. Push vers votre branche
5. Créez une Pull Request

## Support

Pour toute question ou problème, veuillez contacter l'équipe de développement.

## License

Ce projet est sous license MIT.
