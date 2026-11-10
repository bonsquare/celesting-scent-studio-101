# Implementation Plan: Formula → Production → Costing

## Objective

Refactor the app so reusable formulas, actual perfume production runs, and financial costing are separate linked records:

`Formula Library → Production → Costing`

Use generated IDs `F-0001`, `P-0001`, and `C-0001`. Preserve historical snapshots and shared Supabase data.

## Phase 1 — Data model and pure logic

### 1. Add ID helpers and record factories

Files:

- `src/formulaCode.js`
- New `src/productionCode.js`
- New `src/costingCode.js`
- `src/logic.js`

Work:

- Preserve formula code generation as `F-0001`.
- Add sequential Production ID generation as `P-0001`.
- Add sequential Costing ID generation as `C-0001`.
- Add factories for production and costing records.
- Move target basis, target amount, bottle size, bottle count, and yield defaults out of formula creation and into production creation.

Tests first:

- ID generation with empty, legacy, duplicate, and mixed records.
- Production factory snapshots formula ingredients and calculated quantities.
- Costing factory requires `productionId`.

### 2. Add normalization and migration

Files:

- `src/storage.js`
- New `src/migration.js`

Work:

- Add `productions` and `costings` to the normalized workspace shape.
- Normalize legacy `batches` into Production records with `P-` IDs and legacy batch references.
- Keep old formula records readable while stripping production-only fields from the Formula editor model.
- Preserve legacy formula pricing history without converting it into Costing records.
- Ensure shared Supabase and IndexedDB use the same normalized payload.

Tests first:

- Legacy batch migration preserves formula links, dates, yield, status, schedule, and history.
- Migration is idempotent.
- Existing formulas and material links remain valid.
- Existing costings remain stable after normalization.

## Phase 2 — Formula Library flow

### 3. Convert Formulation into Formula Library

Files:

- `src/main.jsx`
- `src/FormulaWorkspace.jsx`
- `src/FormulaOverviewList.jsx`
- Related formula tests and styles

Work:

- Rename navigation/page labels to Formula Library.
- Rename primary action to **Create a Formulation**.
- Remove bottle size, bottle count, target output, target basis, aging, packaging, and costing inputs from formula creation.
- Keep ingredient percentages, units, formula notes, inspiration, version/status, and formula ID.
- Preserve edit, duplicate, open, archive, and search behavior.

Verification:

- Saving a formula creates only Formula Library data.
- Formula edits do not mutate existing Production or Costing snapshots.

## Phase 3 — Production flow

### 4. Replace Batches with Production

Files:

- `src/main.jsx`
- `src/ProductionBatches.jsx` → rename or refactor to Production
- `src/BatchForm.jsx` → refactor into Production form
- `src/BatchDetail.jsx` → refactor into Production detail
- `src/BatchTracker.jsx`
- `src/production.js`
- Aging-related components and tests

Work:

- Rename navigation and visible labels from Batches/Batch to Production where appropriate.
- Add **Create Production** action.
- Require selecting a saved Formula.
- Snapshot the Formula on Production creation.
- Add output basis: By Fragrance Oil or By Total Output.
- Add target amount, bottle size, number of bottles, actual output/yield, and actual material quantities.
- Initialize actual quantities from calculated formula quantities and allow per-material adjustment.
- Preserve maceration, maturation, status, notes, history, archive, and search/filter behavior.
- Add **Open Costing** to Production detail.

Verification:

- Cannot create Production without a Formula.
- Both output-basis modes calculate expected quantities correctly.
- Actual material edits persist independently from the Formula.
- Aging and status transitions continue to work.

## Phase 4 — Production-specific costing

### 5. Rebuild Costing around Production

Files:

- `src/main.jsx`
- `src/CostingSetup.jsx`
- `src/CostPerMl.jsx`
- `src/BottlingPricing.jsx`
- `src/CostingSteps.jsx`
- New or refactored costing components
- `src/pricing.js`

Work:

- Remove formula-only selection as the Costing entry point.
- Open Costing from a Production record and require `productionId`.
- Display Formula ID and Production ID together.
- Calculate raw material costs from actual Production quantities.
- Snapshot raw-material unit costs when Costing is created/refreshed.
- Add packaging inputs exclusively in Costing.
- Keep labor, overhead, other operating expenses, margins, fees, and selling prices in Costing.
- Save Costing records with `C-` IDs.
- Keep saved Costing snapshots stable when library prices change.

Verification:

- Costing cannot open without a Production.
- Packaging is not stored on Formula or Production.
- Costing totals use actual material quantities and saved price snapshots.
- Reopening a saved Costing does not recalculate it from changed library prices unless explicitly refreshed.

## Phase 5 — Navigation, dashboard, and shared data

### 6. Update navigation and summaries

Files:

- `src/main.jsx`
- `src/MoreSheet.jsx`
- `src/DashboardBanner.jsx`
- Dashboard overview helpers/tests
- `src/style.css`

Work:

- Primary workflow labels: Formula Library, Production, Costing.
- Replace Batches terminology in desktop sidebar, mobile navigation, sheets, buttons, empty states, and dashboard copy.
- Update dashboard metrics to distinguish saved formulas, active Productions, completed Productions, and costing/profit summaries.
- Preserve Inventory, Raw Material Registration, Settings, and backup flows.

### 7. Update shared workspace and database policy

Files:

- `src/storage.js`
- `supabase/schema.sql`
- `README.md`

Work:

- Persist formulas, productions, and costings in the shared workspace payload.
- Keep IndexedDB as the offline cache.
- Ensure RLS policies allow approved users to read/write the shared workspace.
- Preserve user profile approval behavior.
- Document the new shared data shape and migration behavior.

## Phase 6 — Verification and handoff

Run:

- `npm test -- --run`
- `npm run build`
- Manual desktop and mobile flow verification.

Required scenarios:

1. Create Formula `F-0001`.
2. Create Production `P-0001` from that formula using By Fragrance Oil.
3. Adjust actual material quantities and aging dates.
4. Open Costing from `P-0001`, add packaging, labor, and overhead, then save `C-0001`.
5. Edit the original Formula and verify `P-0001` and `C-0001` remain unchanged.
6. Change material pricing and verify saved `C-0001` remains unchanged.
7. Refresh/sign in as another approved user and verify the same Formula, Production, and Costing records appear.
8. Verify legacy batch data remains viewable after migration.

## Execution order

Implement in phases 1 through 6. Do not change navigation before the normalized data model and migration tests are green. Do not remove legacy fields until migration and backward-compatibility tests pass.
