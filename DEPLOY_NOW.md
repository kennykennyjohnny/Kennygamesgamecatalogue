# 🚀 Déploiement KennyGames Party - Guide Final

## ✅ Build de production créé !

```
✓ built in 3.03s
build/index.html                   0.65 kB
build/assets/index-CVQ3-7nR.css   35.53 kB  (6.71 kB gzip)
build/assets/index-mFzHGwN9.js   380.25 kB  (110.36 kB gzip)
```

---

## 🎯 OPTION 1 : Déploiement Vercel (Recommandé)

### Étape 1 : Connexion Vercel

Dans TON terminal local (pas GitHub Codespaces), exécute :

```bash
cd /chemin/vers/Kennygamesgamecatalogue
vercel login
```

Tu seras redirigé vers le navigateur pour te connecter.

### Étape 2 : Premier déploiement

```bash
vercel
```

Réponds aux questions :
- Set up and deploy? **Y**
- Which scope? Choisis ton compte
- Link to existing project? **N**
- What's your project's name? **kennygames-party**
- In which directory is your code located? **.**
- Want to override the settings? **N**

### Étape 3 : Déploiement production

```bash
vercel --prod
```

Ton site sera en ligne à : `https://kennygames-party.vercel.app`

---

## 🎯 OPTION 2 : Déploiement via GitHub (Automatique)

### Si tu as déjà poussé sur GitHub :

1. Va sur [vercel.com](https://vercel.com)
2. Clique "Import Project"
3. Sélectionne ton repo GitHub
4. Framework Preset : **Vite**
5. Build Command : `npm run build`
6. Output Directory : `build`
7. Deploy !

Chaque push sur `main` déploiera automatiquement.

---

## 🎯 OPTION 3 : Upload manuel

Le dossier `build/` contient tout le nécessaire.

Tu peux l'uploader sur :
- Netlify (drag & drop)
- Firebase Hosting
- AWS S3 + CloudFront
- N'importe quel hébergeur statique

---

## ⚠️ ATTENTION : SQL PARTY !

**AVANT de tester l'app en production**, assure-toi d'avoir copié le SQL Party dans Supabase :

```sql
-- Fichier : supabase/migrations/001_multiplayer_games.sql
-- Voir les 186 lignes plus haut dans ce terminal
```

Dashboard : https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk

---

## ✅ Checklist post-déploiement

- [ ] SQL Party copié dans Supabase ✅ CRITIQUE
- [ ] Site déployé et accessible
- [ ] Test : Créer un compte
- [ ] Test : Créer une partie
- [ ] Test (2e device) : Rejoindre via code
- [ ] Test : Lobby avec 2 joueurs
- [ ] Test : Jouer à SandyGames
- [ ] Partager avec tes amis ! 🎉

---

## 🐛 Troubleshooting

**Erreur "Table doesn't exist"**
→ Tu n'as pas copié le SQL Party

**Erreur Vercel lors du build**
→ Le build local a fonctionné, donc c'est un problème de config Vercel
→ Vérifie : Build Command = `npm run build`, Output = `build`

**Realtime ne fonctionne pas**
→ Vérifie Supabase Dashboard > Settings > API > Realtime activé

**Canvas ne s'affiche pas**
→ Teste sur mobile ou Chrome DevTools en mode mobile

---

## 📊 URLs importantes

- **Production** : À venir après déploiement
- **Supabase** : https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk
- **GitHub** : (ton repo)

---

## 🎮 Prêt à jouer !

Une fois déployé et le SQL copié, tu peux :

1. Créer une partie de SandyGames
2. Partager le code avec un ami
3. Jouer au Beer Pong tour par tour !

**Bon déploiement ! 🚀🐐**
