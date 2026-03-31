# Guide de configuration rapide - Gestion des Interventions ERI

## 🚀 Démarrage rapide

### 1. Installation des dépendances
```bash
cd gestion-intervention
npm install
```

### 2. Configuration de Supabase
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Dans Settings > API, récupérez:
   - Project URL
   - anon public key
4. Créez un fichier `.env`:
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### 3. Configuration de la base de données
1. Allez dans le dashboard Supabase
2. Ouvrez SQL Editor
3. Copiez-collez le contenu de `database-schema.sql`
4. Exécutez le script

### 4. Démarrage de l'application
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## 📋 Configuration de l'authentification

### Créer un utilisateur de test
1. Dans Supabase, allez dans Authentication > Users
2. Cliquez sur "Add user"
3. Créez un utilisateur avec email et mot de passe

### Configuration des politiques RLS
Le script SQL inclut déjà des politiques de base. Vous pouvez les modifier selon vos besoins.

## 🎯 Fonctionnalités implémentées

### ✅ Authentification
- Login avec email/mot de passe
- Session persistante
- Redirection automatique
- Bouton de déconnexion

### ✅ Dashboard
- Statistiques en temps réel
- Graphiques avec Recharts
- Dernières interventions
- Indicateurs de performance

### ✅ Gestion des interventions
- CRUD complet
- Tableau avec pagination (50 lignes/page)
- Recherche globale
- Filtres multiples (statut, mois, compagnon)
- Modal de création/modification

### ✅ Import/Export Excel
- Import avec mapping automatique
- Export des données filtrées
- Gestion des erreurs
- Format .xlsx

### ✅ Design responsive
- Interface moderne avec TailwindCSS
- Compatible tablette/mobile
- Composants réutilisables
- Notifications toast

## 🔧 Personnalisation

### Couleurs et thèmes
Les couleurs principales sont définies dans `tailwind.config.js`:
- Primary: bleu marine (#1e40af)
- Design sobre et professionnel

### Base de données
La structure peut être étendue dans `database-schema.sql`:
- Ajout de nouvelles colonnes
- Modification des contraintes
- Index pour optimisation

## 🚀 Déploiement

### Vercel (recommandé)
1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Déployez automatiquement

### Autres options
- Netlify
- Heroku
- AWS Amplify
- Tout hébergeur statique

## 🐛 Dépannage

### Problèmes courants
1. **Erreur de build**: Vérifiez les variables d'environnement
2. **Connexion Supabase**: Validez l'URL et la clé API
3. **TailwindCSS**: Assurez-vous que `@tailwindcss/postcss` est installé

### Logs et debugging
- Console du navigateur pour les erreurs frontend
- Dashboard Supabase pour les logs backend
- Network tab pour vérifier les appels API

## 📞 Support

Pour toute question:
1. Vérifiez ce guide
2. Consultez la documentation Supabase
3. Contactez l'équipe de développement

---

**L'application est prête à être utilisée !** 🎉
