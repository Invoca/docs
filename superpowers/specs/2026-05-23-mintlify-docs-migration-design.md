# Mintlify Docs Migration Design

**Date:** 2026-05-23  
**Status:** Approved

## Overview

Migrate Invoca's API documentation from ReadTheDocs (RST format) to Mintlify (MDX format), replacing the boilerplate Mintlify starter kit in `docs/` with two top-level products: **Invoca Support** and **Developer Portal**.

## Source Materials

| Source | Location | Role |
|--------|----------|------|
| RST API docs | `developer-docs/source/api_documentation/` | Convert to MDX (143 files) |
| Invoca preview scaffold | `~/Downloads/invoca-preview/` | Template for branding, navigation, and partially-converted pages |
| Current docs | `docs/` | Delete all boilerplate; replace entirely |

## Top-Level Structure

Two Mintlify products defined in `docs/docs.json`, based on the `invoca-preview/docs.json` config:

### Product 1: Invoca Support
- Transplanted directly from `invoca-preview/s/` (9 support articles, no conversion needed)
- Home page from `invoca-preview/index.mdx`

### Product 2: Developer Portal
Organized into 5 tabs:

| Tab | Source |
|-----|--------|
| Home | `invoca-preview/en/latest/index.mdx` |
| Basics | `invoca-preview/en/latest/basics/` (error handling, design principles, SAML SSO) |
| Getting Started | Converted from `manage_api_credentials.rst` |
| API Reference | Full RST conversion of all 8 API sections |
| Web Integration | `invoca-preview/en/latest/web-integration/` (Invoca Tags, Toolkit, PNAPI) |

## File Layout

```
docs/
├── docs.json                    # Merged config from invoca-preview (Invoca branding)
├── index.mdx                    # Home (from invoca-preview/index.mdx)
├── favicon.png
├── logo/
├── images/
├── style.css
├── s/                           # Invoca Support articles
│   └── [9 support article .mdx files]
└── en/latest/                   # Developer Portal
    ├── index.mdx
    ├── basics/
    ├── getting-started/
    │   └── manage-api-credentials.mdx
    ├── api-reference/
    │   ├── network-integration/   # 22+ pages
    │   ├── transactions/          # 3 pages
    │   ├── signal-api/
    │   ├── call-api/
    │   ├── call-ingestion/
    │   ├── calls-in-progress/
    │   ├── bulk-ringpool.mdx
    │   └── sms-messaging/
    └── web-integration/
```

## API Reference Tab: RST → MDX Mapping

| Mintlify Group | RST Source | Approx Pages |
|---|---|---|
| Network Integration | `network_integration/` | 22+ |
| Transactions | `transactions_api/` | 3 |
| Signal API | `signal_api/` | ~5 |
| Call API | `call_api/` | 2 |
| Call Ingestion | `call_ingestion_api/` | ~3 |
| Calls In Progress | `calls_in_progress_api/` | ~3 |
| Bulk RingPool | `bulk_ringpool_api.rst` | 1 |
| SMS Messaging | `sms_messaging_api/` | ~3 |

## Conversion Rules (RST → MDX)

| RST Element | MDX Equivalent |
|-------------|---------------|
| `.. note::` / `.. warning::` | `<Note>`, `<Warning>`, `<Info>` |
| `.. code-block:: bash` | ` ```bash ``` ` |
| `.. raw:: html` alerts | Mintlify callout components |
| `.. include:: _param_table.rst` | Inlined as markdown table or `<ParamField>` |
| Base64 / external images | `<Frame>` component (self-contained) |
| External links to old RST docs | Updated to internal Mintlify paths |
| External links to `developers.invoca.net` | Updated to internal paths |
| `.. toctree::` | Reflected in `docs.json` navigation |

## Branding

- Colors: teal `#00AD85` (primary), from invoca-preview
- Font: Gt America (from invoca-preview)
- Logo/favicon: from invoca-preview assets
- SEO: `noindex` removed (this is the production site)

## Style Template

The preview's already-converted pages (`en/latest/api-reference/network-integration/advertiser-campaigns/`) serve as the reference implementation for RST → MDX conversion style.

## Deletion

All existing `docs/` boilerplate (Mintlify starter kit guides, example API endpoints, existing `docs.json`) is deleted before transplanting new content. Nothing from the current `docs/` structure is preserved.
