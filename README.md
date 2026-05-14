# 🎾 UTR Rating Chrome Extension

Overlays UTR (Universal Tennis Rating) on USTA NorCal league pages — shows singles and doubles ratings next to player names on rosters, scorecards, and player profiles.

<img width="254" height="214" alt="Screenshot 2026-05-13 at 10 09 45 PM" src="https://github.com/user-attachments/assets/b99c628f-3e9f-4bad-893a-6df726904acd" />

## Install


1. **Download the latest release `utr_extension.zip`** → [Releases](../../releases)
2. **Unzip** the file
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** (top-right)
5. Click **"Load unpacked"** → select the unzipped folder
6. Log into [app.utrsports.net](https://app.utrsports.net) (free account works)

## Usage

Browse any `leagues.ustanorcal.com` page — ratings appear automatically.

- **Hover** a rating to verify the matched player
- **Click** a rating to open their UTR profile
- `—` = no UTR profile found
- `.xx` = projected rating (not fully verified)

**Tip:** Visit the team roster page first to cache player matches for accurate scorecard lookups.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Nothing shows up | Log into UTR in the same browser |
| Wrong player matched | Visit the roster page first |
| Shows `—` | Player doesn't have a UTR account |

## Requirements

- Google Chrome
- Free UTR account (logged in)
