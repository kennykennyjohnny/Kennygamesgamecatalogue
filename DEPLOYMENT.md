# 🚀 Déploiement KennyGames Party

## ✅ Build réussi !

Le code a été compilé avec succès :
```
✓ built in 3.20s
build/index.html                   0.65 kB
build/assets/index-CVQ3-7nR.css   35.53 kB
build/assets/index-mFzHGwN9.js   380.25 kB
```

## 📋 Checklist de déploiement

### 1. Base de données Supabase ✅ (À faire)

**CRITIQUE : Copie le SQL ci-dessus dans Supabase !**

1. Va sur : https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk
2. SQL Editor > New Query
3. Copie/colle tout le contenu affiché ci-dessus
4. Run ⚡

Tu verras : `Success. No rows returned`

### 2. Code déployé

#### Option A : Vercel (Recommandé)

```bash
# Si pas encore installé
npm install -g vercel

# Déployer
vercel --prod

# Suivre les instructions
```

#### Option B : Build manuel

```bash
npm run build

# Les fichiers sont dans /build
# Upload vers ton hébergeur
```

### 3. Variables d'environnement

Aucune variable nécessaire ! Tout est dans le code (info.tsx).

### 4. Test post-déploiement

1. **Joueur 1** : Créer une partie
2. **Joueur 2** (autre device) : Rejoindre avec le code
3. Lobby : Les 2 cliquent "Prêt"
4. Jouer ! 🎮

## 🐛 Troubleshooting

**"Table doesn't exist"**
→ Tu as oublié la migration SQL Party

**Build error**
→ `npm run build` montre l'erreur

**Realtime ne marche pas**
→ Vérifie Supabase Realtime dans Dashboard > Settings > API

## 📊 Structure déployée

```
Production URL: [ton-url-vercel.app]
├── / → PartyHome (Créer/Rejoindre)
├── /g/:code → Direct join (future)
└── Auth → Email/Password
```

## ✅ Post-déploiement

- [ ] Tester création de partie
- [ ] Tester rejoindre via code
- [ ] Tester lobby realtime
- [ ] Tester jeu complet
- [ ] Tester sur mobile
- [ ] Partager le lien ! 🎉

---

**Bon déploiement ! 🚀**
