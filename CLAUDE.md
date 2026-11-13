# Ron's Pijamas – Shopify theme (Dawn 16)

This repository (`viliyanm-rons/rons-pijamas-theme`) is used **only** for the Ron's Pijamas Shopify store
(`h0d0gn-s1.myshopify.com`). It is a Bulgarian, black-and-white, mobile-first custom Dawn theme.

## Project isolation
- Commit only files for this Shopify theme.
- Never add other projects or clients: no Voodoo / Voodoo Print, Print.bg, FlagFlag, Rebrand, Florave, DAMINFISI,
  other websites, or their HTML, CSS, JS, images or videos. They belong in their own repositories.
- Never commit screenshots, test recordings, previews, caches, `node_modules`, temporary folders or generated
  files. Test harnesses live outside the repo.
- If unrelated files appear in `git status`, a diff or a branch: **stop and report them**. Never delete them
  automatically.

## Structure
- Standard Shopify folders only: `assets/ config/ layout/ locales/ sections/ snippets/ templates/`
  (`blocks/` if ever used). No nested themes, duplicate project folders or copies of a component.
- Custom code lives in `assets/rons-custom.css`, `assets/rons-custom.js` and the `rons-*` sections and snippets.
  Reuse existing Dawn sections, snippets and assets wherever practical.
- Root docs: `README.md`, `SIZE-GUIDE-SETUP.md`, `NAVIGATION-PAGES-SETUP.md`, this file.

## Branches and themes
- `main` is approved production code. It changes only through a reviewed PR from `development`.
- `development` is integration and testing. It is connected to the unpublished Shopify theme
  `rons-pijamas-theme/development`.
- Use `feature/<name>` or `fix/<name>` only when needed, keep it short-lived, and group related changes in one
  branch and PR. Don't open a branch, PR or Shopify theme for every small text change.
- Until the planned migration, the live theme is still connected to `claude/size-guide-system`. Check the live
  theme's branch before any production change.
- `claude/epic-darwin-qszp6y` (DAMINFISI) and `claude/wonderful-cannon-ylahoe` (Voodoo) are other projects.
  Never merge them into `main` or `development`, and never delete them without the owner's approval.

## Shopify safety
- Shopify commits Theme Editor changes to the connected branch (`shopify[bot]`). Fetch first and never
  overwrite them. JSON templates keep Shopify's `/* … */` header.
- Before a release PR to `main`, merge `main` into `development`.
- Never publish a theme, change the live theme, merge PRs or delete branches or themes without the owner's
  explicit approval.
- Must keep working: size guide (metaobjects), stock indicator, variants, homepage settings, cart, Bulgarian
  navigation and translations.
- Never invent product data, measurements, reviews, stock or delivery promises.

## Before every commit and push
1. `git remote get-url origin` is `viliyanm-rons/rons-pijamas-theme`, and the task is about Ron's Pijamas.
2. Read `git status` and the full diff. Stage named files only, no blind `git add .` or `git add -A`.
3. Run `shopify theme check --path . --fail-level error` and get 0 errors (stock Dawn has 9 known warnings).
4. Test the affected components, and push only the commits the task needs.

CI (`.github/workflows/ci.yml`) runs Theme Check only on pull requests and on pushes to `main` and `development`.
Avoid extra pushes, polling and CI runs. Don't add more automation unless it's needed.
