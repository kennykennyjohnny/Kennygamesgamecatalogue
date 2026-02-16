# 🔍 AUDIT COMPLET - Ce qui MANQUE du design Figma

**Date:** 16 Février 2026, 23:35

## ❌ FONCTIONNALITÉS NON IMPLÉMENTÉES

### 1. **Notifications en temps réel**
- ❌ Pas de système de notifications
- ❌ Pas de Supabase Realtime pour les demandes d'amis
- ❌ Pas de badge de notification sur les onglets
- 💡 **À faire:** Implémenter Supabase Realtime subscriptions

### 2. **ProfilePanel incomplet**
- ❌ Toggle notifications pas fonctionnel
- ❌ Avatar DiceBear pas sauvegardé correctement
- ❌ Pas de tabs Profile/Settings (Figma en a)
- ❌ Pas de section "Paramètres" complète
- 💡 **À faire:** Copier EXACT ProfilePanel.tsx du Figma

### 3. **FriendsPanel incomplet**
- ❌ Recherche d'utilisateurs pas implémentée
- ❌ Bouton "Ajouter ami" ne fait rien
- ❌ Pas de debounce sur la recherche
- ❌ Pas de gestion d'erreurs
- 💡 **À faire:** Implémenter recherche + envoi demande

### 4. **HomeScreen manque des composants**
**Le Figma a:**
- Leaderboard.tsx (classement)
- Lobby.tsx (salle d'attente)
- Home.tsx (autre écran?)

**Notre app N'A PAS ces composants!**

### 5. **Jeux du Figma**
Le Figma a ses PROPRES jeux:
- ArcheryGame.tsx
- NavalGame.tsx  
- SandyGame.tsx
- ThunderGame.tsx

**Question:** Doit-on utiliser ces jeux ou garder les nôtres?

### 6. **Composants UI manquants**
Le Figma a **61 composants UI** dans `/ui/`

Notre app a seulement ~25 composants copiés

**Manquent possiblement:**
- Toggle
- Badge
- Sheet
- Drawer
- Plus...

---

## ✅ CE QUI FONCTIONNE

1. ✅ AuthScreen (design + Supabase)
2. ✅ MainApp (bottom nav)
3. ✅ HomeScreen (parties en cours)
4. ✅ FriendsPanel (liste basique)
5. ✅ ProfilePanel (basique)
6. ✅ GameIcon (SVG)
7. ✅ ThemeContext (4 thèmes)

---

## 🚨 PROBLÈMES CRITIQUES

### **Les demandes d'amis ne fonctionnent PAS complètement:**

**Code actuel:**
```tsx
// FriendsPanel.tsx
async function acceptRequest(requestId: string) {
  await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  
  await loadPendingRequests(userId);
}
```

**PROBLÈME:** 
- ❌ Pas de notification en temps réel pour l'autre utilisateur
- ❌ L'ami ne reçoit PAS la confirmation
- ❌ Pas de refetch automatique de la liste

**Solution requise:**
```tsx
// 1. Supabase Realtime
useEffect(() => {
  const channel = supabase
    .channel('friendships')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'friendships'
    }, (payload) => {
      // Recharger la liste
      loadFriends(userId);
    })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); }
}, [userId]);

// 2. Ajouter fonction sendFriendRequest
async function sendFriendRequest(friendId: string) {
  const { error } = await supabase
    .from('friendships')
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending'
    });
    
  if (error) {
    alert('Erreur: ' + error.message);
  } else {
    alert('Demande envoyée!');
  }
}
```

---

## 📋 TODO LISTE COMPLÈTE

### PRIORITÉ 1 (CRITIQUE)
- [ ] Implémenter Supabase Realtime pour notifications
- [ ] Fonction sendFriendRequest complète
- [ ] Recherche d'utilisateurs fonctionnelle
- [ ] Accept/Reject avec feedback utilisateur

### PRIORITÉ 2 (IMPORTANT)
- [ ] Copier EXACT ProfilePanel du Figma (avec tabs)
- [ ] Sauvegarder notifications toggle dans DB
- [ ] Sauvegarder avatar DiceBear correctement
- [ ] Ajouter Leaderboard component
- [ ] Ajouter Lobby component

### PRIORITÉ 3 (BONUS)
- [ ] Copier tous les composants UI manquants
- [ ] Décider: garder nos jeux ou utiliser jeux Figma?
- [ ] Améliorer UX avec loaders
- [ ] Améliorer gestion erreurs

---

## 🎯 RECOMMANDATION

**Il faut TOUT recopier du Figma exactement:**
1. Tous les composants principaux
2. Tous les composants UI
3. Toutes les fonctionnalités
4. PUIS connecter à Supabase

**Temps estimé:** 2-3 heures pour TOUT faire correctement

---

## 💬 QUESTION POUR L'UTILISATEUR

Voulez-vous que je:
1. ✅ Copie TOUS les composants du Figma (100%)
2. ✅ Implémente Supabase Realtime
3. ✅ Connecte TOUT à Supabase
4. ✅ Teste TOUT de bout en bout

**OU** préférez-vous une approche progressive?
