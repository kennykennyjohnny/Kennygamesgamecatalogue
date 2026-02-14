# 🚀 KennyGames Party - Quick Start

## ⚡ Démarrage rapide (5 minutes)

### 1️⃣ Déployer la base de données (2 min)

```bash
# Ouvre ce lien dans ton navigateur:
https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk/editor

# Dans SQL Editor > New Query, copie/colle le contenu de:
supabase/migrations/001_multiplayer_games.sql

# Clique "Run" (⚡)
```

### 2️⃣ Démarrer l'app (1 min)

```bash
cd /workspaces/Kennygamesgamecatalogue
npm run dev

# Ouvre http://localhost:3000
```

### 3️⃣ Tester (2 min)

**Joueur 1** :
1. Connecte-toi
2. Clique "Créer une partie"
3. Choisis "🍷 SANDYGAMES"
4. Copie le code (ABC123)

**Joueur 2** (autre onglet) :
1. Connecte-toi (autre compte)
2. Clique "Rejoindre"
3. Entre le code ABC123

**Dans le lobby** :
- Les 2 cliquent "Prêt"
- Le créateur démarre
- Swipe vers le haut pour lancer ! 🎯

---

## 🎮 Comment jouer à SandyGames (Beer Pong)

### Règles
- 2 joueurs
- 10 verres en pyramide chacun
- 2 lancers par tour
- Premier à éliminer tous les verres adverse gagne

### Contrôles
1. **Swipe vers le haut** sur l'écran pour lancer le bouchon
2. Plus le swipe est rapide, plus le lancer est puissant (MVP : random 30%)
3. Attend ton tour entre les lancers

---

## 📚 Documentation complète

Voir `IMPLEMENTATION_SUMMARY.md` pour tous les détails.

---

## 🆘 Problèmes ?

**"Table doesn't exist"** → Exécute la migration SQL
**Lobby ne se met pas à jour** → Vérifie la console (F12)
**Swipe ne marche pas** → Teste en mode mobile (DevTools)

---

Enjoy ! ��
