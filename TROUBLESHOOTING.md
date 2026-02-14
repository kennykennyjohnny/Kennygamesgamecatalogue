# 🆘 Guide de Débogage KennyGames Party

## ✅ L'app fonctionne en LOCAL

Le serveur de développement est démarré et l'app est accessible sur :
**http://localhost:3000**

---

## 🔍 Diagnostic selon le problème

### Problème 1 : Erreur "table does not exist" ou "relation not found"

**Symptôme** : Erreur lors de création de partie ou login

**Cause** : Le SQL Party n'a pas été copié dans Supabase

**Solution** :

1. Ouvre le fichier : `supabase/migrations/001_multiplayer_games.sql`
2. Copie TOUT le contenu (186 lignes)
3. Va sur : https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk
4. SQL Editor > New Query
5. Paste et clique RUN ⚡

Tu devrais voir : `Success. No rows returned`

---

### Problème 2 : Page blanche / Écran noir

**Symptôme** : Rien ne s'affiche

**Solution** :

1. Ouvre la Console (F12)
2. Regarde les erreurs en rouge
3. Copie/colle l'erreur ici

Erreurs courantes :
- `Cannot read property 'xyz'` → Problème de code, je corrige
- `Failed to fetch` → Problème Supabase (voir Problème 1)
- `Module not found` → Problème d'import, je corrige

---

### Problème 3 : Déploiement Vercel échoué

**Symptôme** : Erreur lors du `vercel --prod`

**Solution** :

Vérifie que Vercel utilise :
- Build Command : `npm run build`
- Output Directory : `build`
- Framework Preset : `Vite`

Si ça échoue :
1. Regarde les logs Vercel
2. Copie l'erreur ici
3. Je corrige

---

### Problème 4 : App déployée mais ne fonctionne pas

**Symptôme** : L'app est en ligne mais erreur à l'utilisation

**Solution** :

1. Vérifie que le SQL Party a été copié (voir Problème 1)
2. Ouvre la Console (F12) sur le site de prod
3. Regarde les erreurs
4. Copie/colle ici

---

### Problème 5 : Login ne fonctionne pas

**Symptôme** : Impossible de se connecter

**Solutions possibles** :

a) **Compte existe déjà ?**
   - Essaie de te connecter avec ton ancien compte
   - Ou crée un nouveau compte avec un autre email

b) **Erreur Supabase ?**
   - Vérifie que `supabase_setup_complete.sql` a été copié
   - C'est l'ancien SQL qui gère l'auth

c) **Erreur réseau ?**
   - Ouvre Console (F12) > Network
   - Regarde les requêtes en erreur (rouge)
   - Copie/colle l'erreur

---

## 🧪 Tests rapides

### Test 1 : App en local

```bash
cd /workspaces/Kennygamesgamecatalogue
npm run dev
# Ouvre http://localhost:3000
```

Ça marche ? ✅ Le problème est dans le déploiement
Ça ne marche pas ? ❌ Le problème est dans le code

### Test 2 : Build

```bash
npm run build
```

Ça compile ? ✅ Le code est OK
Erreur ? ❌ Copie/colle l'erreur ici

### Test 3 : Supabase

1. Va sur : https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk
2. Table Editor
3. Cherche les tables `party_games`, `party_game_players`, `party_game_state`

Elles existent ? ✅ SQL Party copié
Elles n'existent pas ? ❌ Copie le SQL (voir Problème 1)

---

## 📝 Informations à me donner

Pour que je puisse t'aider efficacement, donne-moi :

1. **L'erreur exacte** (copie/colle)
2. **Où** l'erreur se produit (login, création partie, etc.)
3. **Console navigateur** (F12 > capture d'écran ou texte)
4. **As-tu copié le SQL Party ?** (Oui/Non/Je ne sais pas)

---

## 🔧 Commandes utiles

```bash
# Redémarrer le serveur local
npm run dev

# Rebuild
npm run build

# Voir les logs
tail -f /tmp/dev-test.log

# Tester Supabase
# Va dans Console (F12) et tape :
# await fetch('https://zwzfoullsgqrnwfwdtyk.supabase.co/rest/v1/party_games')
```

---

## 🆘 Besoin d'aide immédiate ?

Dis-moi :
- Quel est le message d'erreur exact ?
- À quelle étape ça bloque ?

Je vais te débloquer ! 🚀
