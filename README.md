# Stack

Le cockpit de Mathéo : applis, clients, projets, temps, contrats de maintenance et raccourcis au même endroit.
La facturation et la compta restent dans [Indy](https://app.indy.fr) : Stack ne fait que lire tes exports et ouvrir Indy.

## Lancer l'appli

Il faut Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000.

## Ce qu'il y a dans cette version

- **Accueil** : chiffres clés, raccourcis, semaine, échéances, applis, tâches du jour, CA, projet en cours, pipeline, prochain rendez-vous, maintenance à facturer.
- **Recherche ⌘K** (ou Ctrl+K) : clients, applis, projets, raccourcis et actions rapides.
- **Raccourcis** : ajout, modification, groupes, import d'un favicon (.ico, .png, .svg) ou initiales + couleur.
- **Applis** : catalogue, état, disponibilité, temps de réponse, déploiements, échéances (domaine, SSL, hébergement).
- **Clients** : liste, pipeline par glisser-déposer, fiche client, export CSV.
- **Statistiques** : 10 indicateurs (CA, récurrent, panier moyen, conversion, délai de signature, évolution, CA par client, sources, fidélité, taux horaire réel).
- **Import Indy** : exporte tes factures en CSV depuis Indy et glisse le fichier dans Stack (Clients ou Stats). Les doublons sont ignorés. Pas de connexion bancaire.
- **Projets** : kanban par glisser-déposer, chrono, suivi du temps, contrats de maintenance.
- **Thème clair et sombre**, version mobile avec barre d'onglets en bas.

## Données

Cette première version n'a pas de base de données : elle démarre avec des données d'exemple et garde tes changements dans le navigateur (localStorage). Vider les données du site remet les données d'exemple.

Étape suivante prévue : base Supabase (Postgres) avec connexion, puis vrai monitoring des sites (ping régulier).

## Technique

Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand, lucide-react. Police Plus Jakarta Sans.

```
src/app          pages (accueil, applis, clients, projets, raccourcis)
src/components   coque (barre latérale, barre du haut, ⌘K), composants UI, graphiques
src/lib          types, données d'exemple, store, calcul des stats, lecture des exports Indy
```
