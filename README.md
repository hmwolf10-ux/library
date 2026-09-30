# Library

**Open it:** https://hmwolf10-ux.github.io/library/

A searchable reference library you can read on your phone, offline. Concept guides (finance, economics, accounting, strategy, mental models, philosophy, history, AI), step-by-step playbooks (personal finance, Fidelity, Gmail, Excel, Mac and iPhone, travel), a reading list, and four interactive visual guides with charts you can click through.

**On your phone:** open the link in Safari, tap Share, then Add to Home Screen. It opens like an app and works offline once it has loaded.

## What it does

| Tab | What it does |
|---|---|
| **Library** | Every guide grouped by topic, with a read-time estimate and a progress bar on anything you have started. *Continue reading* jumps back to where you stopped. Four interactive **Visual guides** (micro, macro, corporate finance, investing) sit at the bottom. |
| **Search** | Full-text search across every guide at once: titles, section headings, and body text. Results show the matching section and a snippet; opening one highlights your words in the guide. |
| **Saved** | Guides you bookmarked. |
| **Settings** | Light or Dark appearance, text size, backup and restore. |

Inside a guide: a collapsible **On this page** list jumps between sections, wide tables scroll sideways, your reading position is remembered, and the bookmark and **Aa** buttons in the top bar save the guide or change the text size.

## Your data

Saved guides, reading progress, and settings live in this browser on this device. Nothing is uploaded and there is no account. Use **Settings, Download Backup** before clearing Safari data or switching phones.

The storage keys all start with `lib.` because every app on this GitHub Pages site shares one browser origin.

## Folder layout

```
index.html                 app shell
src/app.js                 screens, search, reader
src/ui.js                  shared helpers (storage, theme, router, sheet, backup)
src/base.css, app.css      look (tokens are CSS variables; Light/Dark)
content/manifest.json      the list of guides: id, title, category, blurb, read time
content/*.html             one HTML fragment per guide
visuals/*.html             the interactive chart pages (shown in a frame; need Chart.js from cdnjs once)
sw.js, manifest.webmanifest, icons/    install and offline support
```

## Adding or editing a guide

1. Put the guide in `content/<id>.html` as a plain fragment: `h1` for major sections, `h2` and `h3` below, `p`, `ul`, `table`. No `<html>`, `<head>`, or `<style>`; the app styles it.
2. Add an entry to `content/manifest.json`: `id`, `title`, `cat` (a category id), `blurb`, and `min` (minutes to read, about words divided by 230).
3. Bump `CACHE` in `sw.js` so installed copies refresh.

Search needs no build step. It reads every guide the first time you search and keeps it in memory.

## Run it locally

It is plain HTML and ES modules with no build step, so serve the folder with any static server:

```
python -m http.server 8080
```

then open http://localhost:8080. Deploy by enabling GitHub Pages on `main` (root folder).

## Notes

The guides are general reference, not personal financial, legal, or medical advice.
