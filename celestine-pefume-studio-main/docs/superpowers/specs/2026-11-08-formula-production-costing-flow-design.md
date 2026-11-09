# Formula → Production → Costing Flow

## Status

Design approved in conversation on 2026-11-08. Implementation has not started.

## Goal

Separate reusable perfume formulation from actual manufacturing and financial costing. The final workflow is:

`Formula Library → Production → Costing`

Each stage has its own generated ID and historical snapshot.

## Record model

### Formula Library (`F-0001`)

Formula records contain only reusable formulation information:

- Formula ID
- Formula/scent name
- Inspiration or scent reference
- Ingredient list and percentages
- Measurement unit
- Formula notes, version, and status
- Created/updated timestamps

Formula records must not store bottle size, bottle count, desired output, actual yield, aging dates, packaging, labor, overhead, costing, or selling price.

### Production (`P-0001`)

Production records are created from a saved Formula and snapshot the formula at creation time. They contain:

- Production ID
- Linked Formula ID
- Formula snapshot, including ingredient names, material IDs, percentages, density, and unit information
- Output basis: by fragrance oil or by total output
- Target amount
- Bottle size and number of bottles
- Actual output/yield
- Actual material quantities used, initialized from calculated formula quantities and editable per run
- Production date and notes
- Maceration and maturation schedule
- Production status and history

Later Formula edits must not rewrite an existing Production snapshot.

### Costing (`C-0001`)

Costing records are opened only from a specific Production and always contain `productionId`. They contain:

- Costing ID
- Production ID and Formula ID
- Production/formula snapshot references
- Actual material usage from Production
- Material unit-cost snapshots captured when costing is created or refreshed
- Packaging items and prices, entered at the Costing stage
- Labor, overhead, and other operating costs
- Cost totals, cost per unit, margins, fees, and selling prices
- Saved pricing history and timestamps

Later raw-material or packaging price edits must not rewrite an existing saved Costing record.

## User flow

### Formula Library

Rename the existing formulation destination to Formula Library. The primary action is **Create a Formulation**. Users can create, edit, duplicate, open, search, and archive reusable formulas. Formula creation excludes production quantity, aging, packaging, and costing fields.

### Production

Rename Batches to Production. Users create a Production by selecting a Formula, choosing the output basis, entering the target amount, bottle size, bottle count, actual output, and actual material quantities, then setting the production and aging schedule. A saved Production exposes an **Open Costing** action.

### Costing

Costing requires a Production selection. The screen shows the Formula ID and Production ID, uses actual Production quantities, and accepts packaging, labor, overhead, operating expenses, and pricing inputs. Saving creates or updates a Costing record for that Production.

## Data migration

- Normalize existing formula records into Formula Library records without deleting their reusable ingredient percentages.
- Move production-specific values out of the formula editing flow.
- Normalize existing `batches` into Production records, preserving formula links, dates, yield, aging schedule, status, and history. Assign `P-` IDs while retaining any legacy batch number as a legacy reference.
- Do not automatically convert unlinked formula pricing history into Costing records. Preserve it as legacy history.
- Add a `costings` collection. New Costing records require `productionId` and receive `C-` IDs.
- Keep normalization backward-compatible so older shared data and local IndexedDB caches remain readable.

## Shared data

The shared Supabase workspace remains the source of truth for authenticated approved users. The client keeps IndexedDB as the offline cache. All three collections—formulas, productions, and costings—must be saved in the same shared workspace payload.

## Validation and edge cases

- Production cannot be created without a Formula.
- Costing cannot open without a saved Production.
- Actual material quantities must be non-negative and should default from calculated formula quantities.
- Formula edits must be versioned or snapshotted so historical Production records remain stable.
- Deleting or archiving a Formula must not delete linked Production or Costing records.
- If a legacy batch has no resolvable Formula link, it remains viewable as a legacy Production record and is not eligible for new Costing until linked or recreated.

## Verification

- Unit-test ID generation, normalization, formula snapshots, production snapshots, costing snapshots, and legacy migration.
- Verify Formula → Production → Costing navigation on desktop and mobile.
- Verify editing a Formula does not change existing Production or Costing history.
- Verify price edits do not change saved Costing records.
- Verify shared Supabase users see the same records after refresh and sign-in.
