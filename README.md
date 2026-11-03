# Tableau de bord étudiant

Application Next.js avec authentification par session JWT, gestion des rôles et
tableau de bord sécurisé.

## Installation

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
echo DATABASE_URL="file:./dev.db" > .env
echo JWT_SECRET="remplacer-par-un-secret-aleatoire" >> .env
npx prisma migrate dev
npm run dev
```

Le fichier `.env` doit définir `DATABASE_URL` (par exemple `file:./dev.db`) et
`JWT_SECRET` avec une valeur aléatoire longue. Ne commitez jamais ce fichier.
Pour vérifier le code avant livraison :

```bash
npm run lint
npm run build
```

## Modèle de données

Le modèle Prisma `User` est défini dans
[`prisma/schema.prisma`](./prisma/schema.prisma). Il contient `id`, `email`,
`name`, `password`, `role` et `createdAt`. Le mot de passe est stocké sous
forme de hash et n'est jamais inclus dans les sélections ou réponses API.
L'application ne possède actuellement pas de champ de groupe ou de niveau :
le graphique du dashboard représente donc la répartition des comptes par rôle
pour les administrateurs.

Les indicateurs du dashboard sont calculés dans
[`src/lib/dashboard.ts`](./src/lib/dashboard.ts) avec Prisma : comptage des
étudiants, comptage des créations des 30 derniers jours et cinq ajouts les
plus récents. Les requêtes indépendantes sont exécutées avec `Promise.all`.

## Accès par rôle

La page `/dashboard` vérifie la session et le rôle côté serveur avant toute
récupération de données. Une session absente ou invalide est redirigée vers
`/login`. Le filtrage visuel n'est jamais utilisé comme mécanisme
d'autorisation.

| Périmètre | ADMIN | ENSEIGNANT | ETUDIANT |
| --- | --- | --- | --- |
| Indicateurs étudiants du périmètre autorisé | Oui | Oui, périmètre pédagogique | Son profil uniquement |
| Liste des étudiants | Oui | Oui, données pédagogiques autorisées | Son propre compte uniquement |
| Répartition des comptes par rôle | Oui | Non | Non |
| Gestion complète | Oui | Non | Non |
| Données sensibles (`password`) | Jamais exposées | Jamais exposées | Jamais exposées |

Les routes `/api/students` et `/api/students/[id]` appliquent la même
politique côté serveur. Les droits détaillés de création, modification et
suppression sont décrits dans la matrice ci-dessous.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Matrice des permissions

Les droits sont vérifiés côté serveur à partir du rôle enregistré en base de
données. Le rôle fourni éventuellement par le navigateur n'est jamais utilisé
pour autoriser une opération.

| Opération | ADMIN | ENSEIGNANT | ETUDIANT |
| --- | --- | --- | --- |
| Lister les étudiants | Oui | Oui | Ses propres données uniquement |
| Créer un étudiant | Oui | Non | Non |
| Modifier un étudiant | Oui | Selon la règle ci-dessous | Non |
| Supprimer un étudiant | Oui | Non | Non |
| Consulter son profil | Oui | Oui | Oui |

### Règle pour le rôle ENSEIGNANT

Un enseignant peut consulter la liste des étudiants et modifier uniquement
leur nom et leur adresse email. Il ne peut pas créer ou supprimer un étudiant,
ni modifier son rôle ou son mot de passe.

## Tests de sécurité manuels

Les commandes suivantes supposent que l'application fonctionne sur
`http://localhost:3000`. Après une connexion, conserver le cookie `session`
retourné par l'application et le fournir avec `-b "session=..."`.

### 1. Utilisateur non connecté

```bash
curl -i http://localhost:3000/api/students
```

Résultat attendu : `401 Unauthorized`.

### 2. ETUDIANT : suppression refusée

```bash
curl -i -X DELETE http://localhost:3000/api/students/2 \
  -b "session=COOKIE_ETUDIANT"
```

Résultat attendu : `403 Forbidden`.

### 3. ENSEIGNANT : création refusée

```bash
curl -i -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -b "session=COOKIE_ENSEIGNANT" \
  -d '{"name":"Nouvel étudiant","email":"nouvel.etudiant@example.com","password":"motdepasse123"}'
```

Résultat attendu : `403 Forbidden`.

### 4. Étudiant A : accès au profil de B

La politique retenue est `404 Not Found` afin de ne pas révéler à l'étudiant A
qu'une ressource appartenant à B existe. L'API `/api/students` ne retourne déjà
que les données de l'étudiant connecté.

```bash
curl -i http://localhost:3000/api/students \
  -b "session=COOKIE_ETUDIANT_A"
```
