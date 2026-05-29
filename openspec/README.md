# OpenSpec Workflow

OpenSpec is used here to capture behavior before changing code in risky domains.

Use a change when work affects article ingestion, categorization, search/ranking, auth/admin access, tracking, partner reporting, or database schema.

Typical flow:

```sh
/opsx:propose "describe the change"
/opsx:apply
/opsx:archive
```

Validation:

```sh
npm run spec:validate
```

