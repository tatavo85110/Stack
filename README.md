# Stack

Le cockpit de Mathéo : applis, clients, projets, temps, contenu du site et raccourcis au même endroit.
La facturation et la compta restent dans [Indy](https://app.indy.fr) : Stack ne fait que lire tes exports et ouvrir Indy.

## En ligne

https://tatavo85110.github.io/Stack/ (mis à jour automatiquement à chaque envoi sur `main`, voir `.github/workflows/pages.yml`).

## Lancer l'appli

Il faut Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000.

## Ce qu'il y a dans Stack

- **Accueil** en widgets (ajouter, ranger, masquer), dont le résumé du matin par Claude et les demandes clients.
- **Recherche ⌘K**, **raccourcis** avec favicon.
- **Applis** : vérification des sites toutes les 5 min quand Stack est ouvert, disponibilité 30 jours, temps de réponse, alertes. Erreurs Sentry, déploiements Vercel / Netlify / Coolify, date de fin du domaine trouvée automatiquement (RDAP), suivi des sauvegardes, page de statut publique à partager.
- **Clients** : CRM (liste, pipeline, fiche), import des factures Indy (CSV), 10 statistiques, demandes clients, portail client à partager (état des sites, avancement, étapes, livrables, demande en un clic), rapport mensuel en PDF.
- **Projets** : kanban, modèles de projet avec étapes, livrables, chrono et temps, tableau d'activité (heures par client, taux facturable, taux horaire réel).
- **Mon site** : portfolio, témoignages et articles, publiés en JSON dans le dépôt GitHub du site. Le formulaire de contact du site crée des prospects.
- **Notes techniques** avec recherche simple et recherche intelligente (Claude).
- **Assistant Claude** : résumé du matin, compte rendu client, analyse d'une erreur, email transformé en tâches.
- **Synchro** téléphone et ordinateur avec Supabase, appli installable (hors ligne), thème clair et sombre.

## Données

- Les données sont dans le navigateur et, une fois connecté dans Réglages, synchronisées dans Supabase (tables `stack_state` et `stack_inbox`, protégées par RLS, inscriptions fermées).
- Les clés des services (Claude, Sentry, Vercel, Netlify, Coolify, GitHub) restent sur chaque appareil : ni synchro, ni sauvegarde, ni dépôt.
- La clé Supabase présente dans le code est la clé publique (« publishable ») : elle est faite pour être dans le navigateur.

## Technique

Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand, lucide-react. Police Plus Jakarta Sans.

```
src/app          pages (accueil, applis, clients, projets, raccourcis)
src/components   coque (barre latérale, barre du haut, ⌘K), composants UI, graphiques
src/lib          types, données d'exemple, store, calcul des stats, lecture des exports Indy
```
