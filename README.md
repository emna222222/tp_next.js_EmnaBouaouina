This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

