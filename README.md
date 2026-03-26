# Agrégateur d'offres de crédit — Middleware Backend

Service backend (middleware) qui interroge plusieurs partenaires bancaires (APIs mockées), agrège leurs réponses et les normalise dans un format unifié.

## Lancer le projet

```bash
npm install
npm run dev      # mode développement (nodemon + ts-node)
npm run build    # compilation TypeScript
npm start        # lancer le build compilé
npm test         # lancer les tests
```

## Endpoint

### `POST /offers`

**Body :**

```json
{
  "amount": 10000,
  "duration": 24
}
```

| Champ      | Type    | Description                        |
|------------|---------|------------------------------------|
| `amount`   | number  | Montant du prêt souhaité (en euros) |
| `duration` | integer | Durée souhaitée (en mois)          |

**Réponse (200) :**

```json
{
  "offers": [
    {
      "partner": "bankA",
      "amount": 10000,
      "rate": 3.2,
      "duration": 24,
      "monthlyPayment": 430.48,
      "totalCost": 10331.52
    },
    {
      "partner": "bankB",
      "amount": 10000,
      "rate": 2.9,
      "duration": 24,
      "monthlyPayment": 429.19,
      "totalCost": 10300.56
    }
  ],
  "errors": []
}
```

Si un partenaire échoue, ses offres ne sont pas incluses mais l'erreur est signalée :

```json
{
  "offers": [{ "partner": "bankB", "..." : "..." }],
  "errors": [{ "partner": "bankA", "reason": "Timeout: bankA did not respond within 3000ms" }]
}
```

## Architecture

```
src/
├── controllers/       # Couche HTTP — validation déléguée au middleware, orchestration simple
├── services/          # Logique métier — agrégation et appel des partenaires
├── partners/          # Adaptateurs partenaires — chacun normalise ses propres données
├── models/            # Types TypeScript — contrat de données unique (NormalizedOffer)
├── middleware/        # Validation de la requête
├── utils/             # Logger structuré, retry, timeout
└── __tests__/         # Tests Jest (API, service, résilience)
```

## Choix techniques

### Pourquoi cette architecture en couches ?

Le pattern **Adapter** est utilisé pour les partenaires : chaque partenaire implémente une interface commune (`PartnerAdapter`). Ajouter un nouveau partenaire revient à créer un fichier et l'ajouter au registre. Le reste du code n'a pas besoin de changer.

### Normalisation des données

C'est le cœur du service. Chaque partenaire renvoie un format différent :
- **BankA** : champs en français (`montant`, `taux_annuel`, `mensualite`)
- **BankB** : champs en anglais avec un taux mensuel (pas annuel)

La normalisation se fait **dans l'adaptateur lui-même**, pas dans le service. Cela garantit qu'aucune donnée brute ne fuit vers le consommateur de l'API.

### Gestion des erreurs et résilience

- **`Promise.allSettled`** au lieu de `Promise.all` : si un partenaire échoue, les autres répondent quand même.
- **Timeout** : chaque appel partenaire est limité à 3 secondes. Un partenaire lent ne bloque pas la réponse.
- **Retry avec backoff exponentiel** : les erreurs transitoires (réseau, indisponibilité temporaire) sont absorbées par une tentative supplémentaire avant de considérer le partenaire en échec.

### Logs structurés

Les logs sont émis en JSON (une ligne par entrée) avec timestamp, niveau et métadonnées. Ce format est directement compatible avec des outils comme Datadog, ELK ou CloudWatch — pas besoin de parser du texte.

### Validation

La validation du body est faite dans un middleware Express dédié, avant d'atteindre le controller. Les erreurs de validation renvoient un `400` clair.

## Tests

```bash
npm test
```

Les tests couvrent :
- **API (supertest)** : réponse correcte, format normalisé, validation des entrées
- **Service** : agrégation multi-partenaires, cohérence financière des données
- **Résilience** : timeout, retry, épuisement des tentatives

## Ce que j'aurais ajouté avec plus de temps

- **Cache** des offres pour des requêtes identiques (TTL court)
- **Rate limiting** sur l'endpoint
- **Circuit breaker** par partenaire (éviter de solliciter un partenaire durablement en erreur)
- **OpenAPI / Swagger** pour documenter l'API
- **Docker** pour le déploiement
