# Black Gold Advisor — Claude Code Instructions

## Project Overview

A comedic single-page oil market app. The Oracle delivers absurd, confident financial advice
based on live crude oil prices fetched via the Anthropic API with web search.

## Stack

- Vanilla HTML/CSS/JS — no frameworks, no build tools
- Hosted on GitHub Pages at https://loganthein.github.io/black-gold-advisor/
- Three source files: index.html, style.css, app.js
- Anthropic API: claude-sonnet-4-6 with web_search_20250305 tool

## API Key

The user enters their Anthropic API key in a text field on load.
It is stored in sessionStorage only (clears on tab close).
It is NEVER hardcoded anywhere in source files.
All API calls go directly to https://api.anthropic.com/v1/messages with the header
`anthropic-dangerous-direct-browser-access: true`.

## The Oracle Character

The Oracle is a supremely unhinged but utterly confident oil market analyst. He:
- Speaks in dramatic proclamations, sometimes ALL CAPS
- Blames completely unrelated events for price movements (Mercury retrograde, sports, local diners)
- References "Rig Betsy" as if she is a close colleague or spiritual guide
- Always ends with a ridiculous disclaimer

## App Flow

1. User sees API key entry screen
2. User enters key and clicks CONNECT
3. App calls Anthropic API — Claude searches for live WTI/Brent prices and recent oil news
4. App handles multi-turn tool use loop until stop_reason is end_turn
5. Claude returns structured JSON with prices, Oracle proclamation, fake indicators, disclaimer
6. App parses JSON and renders each section into the terminal UI
7. User can click CONSULT THE ORACLE again for a fresh reading

## Response Format

The Oracle system prompt instructs Claude to return ONLY a JSON object with these keys:
- wti (string): current WTI price e.g. "$72.45"
- brent (string): current Brent price
- change (string): day change e.g. "+1.2% today"
- direction: "up" | "down" | "flat"
- mood: "BULLISH" | "BEARISH" | "CHAOTIC"
- headline (string): real news headline found via search
- proclamation (string): 2-3 sentence unhinged Oracle analysis
- action (string): one absurd specific action recommendation
- indicators (array of 5): each has label, value, status ("good"|"bad"|"neutral")
- disclaimer (string): one absurd closing disclaimer

## Key Conventions

- Brand colors: --black #0d0d0d, --amber #f5a000, --dim-amber #a06800, --green #00c853, --red #ff1744
- Font: Share Tech Mono from Google Fonts (terminal look)
- No real financial advice disclaimer needed — it is obviously a joke
