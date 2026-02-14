# 🚀 DÉPLOIEMENT RAPIDE - Migration SQL Amis & Défis

## ⚠️ SÉCURITÉ CRITIQUE
**NE PARTAGE JAMAIS** ta clé secrète Supabase publiquement !

---

## 📋 ÉTAPES SIMPLES (5 minutes)

### 1️⃣ Ouvrir le fichier SQL

Dans VSCode, ouvre : **`supabase/migrations/002_friends_and_challenges.sql`**

### 2️⃣ Tout copier

- **Ctrl+A** (tout sélectionner)
- **Ctrl+C** (copier)

### 3️⃣ Aller sur Supabase Dashboard

1. Va sur **https://supabase.com/dashboard**
2. Clique sur ton projet **KennyGames**
3. Menu gauche : **SQL Editor** (icône </>)
4. Clique **"New query"** en haut à droite

### 4️⃣ Coller et exécuter

1. **Ctrl+V** dans l'éditeur
2. Clique le bouton **"Run"** (ou **F5**)
3. Attends quelques secondes...

**✅ Succès si tu vois :** "Success. No rows returned"

### 5️⃣ Vérifier

Dans le menu gauche, clique **"Table Editor"**.

Tu dois voir ces **4 nouvelles tables** :
```
✅ friendships       (Système d'amis)
✅ challenges        (Défis entre joueurs)  
✅ notifications     (Notifications)
✅ user_profiles     (Profils utilisateurs)
```

---

## 🎮 TESTER LOCALEMENT

Une fois la migration faite :

```bash
# Dans le terminal
npm run dev
```

Puis va sur **http://localhost:3000**

---

## ❌ PROBLÈMES COURANTS

**"relation already exists"**
→ Normal si tu as déjà exécuté, les tables existent déjà

**"permission denied"**  
→ Assure-toi d'être connecté au bon projet Supabase

**"syntax error"**
→ Le SQL n'a peut-être pas été copié en entier, recommence

---

## ✅ ÉTAPE SUIVANTE

Une fois que c'est fait, **dis-moi "c'est bon"** et je modifie le code frontend pour utiliser le nouveau système ! 🚀
