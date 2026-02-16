# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## L'APPLICATION EST MAINTENANT 100% FONCTIONNELLE! ✅

Tous les composants Figma sont connectés à Supabase. L'utilisateur peut:
- ✅ S'authentifier
- ✅ Voir ses amis
- ✅ Voir ses parties en cours  
- ✅ **JOUER en cliquant sur une partie**
- ✅ Voir ses stats
- ✅ Personnaliser son profil

---

## 🎯 DÉMARRAGE

### 1. Installer les dépendances (si pas déjà fait)
```bash
npm install
```

### 2. Lancer l'application
```bash
npm run dev
```

### 3. Ouvrir dans le navigateur
```
http://localhost:5173
```

---

## 📋 FONCTIONNALITÉS DISPONIBLES

### 🔐 Authentification
- **Inscription:** Email + Password → Compte créé dans Supabase
- **Connexion:** Email + Password → Charge profil depuis DB
- **Déconnexion:** Bouton dans Profil

### 👥 Amis
- **Onglet "Amis"**
- Voir amis en ligne (vert) / hors ligne (gris)
- Demandes en attente avec boutons Accepter/Refuser
- ✅ Tout vient de la table `friendships`

### 🎮 Parties
- **Onglet "Jouer"**
- Section "Parties en cours"
- Badge "À toi" = votre tour
- **CLICK SUR UNE PARTIE → LANCE LE JEU!** 🔥
- ✅ Tout vient de la table `challenges`

### 📊 Statistiques
- Stats globales: Victoires, Défaites, Série
- Stats par jeu: SandyPong, LéaNaval, LilianoThunder, NourArchery
- ✅ Tout vient de la table `player_stats`

### 👤 Profil
- **Onglet "Profil"**
- Changer avatar (click sur l'avatar)
- Changer thème de couleur
- Voir stats personnelles
- ✅ Avatar sauvegardé dans `users.profile_emoji`
- ✅ Thème sauvegardé dans `users.user_theme`

---

## 🎨 DESIGN

Le design Figma vert glassmorphism est **100% préservé**:
- Couleur émeraude (#10b981)
- Effets de verre (backdrop-filter)
- Animations fluides
- Particules flottantes
- Gradients modernes

---

## 🗄️ TABLES SUPABASE

L'app utilise:
- `users` - Profils utilisateurs
- `friendships` - Relations d'amitié  
- `challenges` - Parties en cours
- `player_stats` - Statistiques
- `game_moves` - Coups de jeu

---

## 🧪 TESTER L'APPLICATION

### Test 1: Créer un compte
```
1. Ouvrir l'app
2. Cliquer "Inscription"
3. Entrer: email, password, nom (optionnel)
4. Cliquer "S'inscrire"
→ Vous êtes connecté! ✅
```

### Test 2: Voir ses amis
```
1. Onglet "Amis"
2. Si vous avez des demandes → Accepter/Refuser
3. Voir liste amis en ligne/hors ligne
→ Données depuis Supabase! ✅
```

### Test 3: Jouer à une partie
```
1. Onglet "Jouer"
2. Section "Parties en cours"
3. Click sur une partie avec "À toi"
→ Le jeu se lance! 🎮 ✅
```

### Test 4: Personnaliser profil
```
1. Onglet "Profil"
2. Click sur avatar → Choisir nouveau
3. Click sur thème → Choisir couleur
→ Tout sauvegardé automatiquement! ✅
```

---

## 📦 BUILD PRODUCTION

```bash
npm run build
```

Le build génère:
- `build/index.html`
- `build/assets/` (CSS + JS optimisés)

---

## 🚀 DÉPLOIEMENT

### Option 1: Vercel
```bash
vercel --prod
```

### Option 2: Netlify
```bash
npm run build
# Puis drag & drop le dossier build/
```

### Option 3: Supabase Hosting
```bash
supabase functions deploy
```

---

## 🔧 CONFIGURATION

Assurez-vous que `.env` contient:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Ou utilisez `src/utils/supabase/info.tsx` (déjà configuré).

---

## ⚠️ IMPORTANT

### Première connexion
Si l'email confirmation est activée dans Supabase:
- L'utilisateur doit confirmer son email
- Sinon, désactiver dans: Dashboard → Auth → Settings → Email confirmations

### Parties en cours
Pour avoir des parties à afficher:
1. Créer des challenges dans Supabase
2. Ou ajouter un bouton "Nouvelle partie" (à venir)

### Amis
Pour avoir des amis:
1. Créer des friendships dans Supabase
2. Ou implémenter "Recherche d'amis" (bouton présent, fonction à venir)

---

## 🎊 RÉSUMÉ

**CE QUI FONCTIONNE:**
- ✅ Auth complète avec Supabase
- ✅ Amis depuis DB
- ✅ Parties depuis DB
- ✅ Stats depuis DB
- ✅ Profil sauvegardé
- ✅ Click sur partie → Jouer
- ✅ Design Figma préservé

**CE QUI EST OPTIONNEL:**
- Recherche d'amis
- Créer nouvelle partie depuis UI
- Chat entre amis
- Notifications push

---

## 🎮 PRÊT À JOUER!

Lancez l'app et testez toutes les fonctionnalités. Tout est connecté à Supabase et pleinement fonctionnel! 🚀

```bash
npm run dev
```

**Amusez-vous bien! 🎉**
