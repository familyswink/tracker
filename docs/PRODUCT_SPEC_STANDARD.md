# Product specification standard (all tools)

Use this template for **PRODUCT_SPEC.md** (or **docs/PRODUCT_REQUIREMENTS.md** where that name is already established) in every personal-health tool repo. Goal: one predictable shape so specs stay aligned with code and user docs.

**Repos using this standard:**

| Repo | Spec file | User guide |
|------|-----------|------------|
| **tracker** | [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) | [USER_GUIDE.md](USER_GUIDE.md) |
| **oura-export** | [product-spec.md](../../oura-export/docs/product-spec.md) | [USER_GUIDE.md](../../oura-export/docs/USER_GUIDE.md) |
| **oura_loader** | [PRODUCT_SPEC.md](../../oura_loader/PRODUCT_SPEC.md) | [USER_GUIDE.md](../../oura_loader/docs/USER_GUIDE.md) |
| **myLabs** | [PRODUCT_SPEC.md](../../myLabs/PRODUCT_SPEC.md) | [USER_GUIDE.md](../../myLabs/USER_GUIDE.md) |

**Ecosystem overview:** [ECOSYSTEM.md](ECOSYSTEM.md)

---

## Required sections (in order)

Copy this skeleton into each product spec. Replace bracketed placeholders.

```markdown
# Product specification — [Product name]

**Status:** [Draft | Implemented | Living]  
**Last updated:** YYYY-MM-DD  
**App / package version:** [optional — e.g. 2026.05.20.19 or semver]  

**Related:** [USER_GUIDE](…), [ECOSYSTEM](../tracker/docs/ECOSYSTEM.md), sibling specs (links)

---

## 1. Purpose

- **Problem solved** (1–3 sentences)
- **Primary user** (single-user personal automation assumed unless stated)
- **What this tool does NOT do** (one line)

## 2. Goals and non-goals

| ID | Goal (must-have) |
|----|------------------|
| G1 | … |

**Non-goals:** bullet list (SaaS, medical device, real-time, etc.)

## 3. Users and workflows

| Workflow | Where it runs | Credentials / config |
|----------|---------------|----------------------|
| Local | … | … |
| CI / scheduled | … | … |

## 4. Functional requirements

Numbered or REQ-* items. Each requirement should be **testable** (behavior you can verify in code or smoke test).

## 5. Runtime configuration

**Normative table** — every setting a user or operator can change at runtime (UI toggle, YAML, env var, CLI flag). For each row:

| Setting | Where | Default | Effect |
|---------|-------|---------|--------|
| … | … | … | … |

Do **not** bury settings only in README prose; this table is the contract.

## 6. Data layout and persistence

Files, folders, localStorage keys, Drive paths — whatever this tool owns.

## 7. Integration with sibling tools

How this repo connects to others in the ecosystem (inputs, outputs, who writes which file region). Link to [ECOSYSTEM.md](ECOSYSTEM.md).

## 8. Security and privacy

Secrets location, what must never be committed, private-repo assumptions.

## 9. Success criteria

Checklist for “done” / healthy operation.

## 10. Revision history

| Date | Change |
|------|--------|
| YYYY-MM-DD | … |
```

---

## User guide standard

Each repo should have **USER_GUIDE.md** (or README section titled **User guide**) with:

1. **Quick start** — install / open / first run (≤ 5 steps)
2. **Daily workflows** — what the user does most often
3. **Settings reference** — same rows as spec §5, written for humans
4. **Troubleshooting** — 3–10 common failures
5. **Related tools** — link to [ECOSYSTEM.md](ECOSYSTEM.md)

Settings → Help in Tracker should point to **USER_GUIDE.md** on GitHub.

---

## Maintenance rules

1. **Code change that affects behavior** → update spec §4 and §5 in the same PR/commit when possible.
2. **User-visible change** → update USER_GUIDE and bump **Last updated** in spec.
3. **Cross-repo contract change** (daily log format, Drive paths, dual-writer) → edit [REQUIREMENTS_CHANGELOG.md](../../oura_loader/docs/REQUIREMENTS_CHANGELOG.md) checklist items in **each** affected repo.
4. **Stale backlog** → mark items *Done* or remove from spec §open items when shipped.
5. **Version field** — Tracker: `src/version.js`; Python tools: tag or date in spec header; CI: note commit SHA in workflow docs only.

---

## Spec vs README

| Document | Audience | Content |
|----------|----------|---------|
| **PRODUCT_SPEC** | You + future you + agents | Normative requirements, settings table, integration contracts |
| **USER_GUIDE / README** | Operator / daily use | Commands, clicks, troubleshooting |
| **ECOSYSTEM** | All repos | How tools connect; not duplicated per repo |
| **ARCHITECTURE / REFACTOR_SPEC** | Developers only | Implementation phases, module map |

Do not duplicate the full ecosystem story in every spec — link to **ECOSYSTEM.md** §Integration instead.
