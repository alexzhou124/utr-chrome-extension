# 🎾 UTR Rating Chrome Extension

A Chrome extension that overlays UTR (Universal Tennis Rating) on USTA NorCal league pages.

## Features

- **Team Roster** (teaminfo.asp) — Adds a UTR column with singles & doubles ratings
- **Scorecard** (scorecard.asp) — Shows UTR inline next to each player name
- **Player Profile** (playermatches.asp) — Shows UTR next to the player's name
- **Popup Tool** — Batch lookup players by name or profile ID
- **Smart Matching** — Location filtering + name verification + prefix matching (Chris↔Christopher)
- **Caching** — Visit roster once, scorecards load instantly with correct matches

## Install

1. Download this repo as a ZIP (Code → Download ZIP) or clone it
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **"Load unpacked"** → select the extension folder
5. Log into [app.utrsports.net](https://app.utrsports.net) (free account works)

## Usage

Just browse USTA NorCal league pages — ratings appear automatically!

- **Hover** any rating to see the matched UTR player name (verify it's correct)
- **Click** any rating to open their UTR profile
- `—` = no UTR profile found for this player
- `.xx` = rating is projected (not enough matches for full precision)

### Tips

- **Visit the team roster page first** — this caches player IDs for accurate scorecard matching
- **Popup** (click extension icon) — add ", City" after name to disambiguate (e.g., `Brian Hall, Sunnyvale`)

## How It Works

1. Searches UTR API with Bay Area location filter (100mi radius)
2. Matches players by first name (prefix-aware) + last name + city
3. Fetches rating from rankings endpoint (full decimals) with profile endpoint fallback
4. Caches USTA ID → UTR ID mapping in Chrome storage for future use

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Nothing shows up | Make sure you're logged into UTR in the same browser |
| Wrong player matched | Visit the roster page first to cache correct matches |
| Shows `—` | Player likely doesn't have a UTR account |
| Shows `.xx` decimals | Player's rating is "Projected" (not fully verified) |

## Requirements

- Google Chrome
- Free UTR account (logged in)
- Works on `leagues.ustanorcal.com` pages

## Files

```
manifest.json    - Extension config
background.js    - API calls (search + ratings)
content.js       - Page injection logic
content.css      - Styling
popup.html       - Popup UI
popup.js         - Popup logic
```
