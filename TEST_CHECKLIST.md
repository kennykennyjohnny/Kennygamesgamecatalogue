# ✅ CHECKLIST DE TEST

## Tests à effectuer pour vérifier que tout fonctionne

### 🔐 Test 1: Authentification

**Inscription:**
- [ ] Ouvrir http://localhost:5173
- [ ] Cliquer sur onglet "Inscription"
- [ ] Entrer un email (ex: test@example.com)
- [ ] Entrer un mot de passe (min 6 caractères)
- [ ] Entrer un nom (optionnel)
- [ ] Cliquer "S'inscrire"
- [ ] ✅ Vérifier: Vous êtes redirigé vers l'app (onglet Jouer)
- [ ] ✅ Vérifier dans Supabase: Table `users` a une nouvelle ligne

**Connexion:**
- [ ] Se déconnecter (onglet Profil → bouton rouge)
- [ ] Entrer email et password
- [ ] Cliquer "Se connecter"
- [ ] ✅ Vérifier: Vous êtes connecté

---

### 👥 Test 2: Amis

**Voir la liste:**
- [ ] Aller dans onglet "Amis"
- [ ] ✅ Vérifier: Liste vide ou amis depuis DB

**Créer une demande d'ami (via Supabase):**
```sql
-- Dans Supabase SQL Editor
INSERT INTO friendships (user_id, friend_id, status)
VALUES ('autre-user-id', 'votre-user-id', 'pending');
```
- [ ] Rafraîchir l'app
- [ ] Aller dans onglet "Demandes"
- [ ] ✅ Vérifier: Demande visible

**Accepter demande:**
- [ ] Cliquer "Accepter"
- [ ] ✅ Vérifier: Demande disparaît
- [ ] Aller dans onglet "Tous"
- [ ] ✅ Vérifier: Ami apparaît dans la liste

---

### 🎮 Test 3: Parties en cours

**Créer une partie (via Supabase):**
```sql
-- Dans Supabase SQL Editor
INSERT INTO challenges (
  id,
  game_type,
  challenger_id,
  opponent_id,
  current_turn,
  status,
  challenger_score,
  opponent_score
) VALUES (
  gen_random_uuid(),
  'sandy',
  'votre-user-id',
  'autre-user-id',
  'votre-user-id',
  'active',
  0,
  0
);
```
- [ ] Rafraîchir l'app
- [ ] Aller dans onglet "Jouer"
- [ ] ✅ Vérifier: Partie visible dans "Parties en cours"
- [ ] ✅ Vérifier: Badge "À toi" affiché
- [ ] Cliquer sur la partie
- [ ] ✅ Vérifier: GameRoom se charge

---

### 📊 Test 4: Statistiques

**Créer des stats (via Supabase):**
```sql
-- Dans Supabase SQL Editor
INSERT INTO player_stats (
  user_id,
  total_wins,
  total_losses,
  current_streak,
  best_streak,
  sandy_wins,
  sandy_losses
) VALUES (
  'votre-user-id',
  42,
  13,
  5,
  12,
  15,
  3
);
```
- [ ] Rafraîchir l'app
- [ ] Aller dans onglet "Jouer"
- [ ] ✅ Vérifier: Stats globales affichent 42 victoires, 13 défaites
- [ ] ✅ Vérifier: Stats SandyPong affichent 15V - 3D

---

### 👤 Test 5: Profil

**Avatar:**
- [ ] Aller dans onglet "Profil"
- [ ] Cliquer sur l'avatar
- [ ] Choisir un autre emoji dans la grille
- [ ] ✅ Vérifier: Avatar change immédiatement
- [ ] Rafraîchir la page
- [ ] ✅ Vérifier: Avatar toujours changé (sauvegardé)
- [ ] ✅ Vérifier dans Supabase: `users.profile_emoji` mis à jour

**Thème:**
- [ ] Cliquer sur onglet "Paramètres"
- [ ] Choisir un thème (Bleu, Violet, ou Rose)
- [ ] ✅ Vérifier: Couleurs changent partout
- [ ] Rafraîchir la page
- [ ] ✅ Vérifier: Thème conservé
- [ ] ✅ Vérifier dans Supabase: `users.user_theme` mis à jour

**Déconnexion:**
- [ ] Cliquer bouton "Se déconnecter"
- [ ] ✅ Vérifier: Retour à l'écran de connexion

---

### 🎯 Test 6: Navigation GameRoom

**Lancer une partie:**
- [ ] Créer une partie via SQL (voir Test 3)
- [ ] Onglet "Jouer" → Click sur partie "À toi"
- [ ] ✅ Vérifier: GameRoom se charge
- [ ] ✅ Vérifier: Bon type de jeu affiché
- [ ] Cliquer bouton "Quitter"
- [ ] ✅ Vérifier: Retour à l'écran d'accueil

---

## 🔍 Tests Visuels

### Design préservé:
- [ ] ✅ Couleur verte émeraude (#10b981) partout
- [ ] ✅ Effets glassmorphism (fond transparent avec blur)
- [ ] ✅ Animations fluides (motion)
- [ ] ✅ Particules flottantes sur écran login
- [ ] ✅ Gradients modernes
- [ ] ✅ Fonts correctes (Outfit, Inter, Poppins)

---

## 🐛 Tests d'erreur

**Mauvais login:**
- [ ] Essayer de se connecter avec mauvais password
- [ ] ✅ Vérifier: Message d'erreur affiché en rouge

**Réseau:**
- [ ] Couper internet
- [ ] Essayer de charger données
- [ ] ✅ Vérifier: Comportement gracieux (loading ou erreur)

---

## 📱 Tests Responsiveness

- [ ] Tester sur mobile (DevTools → Toggle device)
- [ ] ✅ Vérifier: Design adaptatif
- [ ] ✅ Vérifier: Boutons accessibles
- [ ] ✅ Vérifier: Navigation bottom fonctionne

---

## ✅ RÉSULTAT ATTENDU

Tous les tests doivent passer ✅

Si un test échoue:
1. Vérifier la console navigateur (F12)
2. Vérifier les logs Supabase
3. Vérifier que les tables existent
4. Vérifier les IDs utilisés dans SQL

---

## 🚀 BUILD FINAL

Avant de déployer:
```bash
npm run build
```

- [ ] ✅ Build réussit sans erreur
- [ ] ✅ Fichiers générés dans `build/`
- [ ] ✅ Taille du bundle raisonnable (< 500KB)

---

**TOUS LES TESTS PASSENT = APP PRÊTE! 🎉**
