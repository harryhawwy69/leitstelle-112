# ADR-0003: pnpm-Monorepo mit TypeScript strict

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Sim-Kern, Routing, Schemas, UI und Desktop-App sollen getrennt testbar sein, aber
gemeinsam versioniert werden. Abhängigkeitsrichtungen müssen erzwungen werden.

## Entscheidung

- **pnpm workspaces**: Pakete unter `packages/`, Anwendungen unter `apps/`, Werkzeuge
  unter `tools/`, Inhalte unter `content/`.
- **TypeScript** mit `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`; Projekt-Referenzen (`tsc -b`).
- Ausschließlich ES-Module.
- Abhängigkeitsregeln per ESLint (`eslint-plugin-boundaries` o. ä.): `packages/sim` darf
  weder `apps/*` noch DOM- oder Node-APIs importieren.
- Node-Version über `.nvmrc`/`engines` fixiert, pnpm-Version über `packageManager`.

## Alternativen

- npm/yarn workspaces: weniger strikte Auflösung (Phantom-Abhängigkeiten).
- Nx/Turborepo: zunächst unnötig; Turborepo kann später für Build-Caching ergänzt werden.

## Konsequenzen

Klare Grenzen, schnelle Installs. Etwas Einrichtungsaufwand für Projekt-Referenzen.
