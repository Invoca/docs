# Mintlify Docs Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Mintlify starter kit in `docs/` with two products — Invoca Support and Developer Portal — by transplanting the invoca-preview scaffold and fully converting all RST API docs to MDX.

**Architecture:** The `invoca-preview/` folder provides the branding config, support articles, and partial Developer Portal content; the remaining Developer Portal content is converted from RST source in `developer-docs/source/api_documentation/`. All RST directives become Mintlify MDX components (`<Note>`, `<Warning>`, `<Frame>`, markdown tables). Navigation is driven by a single `docs/docs.json` derived from the preview's config.

**Tech Stack:** Mintlify MDX, reStructuredText (source), bash for file operations

---

## RST → MDX Conversion Reference

Use this as a cheat sheet when converting any RST file:

| RST | MDX |
|-----|-----|
| `.. note::` | `<Note>content</Note>` |
| `.. warning::` | `<Warning>content</Warning>` |
| `.. important::` | `<Info>content</Info>` |
| `.. code-block:: bash` | ` ```bash ``` ` |
| `.. code-block:: json` | ` ```json ``` ` |
| `.. raw:: html` alert divs | Mintlify callout components |
| `.. include:: _file.rst` | Inline the included file's content |
| Base64 image data URIs | Remove decorative; wrap real ones in `<Frame><img src="..." /></Frame>` |
| `.. list-table::` | Markdown table |
| External links to `developers.invoca.net` | Relative MDX paths within `docs/` |
| `**bold**` RST | `**bold**` markdown (same) |
| `` `code` `` RST | `` `code` `` markdown (same) |
| Section headings (`====`, `----`) | `#`, `##`, `###` |
| Front matter | Add `---\ntitle: "Page Title"\ndescription: "One-liner"\n---` |

Each MDX file must begin with front matter. Use the page's H1 as the title. Derive the description from the first sentence of body content.

---

## Task 1: Delete docs boilerplate and copy static assets

**Files:**
- Delete: `docs/` (all contents except `docs/superpowers/`)
- Create: `docs/favicon.png` (copy from preview)
- Create: `docs/logo/` (copy from preview)
- Create: `docs/images/` (copy from preview)
- Create: `docs/style.css` (copy from preview)
- Create: `docs/index.mdx` (copy from preview)

- [ ] **Step 1: Delete all boilerplate**

```bash
# Remove everything in docs/ except the superpowers directory
find /Users/dep/invoca/docs -mindepth 1 -maxdepth 1 \
  ! -name 'superpowers' -exec rm -rf {} +
```

Expected: Only `docs/superpowers/` remains.

- [ ] **Step 2: Copy static assets from preview**

```bash
cp /Users/dep/Downloads/invoca-preview/favicon.png /Users/dep/invoca/docs/
cp -r /Users/dep/Downloads/invoca-preview/logo /Users/dep/invoca/docs/
cp -r /Users/dep/Downloads/invoca-preview/images /Users/dep/invoca/docs/
cp /Users/dep/Downloads/invoca-preview/style.css /Users/dep/invoca/docs/
cp /Users/dep/Downloads/invoca-preview/index.mdx /Users/dep/invoca/docs/
```

- [ ] **Step 3: Verify**

```bash
ls /Users/dep/invoca/docs/
```

Expected output includes: `favicon.png  logo/  images/  style.css  index.mdx  superpowers/`

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add -A && git commit -m "chore: clear boilerplate, add static assets from invoca-preview"
```

---

## Task 2: Copy Invoca Support articles

**Files:**
- Create: `docs/s/article/` (9 MDX files from preview)

- [ ] **Step 1: Copy support articles**

```bash
mkdir -p /Users/dep/invoca/docs/s/article
cp -r /Users/dep/Downloads/invoca-preview/s/article/. /Users/dep/invoca/docs/s/article/
```

- [ ] **Step 2: Verify**

```bash
ls /Users/dep/invoca/docs/s/article/
```

Expected: 9 `.mdx` files (jhdcp92865-570.mdx, jhdcp92865-582.mdx, jhdcp92865-585.mdx, jhdcp92865-587.mdx, jhdcp92865-601.mdx, jhdcp92865-688.mdx, jhdcp92865-698.mdx, jhdcp92865-8699.mdx, How-to-Add-and-Map-Custom-Attributes-in-Okta-for-Configuring-Required-SSO-SAML-Parameters.mdx)

- [ ] **Step 3: Commit**

```bash
cd /Users/dep/invoca/docs && git add -A && git commit -m "feat: add Invoca Support articles from invoca-preview"
```

---

## Task 3: Copy Developer Portal scaffold from preview

**Files:**
- Create: `docs/en/latest/index.mdx`
- Create: `docs/en/latest/basics/` (3 files)
- Create: `docs/en/latest/web_integration/` (4 files)
- Create: `docs/en/latest/api_documentation/manage_api_credentials.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/advertiser_campaigns/` (1 overview + 2 endpoint MDX)
- Create: `docs/en/latest/api_documentation/network_integration/advertiser_users/` (1 overview + 4 endpoint MDX)

- [ ] **Step 1: Copy Developer Portal scaffold**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest
cp -r /Users/dep/Downloads/invoca-preview/en/latest/. /Users/dep/invoca/docs/en/latest/
```

- [ ] **Step 2: Verify structure**

```bash
find /Users/dep/invoca/docs/en -name "*.mdx" | sort
```

Expected: ~15 mdx files covering basics, web_integration, api_documentation (credentials + partial network_integration).

- [ ] **Step 3: Fix any internal links in copied files**

Open each file in `docs/en/latest/` and check for links pointing to `developers.invoca.net` or the old RST docs. Replace with relative paths within `docs/`. For example:
- `https://developers.invoca.net/en/latest/api_documentation/...` → `/en/latest/api_documentation/...`

```bash
# Find files with external invoca developer links
grep -rl "developers.invoca.net" /Users/dep/invoca/docs/en/
```

Update any found links to use relative paths.

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add -A && git commit -m "feat: add Developer Portal scaffold from invoca-preview"
```

---

## Task 4: Write docs.json

**Files:**
- Create: `docs/docs.json`

This is the complete navigation config. It starts from the preview's `docs.json` and extends it with all new API sections. The `seo.noindex` is removed (production site).

- [ ] **Step 1: Create docs.json**

Create `/Users/dep/invoca/docs/docs.json` with the following content (the navigation will be extended in later tasks as new pages are added — for now it covers what's already been copied):

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "theme": "mint",
  "name": "Invoca",
  "colors": {
    "primary": "#00AD85",
    "light": "#00AD85",
    "dark": "#00AD85"
  },
  "appearance": {
    "default": "light"
  },
  "background": {
    "decoration": "gradient"
  },
  "fonts": {
    "body": {
      "family": "Gt America",
      "source": "https://cdn.prod.website-files.com/5d82e225060d003d65ddae98/677d87009656fca63c0c7d8f_GT-America-Standard-Regular.woff2",
      "format": "woff2"
    }
  },
  "metadata": {
    "timestamp": true
  },
  "favicon": "/favicon.png",
  "navigation": {
    "products": [
      {
        "product": "Invoca Support",
        "tabs": [
          {
            "tab": "Home",
            "icon": "house",
            "pages": ["index"]
          },
          {
            "tab": "Guide",
            "icon": "book-open",
            "pages": [
              "s/article/jhdcp92865-587",
              "s/article/jhdcp92865-601",
              "s/article/jhdcp92865-688",
              "s/article/jhdcp92865-585",
              "s/article/jhdcp92865-582",
              "s/article/How-to-Add-and-Map-Custom-Attributes-in-Okta-for-Configuring-Required-SSO-SAML-Parameters",
              "s/article/jhdcp92865-570",
              "s/article/jhdcp92865-698",
              "s/article/jhdcp92865-8699"
            ]
          }
        ]
      },
      {
        "product": "Developer Portal",
        "tabs": [
          {
            "tab": "Home",
            "icon": "house",
            "pages": ["en/latest"]
          },
          {
            "tab": "Basics",
            "icon": "list-radio",
            "pages": [
              {
                "group": "Basics",
                "icon": "list-radio",
                "root": "en/latest/basics",
                "pages": [
                  "en/latest/basics/design_principles",
                  "en/latest/basics/error_handling",
                  "en/latest/basics/saml_single_sign_on"
                ]
              }
            ]
          },
          {
            "tab": "API Documentation",
            "icon": "book",
            "groups": [
              {
                "group": "Getting Started",
                "icon": "key",
                "root": "en/latest/api_documentation",
                "pages": [
                  "en/latest/api_documentation/manage_api_credentials"
                ]
              },
              {
                "group": "Network Integration",
                "root": "en/latest/api_documentation/network_integration",
                "pages": [
                  "en/latest/api_documentation/network_integration/advertiser_campaigns",
                  {
                    "group": "Advertiser Campaigns",
                    "root": "en/latest/api_documentation/network_integration/advertiser_campaigns",
                    "pages": [
                      "en/latest/api_documentation/network_integration/advertiser_campaigns/get-a-campaign-for-an-advertiser",
                      "en/latest/api_documentation/network_integration/advertiser_campaigns/create-an-advertiser-campaign"
                    ]
                  },
                  "en/latest/api_documentation/network_integration/advertiser_users",
                  {
                    "group": "Advertiser Users",
                    "root": "en/latest/api_documentation/network_integration/advertiser_users",
                    "pages": [
                      "en/latest/api_documentation/network_integration/advertiser_users/get-all-advertiser-users-for-advertiser",
                      "en/latest/api_documentation/network_integration/advertiser_users/create-an-advertiser-user",
                      "en/latest/api_documentation/network_integration/advertiser_users/update-an-advertiser-user",
                      "en/latest/api_documentation/network_integration/advertiser_users/delete-an-advertiser-user"
                    ]
                  },
                  "en/latest/api_documentation/network_integration/advertisers",
                  "en/latest/api_documentation/network_integration/affiliates",
                  "en/latest/api_documentation/network_integration/affiliate_campaigns",
                  "en/latest/api_documentation/network_integration/advertiser_affiliate_relationships",
                  "en/latest/api_documentation/network_integration/networks",
                  "en/latest/api_documentation/network_integration/promo_numbers",
                  "en/latest/api_documentation/network_integration/call_activity_tracking",
                  "en/latest/api_documentation/network_integration/call_recording_condition",
                  "en/latest/api_documentation/network_integration/prompt_recordings",
                  "en/latest/api_documentation/network_integration/prompt_voice",
                  "en/latest/api_documentation/network_integration/set_call_recorded_prompt",
                  "en/latest/api_documentation/network_integration/custom_challenge_prompts",
                  "en/latest/api_documentation/network_integration/custom_ivr_error_prompts",
                  "en/latest/api_documentation/network_integration/automated_speech_recognition",
                  "en/latest/api_documentation/network_integration/customer_phone_numbers",
                  "en/latest/api_documentation/network_integration/js_tags",
                  "en/latest/api_documentation/network_integration/tag_revisions",
                  "en/latest/api_documentation/network_integration/ringpools",
                  "en/latest/api_documentation/network_integration/whisper_prompts"
                ]
              },
              {
                "group": "Transactions API",
                "root": "en/latest/api_documentation/transactions_api",
                "pages": [
                  "en/latest/api_documentation/transactions_api/network_user",
                  "en/latest/api_documentation/transactions_api/advertiser_user",
                  "en/latest/api_documentation/transactions_api/affiliate_user"
                ]
              },
              {
                "group": "Signal API",
                "root": "en/latest/api_documentation/signal_api",
                "pages": [
                  "en/latest/api_documentation/signal_api/index"
                ]
              },
              {
                "group": "Call API",
                "root": "en/latest/api_documentation/call_api",
                "pages": [
                  "en/latest/api_documentation/call_api/transcript_api",
                  "en/latest/api_documentation/call_api/transcript_analysis_api"
                ]
              },
              {
                "group": "Call Ingestion API",
                "root": "en/latest/api_documentation/call_ingestion_api",
                "pages": [
                  "en/latest/api_documentation/call_ingestion_api/index"
                ]
              },
              {
                "group": "Calls In Progress API",
                "root": "en/latest/api_documentation/calls_in_progress_api",
                "pages": [
                  "en/latest/api_documentation/calls_in_progress_api/index"
                ]
              },
              {
                "group": "Bulk RingPool API",
                "root": "en/latest/api_documentation",
                "pages": [
                  "en/latest/api_documentation/bulk_ringpool_api"
                ]
              },
              {
                "group": "SMS Messaging API",
                "root": "en/latest/api_documentation/sms_messaging_api",
                "pages": [
                  "en/latest/api_documentation/sms_messaging_api/index"
                ]
              }
            ]
          },
          {
            "tab": "Web Integration",
            "icon": "gears",
            "pages": [
              {
                "group": "Web Integration",
                "root": "en/latest/web_integration",
                "pages": [
                  "en/latest/web_integration/invoca_tags",
                  "en/latest/web_integration/toolkit_library",
                  "en/latest/web_integration/pnapi_web_integration",
                  "en/latest/web_integration/advertiser_web_integration"
                ]
              }
            ]
          }
        ]
      }
    ],
    "global": {
      "anchors": [
        {
          "anchor": "Contact Us",
          "href": "https://www.invoca.com/uk/company/contact",
          "icon": "headset"
        },
        {
          "anchor": "Blog",
          "href": "https://www.invoca.com/uk/blog",
          "icon": "newspaper"
        }
      ]
    }
  },
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg",
    "href": "https://www.invoca.com/"
  },
  "navbar": {
    "links": [
      {
        "label": "Login",
        "href": "https://www2.invoca.net/login"
      }
    ],
    "primary": {
      "type": "button",
      "label": "Learn more",
      "href": "https://www.invoca.com/demo/book-a-demo"
    }
  },
  "contextual": {
    "options": [
      "copy",
      "view",
      "chatgpt",
      "claude",
      "perplexity",
      "mcp",
      "cursor",
      "vscode"
    ]
  },
  "footer": {
    "socials": {
      "x": "https://x.com/invoca",
      "instagram": "https://www.instagram.com/invoca/",
      "linkedin": "https://www.linkedin.com/company/invoca-com",
      "facebook": "https://www.facebook.com/Invoca/",
      "youtube": "https://www.youtube.com/channel/UCLQwNQFnN1OV1ACnlXICPKw"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dep/invoca/docs && git add docs.json && git commit -m "feat: add complete docs.json for both products"
```

---

## Task 5: Convert Manage API Credentials

**Files:**
- Source: `developer-docs/source/api_documentation/manage_api_credentials.rst`
- Already copied by Task 3 from preview: `docs/en/latest/api_documentation/manage_api_credentials.mdx`

The preview has a partial version. Compare the RST source to ensure the MDX is complete and self-contained. Update any external links.

- [ ] **Step 1: Read the RST source**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/manage_api_credentials.rst
```

- [ ] **Step 2: Read the preview MDX**

```bash
cat /Users/dep/invoca/docs/en/latest/api_documentation/manage_api_credentials.mdx
```

- [ ] **Step 3: Verify completeness and fix gaps**

Compare the two. Any RST content not reflected in the MDX should be added. Ensure:
- Front matter has `title` and `description`
- All code examples are fenced code blocks
- All alerts are Mintlify components
- No links to `developers.invoca.net` remain

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/manage_api_credentials.mdx && git commit -m "feat: complete manage_api_credentials MDX from RST source"
```

---

## Task 6: Convert Transactions API

**Files:**
- Source: `developer-docs/source/api_documentation/transactions_api/`
- Create: `docs/en/latest/api_documentation/transactions_api/network_user.mdx`
- Create: `docs/en/latest/api_documentation/transactions_api/advertiser_user.mdx`
- Create: `docs/en/latest/api_documentation/transactions_api/affiliate_user.mdx`

Each file is self-contained (the main content is in `index.rst` which includes the three user type files).

- [ ] **Step 1: Read the RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/transactions_api/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/transactions_api/network_user.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/transactions_api/advertiser_user.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/transactions_api/affiliate_user.rst
```

- [ ] **Step 2: Create directory**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest/api_documentation/transactions_api
```

- [ ] **Step 3: Create network_user.mdx**

Convert `network_user.rst` to MDX. Example structure:

```mdx
---
title: "Transactions API - Network User"
description: "Read-only access to call transaction data for network users."
---

# Transactions API — Network User

[Content converted from RST: intro, auth notes, endpoints, parameters as markdown table, curl examples as ```bash blocks, response examples as ```json blocks]
```

- [ ] **Step 4: Create advertiser_user.mdx**

Convert `advertiser_user.rst` to MDX using the same pattern.

- [ ] **Step 5: Create affiliate_user.mdx**

Convert `affiliate_user.rst` to MDX using the same pattern.

- [ ] **Step 6: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/transactions_api/ && git commit -m "feat: convert Transactions API RST to MDX"
```

---

## Task 7: Convert Signal API

**Files:**
- Source: `developer-docs/source/api_documentation/signal_api/` (index.rst + many `_*.rst` includes)
- Create: `docs/en/latest/api_documentation/signal_api/index.mdx`

The Signal API RST inlines many `_*.rst` param files. Inline all of them into a single MDX page.

- [ ] **Step 1: Read all RST files**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/signal_api/index.rst
# Then read each included _*.rst file referenced in it
ls /Users/dep/invoca/developer-docs/source/api_documentation/signal_api/
```

Read each `_*.rst` file listed.

- [ ] **Step 2: Create directory**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest/api_documentation/signal_api
```

- [ ] **Step 3: Create index.mdx**

Inline all `.. include::` RST files into one MDX. Front matter:

```mdx
---
title: "Signal API"
description: "Post-call signals and custom data application via the Invoca Signal API."
---
```

Convert: `.. note::` → `<Note>`, param tables → markdown tables, code blocks → fenced, `.. include::` → inline content.

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/signal_api/ && git commit -m "feat: convert Signal API RST to MDX"
```

---

## Task 8: Convert Call API

**Files:**
- Source: `developer-docs/source/api_documentation/call_api/`
- Create: `docs/en/latest/api_documentation/call_api/transcript_api.mdx`
- Create: `docs/en/latest/api_documentation/call_api/transcript_analysis_api.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/call_api/transcript_api.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/call_api/transcript_analysis_api.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/call_api/index.rst
# Read any _*.rst includes referenced
ls /Users/dep/invoca/developer-docs/source/api_documentation/call_api/
```

- [ ] **Step 2: Create directory**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest/api_documentation/call_api
```

- [ ] **Step 3: Create transcript_api.mdx**

```mdx
---
title: "Transcript API"
description: "Retrieve call transcripts from Invoca."
---
```

Convert RST content following the conversion reference table at the top of this plan.

- [ ] **Step 4: Create transcript_analysis_api.mdx**

```mdx
---
title: "Transcript Analysis API"
description: "Retrieve AI-analyzed call transcript data from Invoca."
---
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/call_api/ && git commit -m "feat: convert Call API RST to MDX"
```

---

## Task 9: Convert Call Ingestion API

**Files:**
- Source: `developer-docs/source/api_documentation/call_ingestion_api/`
- Create: `docs/en/latest/api_documentation/call_ingestion_api/index.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/call_ingestion_api/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/call_ingestion_api/
# Read any _*.rst includes
```

- [ ] **Step 2: Create directory and index.mdx**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest/api_documentation/call_ingestion_api
```

```mdx
---
title: "Call Ingestion API"
description: "Submit external calls to Invoca with optional recording support."
---
```

Inline all `.. include::` content, convert all RST directives to MDX.

- [ ] **Step 3: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/call_ingestion_api/ && git commit -m "feat: convert Call Ingestion API RST to MDX"
```

---

## Task 10: Convert Calls In Progress API

**Files:**
- Source: `developer-docs/source/api_documentation/calls_in_progress_api/`
- Create: `docs/en/latest/api_documentation/calls_in_progress_api/index.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/calls_in_progress_api/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/calls_in_progress_api/
```

Read each `_*.rst` file referenced.

- [ ] **Step 2: Create directory and index.mdx**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest/api_documentation/calls_in_progress_api
```

```mdx
---
title: "Calls In Progress API"
description: "PreSense live call interaction API (restricted access)."
---
```

Add a `<Warning>` note about restricted access if present in RST source.

- [ ] **Step 3: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/calls_in_progress_api/ && git commit -m "feat: convert Calls In Progress API RST to MDX"
```

---

## Task 11: Convert Bulk RingPool API

**Files:**
- Source: `developer-docs/source/api_documentation/bulk_ringpool_api.rst`
- Create: `docs/en/latest/api_documentation/bulk_ringpool_api.mdx`

- [ ] **Step 1: Read RST source**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/bulk_ringpool_api.rst
```

- [ ] **Step 2: Create bulk_ringpool_api.mdx**

```mdx
---
title: "Bulk RingPool API"
description: "High-volume promotional phone number allocation via the Invoca Bulk RingPool API."
---
```

Convert following the RST → MDX reference table.

- [ ] **Step 3: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/bulk_ringpool_api.mdx && git commit -m "feat: convert Bulk RingPool API RST to MDX"
```

---

## Task 12: Convert SMS Messaging API

**Files:**
- Source: `developer-docs/source/api_documentation/sms_messaging_api/`
- Create: `docs/en/latest/api_documentation/sms_messaging_api/index.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/sms_messaging_api/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/sms_messaging_api/
```

- [ ] **Step 2: Create directory and index.mdx**

```bash
mkdir -p /Users/dep/invoca/docs/en/latest/api_documentation/sms_messaging_api
```

```mdx
---
title: "SMS Messaging API"
description: "Alpha feature for SMS management via the Invoca API."
---
```

Add an `<Info>` or `<Warning>` callout noting Alpha status if present in RST.

- [ ] **Step 3: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/sms_messaging_api/ && git commit -m "feat: convert SMS Messaging API RST to MDX"
```

---

## Task 13: Convert Network Integration — Advertisers, Affiliates, Affiliate Campaigns

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/advertisers/`
- Source: `developer-docs/source/api_documentation/network_integration/affiliates/`
- Source: `developer-docs/source/api_documentation/network_integration/affiliate_campaigns/`
- Create: `docs/en/latest/api_documentation/network_integration/advertisers.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/affiliates.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/affiliate_campaigns.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/advertisers/index.rst
# Also read _get_advertiser.rst, _post_advertiser.rst, etc.
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/advertisers/
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/affiliates/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/affiliates/
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/affiliate_campaigns/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/affiliate_campaigns/
```

Read each `_*.rst` file in each directory.

- [ ] **Step 2: Create advertisers.mdx**

```mdx
---
title: "Advertisers"
description: "Create, read, update, and delete advertisers via the Invoca Network Integration API."
---
```

Inline all `_*.rst` endpoint files. Use `##` for each endpoint (GET, POST, PUT, DELETE). Convert params to markdown tables, code examples to fenced blocks.

- [ ] **Step 3: Create affiliates.mdx**

```mdx
---
title: "Affiliates"
description: "Manage affiliates via the Invoca Network Integration API."
---
```

- [ ] **Step 4: Create affiliate_campaigns.mdx**

```mdx
---
title: "Affiliate Campaigns"
description: "Manage affiliate campaigns via the Invoca Network Integration API."
---
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/advertisers.mdx en/latest/api_documentation/network_integration/affiliates.mdx en/latest/api_documentation/network_integration/affiliate_campaigns.mdx && git commit -m "feat: convert Advertisers, Affiliates, Affiliate Campaigns to MDX"
```

---

## Task 14: Convert Network Integration — Advertiser Affiliate Relationships & Networks

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/advertiser_affiliate_relationships/`
- Source: `developer-docs/source/api_documentation/network_integration/networks/`
- Create: `docs/en/latest/api_documentation/network_integration/advertiser_affiliate_relationships.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/networks.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/advertiser_affiliate_relationships/index.rst
# Read each _*.rst file
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/advertiser_affiliate_relationships/
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/networks/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/networks/
```

- [ ] **Step 2: Create advertiser_affiliate_relationships.mdx**

```mdx
---
title: "Advertiser Affiliate Relationships"
description: "Manage relationships between advertisers and affiliates via the Invoca Network Integration API."
---
```

- [ ] **Step 3: Create networks.mdx**

```mdx
---
title: "Networks"
description: "Manage network configuration and users via the Invoca Network Integration API."
---
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/advertiser_affiliate_relationships.mdx en/latest/api_documentation/network_integration/networks.mdx && git commit -m "feat: convert Advertiser Affiliate Relationships and Networks to MDX"
```

---

## Task 15: Convert Network Integration — Promo Numbers & Customer Phone Numbers

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/promo_numbers/`
- Source: `developer-docs/source/api_documentation/network_integration/customer_phone_numbers/`
- Create: `docs/en/latest/api_documentation/network_integration/promo_numbers.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/customer_phone_numbers.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/promo_numbers/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/promo_numbers/
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/customer_phone_numbers/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/customer_phone_numbers/
```

Read each `_*.rst` file in each directory.

- [ ] **Step 2: Create promo_numbers.mdx**

```mdx
---
title: "Promo Numbers"
description: "Allocate and manage promotional phone numbers via the Invoca Network Integration API."
---
```

- [ ] **Step 3: Create customer_phone_numbers.mdx**

```mdx
---
title: "Customer Phone Numbers"
description: "Manage customer phone numbers via the Invoca Network Integration API."
---
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/promo_numbers.mdx en/latest/api_documentation/network_integration/customer_phone_numbers.mdx && git commit -m "feat: convert Promo Numbers and Customer Phone Numbers to MDX"
```

---

## Task 16: Convert Network Integration — Call Activity Tracking, Call Recording Condition, Set Call Recorded Prompt

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/call_activity_tracking/`
- Source: `developer-docs/source/api_documentation/network_integration/call_recording_condition/`
- Source: `developer-docs/source/api_documentation/network_integration/set_call_recorded_prompt/`
- Create: `docs/en/latest/api_documentation/network_integration/call_activity_tracking.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/call_recording_condition.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/set_call_recorded_prompt.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/call_activity_tracking/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/call_recording_condition/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/set_call_recorded_prompt/index.rst
```

- [ ] **Step 2: Create call_activity_tracking.mdx**

```mdx
---
title: "Call Activity Tracking"
description: "Configure call activity tracking via the Invoca Network Integration API."
---
```

- [ ] **Step 3: Create call_recording_condition.mdx**

```mdx
---
title: "Call Recording Condition"
description: "Set conditions for call recording via the Invoca Network Integration API."
---
```

- [ ] **Step 4: Create set_call_recorded_prompt.mdx**

```mdx
---
title: "Set Call Recorded Prompt"
description: "Configure the call recorded prompt via the Invoca Network Integration API."
---
```

- [ ] **Step 5: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/call_activity_tracking.mdx en/latest/api_documentation/network_integration/call_recording_condition.mdx en/latest/api_documentation/network_integration/set_call_recorded_prompt.mdx && git commit -m "feat: convert call activity, recording condition, recorded prompt to MDX"
```

---

## Task 17: Convert Network Integration — Prompt Recordings, Prompt Voice, Custom Prompts, ASR

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/prompt_recordings/`
- Source: `developer-docs/source/api_documentation/network_integration/prompt_voice/`
- Source: `developer-docs/source/api_documentation/network_integration/custom_challenge_prompts/`
- Source: `developer-docs/source/api_documentation/network_integration/custom_ivr_error_prompts/`
- Source: `developer-docs/source/api_documentation/network_integration/automated_speech_recognition/`
- Create: `docs/en/latest/api_documentation/network_integration/prompt_recordings.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/prompt_voice.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/custom_challenge_prompts.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/custom_ivr_error_prompts.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/automated_speech_recognition.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/prompt_recordings/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/prompt_voice/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/custom_challenge_prompts/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/custom_ivr_error_prompts/index.rst
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/automated_speech_recognition/index.rst
```

- [ ] **Step 2: Create each MDX file**

For each, front matter pattern:
```mdx
---
title: "[Human-readable name]"
description: "[One-liner from RST intro]"
---
```

Convert all RST content following the conversion reference table.

- [ ] **Step 3: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/prompt_recordings.mdx en/latest/api_documentation/network_integration/prompt_voice.mdx en/latest/api_documentation/network_integration/custom_challenge_prompts.mdx en/latest/api_documentation/network_integration/custom_ivr_error_prompts.mdx en/latest/api_documentation/network_integration/automated_speech_recognition.mdx && git commit -m "feat: convert prompt recordings, voice, custom prompts, ASR to MDX"
```

---

## Task 18: Convert Network Integration — JS Tags & Tag Revisions

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/js_tags/`
- Source: `developer-docs/source/api_documentation/network_integration/tag_revisions/`
- Create: `docs/en/latest/api_documentation/network_integration/js_tags.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/tag_revisions.mdx`

These are large sections (many `_*.rst` endpoint files each).

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/js_tags/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/js_tags/
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/tag_revisions/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/tag_revisions/
```

Read all `_*.rst` files in each directory (there are many — read them all before writing).

- [ ] **Step 2: Create js_tags.mdx**

```mdx
---
title: "JS Tags"
description: "Create, manage, and deploy JavaScript tags via the Invoca Network Integration API."
---
```

Inline all endpoint RST files. Use `##` headings per endpoint (GET all, GET one, POST, PUT, DELETE, live, pause, unpause, revert).

- [ ] **Step 3: Create tag_revisions.mdx**

```mdx
---
title: "Tag Revisions"
description: "Manage JS tag revisions via the Invoca Network Integration API."
---
```

Also inline `js_revision_parameters.rst` content as a parameters section.

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/js_tags.mdx en/latest/api_documentation/network_integration/tag_revisions.mdx && git commit -m "feat: convert JS Tags and Tag Revisions to MDX"
```

---

## Task 19: Convert Network Integration — Ringpools & Whisper Prompts

**Files:**
- Source: `developer-docs/source/api_documentation/network_integration/ringpools/`
- Source: `developer-docs/source/api_documentation/network_integration/whisper_prompts/`
- Create: `docs/en/latest/api_documentation/network_integration/ringpools.mdx`
- Create: `docs/en/latest/api_documentation/network_integration/whisper_prompts.mdx`

- [ ] **Step 1: Read RST sources**

```bash
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/ringpools/index.rst
ls /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/ringpools/
cat /Users/dep/invoca/developer-docs/source/api_documentation/network_integration/whisper_prompts/index.rst
```

Read all `_*.rst` files in the ringpools directory.

- [ ] **Step 2: Create ringpools.mdx**

```mdx
---
title: "Ringpools"
description: "Create and manage ringpools via the Invoca Network Integration API."
---
```

- [ ] **Step 3: Create whisper_prompts.mdx**

```mdx
---
title: "Whisper Prompts"
description: "Configure whisper prompts for calls via the Invoca Network Integration API."
---
```

- [ ] **Step 4: Commit**

```bash
cd /Users/dep/invoca/docs && git add en/latest/api_documentation/network_integration/ringpools.mdx en/latest/api_documentation/network_integration/whisper_prompts.mdx && git commit -m "feat: convert Ringpools and Whisper Prompts to MDX"
```

---

## Task 20: Final link audit and docs.json validation

**Files:**
- Modify: `docs/docs.json` (if any page paths need correction)
- Modify: any MDX files with remaining broken links

- [ ] **Step 1: Scan for remaining external invoca developer links**

```bash
grep -rl "developers.invoca.net" /Users/dep/invoca/docs/en/ /Users/dep/invoca/docs/s/
```

Fix any found — replace with relative internal paths.

- [ ] **Step 2: Scan for RST artifacts**

```bash
grep -rn "\.\. note::\|\.\. warning::\|\.\. code-block::\|\.\. include::" /Users/dep/invoca/docs/en/
```

If any RST directives remain unconverted, convert them now.

- [ ] **Step 3: Verify all pages in docs.json exist on disk**

Cross-check each page entry in `docs/docs.json` against actual files in `docs/`. For example:
```bash
# Check a sample of expected files exist
ls /Users/dep/invoca/docs/en/latest/api_documentation/transactions_api/
ls /Users/dep/invoca/docs/en/latest/api_documentation/signal_api/
ls /Users/dep/invoca/docs/en/latest/api_documentation/network_integration/
```

- [ ] **Step 4: Commit any final fixes**

```bash
cd /Users/dep/invoca/docs && git add -A && git commit -m "chore: final link audit and cleanup"
```
