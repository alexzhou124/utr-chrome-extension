
(async function() {
  'use strict';
  if (document.body.hasAttribute('data-utr-loaded')) return;
  document.body.setAttribute('data-utr-loaded', 'true');

  const isRosterPage = window.location.pathname.toLowerCase().includes('teaminfo');
  const isPlayerPage = window.location.pathname.toLowerCase().includes('playermatches');
  console.log('[UTR] Page type:', isRosterPage ? 'roster' : isPlayerPage ? 'player' : 'other');

  // --- Helpers ---
  function firstNameMatch(utrName, searchFirst) {
    const parts = utrName.toLowerCase().trim().split(/\s+/);
    const utrFirst = parts[0] || '';
    const f = searchFirst.toLowerCase();
    if (utrFirst === f) return true;
    if (utrFirst.startsWith(f) || f.startsWith(utrFirst)) return true;
    return false;
  }

  function bestMatch(players, firstName, lastName, city) {
    const fLower = firstName.toLowerCase();
    const lLower = lastName.toLowerCase();
    // Priority 1: first + last + city
    if (city) {
      const m = players.find(p => { const n = (p.displayName||'').toLowerCase(); return firstNameMatch(n, firstName) && n.includes(lLower) && cityMatch(p.location, city); });
      if (m) return m;
    }
    // Priority 2: first + last name (any location)
    const m2 = players.find(p => { const n = (p.displayName||'').toLowerCase(); return firstNameMatch(n, firstName) && n.includes(lLower); });
    if (m2) return m2;
    // No match found - return null (don't match on last name only)
    return null;
  }

  function cityMatch(utrLoc, ustaCity) {
    if (!ustaCity || !utrLoc) return false;
    const loc = utrLoc.toLowerCase(), city = ustaCity.toLowerCase();
    if (loc.includes(city)) return true;
    if (city.includes(loc.split(',')[0].trim())) return true;
    for (const w of city.split(/\s+/)) { if (w.length >= 4 && loc.includes(w)) return true; }
    return false;
  }

  function extractUstaId(link) { const m = link.href.match(/id=(\d+)/i); return m ? m[1] : ''; }

  function fmtRating(val, source) {
    if (val === null || val === undefined) return '—';
    const num = Number(val);
    if (isNaN(num)) return val;
    if (num % 1 === 0 && source === 'profile') return num + '.xx';
    return num.toFixed(2);
  }

  const allLinks = Array.from(document.querySelectorAll('a')).filter(a =>
    a.href.toLowerCase().includes('playermatches') && a.textContent.trim().includes(',')
  );

  // --- Player Profile Page ---
  if (isPlayerPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const ustaId = urlParams.get('id');
    if (!ustaId) return;

    const boldEls = document.querySelectorAll('b, strong, h1, h2, h3');
    let nameElement = null, firstName = '', lastName = '';
    for (const el of boldEls) {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      if (text.length > 3 && text.length < 40 && /^[A-Za-z]+ [A-Za-z]+/.test(text) && !text.includes(',') && !text.includes('/')) {
        const words = text.split(' ').filter(w => w.length > 0);
        if (words.length >= 2) { nameElement = el; firstName = words[0]; lastName = words[words.length - 1]; break; }
      }
    }
    if (!nameElement) return;

    const searchName = `${firstName} ${lastName}`.trim();
    const cacheData = await chrome.storage.local.get('utrPlayerCache');
    const playerCache = cacheData.utrPlayerCache || {};
    let utrId = playerCache[ustaId]?.utrId || '';

    const badge = document.createElement('span'); badge.textContent = ' ...'; badge.style.color = '#999'; nameElement.appendChild(badge);
    try {
      let rr;
      if (utrId) { rr = await chrome.runtime.sendMessage({ type: 'UTR_RATING', playerId: utrId }); }
      else {
        const sr = await chrome.runtime.sendMessage({ type: 'UTR_SEARCH', name: searchName, city: '' });
        if (!sr.players || sr.players.length === 0) { badge.textContent = ''; return; }
        const best = bestMatch(sr.players, firstName, lastName, '');
        if (!best) { badge.textContent = ''; return; }
        utrId = best.id;
        rr = await chrome.runtime.sendMessage({ type: 'UTR_RATING', playerId: best.id });
      }
      if (rr.error) { badge.textContent = ''; return; }
      const url = rr.profileUrl || `https://app.utrsports.net/profiles/${utrId}`;
      badge.innerHTML = ` <a href="${url}" target="_blank" class="utr-rating" title="UTR Profile">[S:${fmtRating(rr.singles, rr.source)} / D:${fmtRating(rr.doubles, rr.source)}]</a>`;
    } catch (err) { badge.textContent = ''; }
    return;
  }

  if (allLinks.length === 0) return;
  console.log('[UTR] Found', allLinks.length, 'player links');

  const cacheData = await chrome.storage.local.get('utrPlayerCache');
  const playerCache = cacheData.utrPlayerCache || {};
  console.log('[UTR] Cache loaded:', Object.keys(playerCache).length, 'players');

  let players = [];
  let rosterTable = null;

  if (isRosterPage) {
    let maxLinks = 0;
    for (const table of document.querySelectorAll('table')) { const n = allLinks.filter(l => table.contains(l)).length; if (n > maxLinks) { maxLinks = n; rosterTable = table; } }
    if (rosterTable) { for (const inner of rosterTable.querySelectorAll('table')) { if (allLinks.filter(l => inner.contains(l)).length >= maxLinks * 0.8) rosterTable = inner; } }
    if (!rosterTable) return;

    const playerLinks = allLinks.filter(l => rosterTable.contains(l));
    let RATING_COL = 3;
    const sample = playerLinks[0]?.closest('tr');
    if (sample) { const cells = sample.querySelectorAll('td'); for (let i = 0; i < cells.length; i++) { if (/^\d\.\d[CS]?$/.test(cells[i].textContent.trim())) { RATING_COL = i; break; } } }

    for (const row of rosterTable.querySelectorAll('tr')) {
      const cells = Array.from(row.querySelectorAll('td, th'));
      if (cells.length <= RATING_COL) continue;
      const ratingCell = cells[RATING_COL];
      const newCell = document.createElement('td');
      const bgColor = ratingCell.getAttribute('bgcolor') || '';
      if (bgColor) newCell.setAttribute('bgcolor', bgColor);
      const playerLink = playerLinks.find(l => row.contains(l));
      if (!playerLink) { newCell.className = 'utr-header-cell'; newCell.textContent = 'UTR'; newCell.setAttribute('align','center'); ratingCell.after(newCell); }
      else {
        newCell.className = 'utr-cell'; newCell.setAttribute('align','center'); newCell.setAttribute('nowrap','');
        newCell.innerHTML = '<span class="utr-badge utr-loading">...</span>';
        ratingCell.after(newCell);
        const rawName = playerLink.textContent.trim();
        const parts = rawName.split(',').map(s => s.trim());
        players.push({ firstName: parts[1]||'', lastName: parts[0]||'', city: cells[1]?cells[1].textContent.trim():'', ustaId: extractUstaId(playerLink), cachedUtrId:'', cachedProfileUrl:'', element: newCell, mode: 'column' });
      }
    }
  } else {
    const seen = new Set();
    for (const link of allLinks) {
      if (seen.has(link.href)) continue; seen.add(link.href);
      const rawName = link.textContent.trim();
      const parts = rawName.split(',').map(s => s.trim());
      const ustaId = extractUstaId(link);
      let city = '', cachedUtrId = '', cachedProfileUrl = '';
      if (ustaId && playerCache[ustaId]) { city = playerCache[ustaId].city||''; cachedUtrId = playerCache[ustaId].utrId||''; cachedProfileUrl = playerCache[ustaId].profileUrl||''; }
      const badge = document.createElement('span'); badge.textContent = ' ...'; badge.style.color = '#999'; link.after(badge);
      players.push({ firstName: parts[1]||'', lastName: parts[0]||'', city, ustaId, cachedUtrId, cachedProfileUrl, element: badge, mode: 'inline' });
    }
  }

  console.log('[UTR] Processing', players.length, 'players');
  const newCacheEntries = {};

  await Promise.all(players.map(async (player) => {
    const { firstName, lastName, city, ustaId, cachedUtrId, cachedProfileUrl, element, mode: pMode } = player;
    const searchName = `${firstName} ${lastName}`.trim();
    try {
      let rr, matchInfo = '';
      if (cachedUtrId) {
        rr = await chrome.runtime.sendMessage({ type: 'UTR_RATING', playerId: cachedUtrId });
        matchInfo = 'cached';
      } else {
        let sr = await chrome.runtime.sendMessage({ type: 'UTR_SEARCH', name: searchName, city: city });
        if ((!sr.players || sr.players.length === 0) && lastName) {
          sr = await chrome.runtime.sendMessage({ type: 'UTR_SEARCH', name: lastName, city: city });
        }
        if (sr.error || !sr.players || sr.players.length === 0) { element.innerHTML = pMode==='column'?'<span style="color:#999">—</span>':''; return; }
        const best = bestMatch(sr.players, firstName, lastName, city);
        if (!best) { element.innerHTML = pMode==='column'?'<span style="color:#999">—</span>':''; return; }
        matchInfo = `${best.displayName} (${best.location})`;
        rr = await chrome.runtime.sendMessage({ type: 'UTR_RATING', playerId: best.id });
        if (ustaId && isRosterPage) { newCacheEntries[ustaId] = { city, utrId: String(best.id), profileUrl: `https://app.utrsports.net/profiles/${best.id}` }; }
      }
      if (rr.error) { element.innerHTML = pMode==='column'?'<span style="color:#e65100">⚠️</span>':''; return; }
      const url = cachedProfileUrl || rr.profileUrl;
      const sVal = fmtRating(rr.singles, rr.source);
      const dVal = fmtRating(rr.doubles, rr.source);
      if (pMode === 'column') { element.innerHTML = `<a href="${url}" target="_blank" class="utr-rating" title="${matchInfo}">S:${sVal} / D:${dVal}</a>`; }
      else { element.innerHTML = ` <a href="${url}" target="_blank" class="utr-rating" title="${matchInfo}">[S:${sVal} / D:${dVal}]</a>`; }
    } catch (err) { element.innerHTML = ''; }
  }));

  if (isRosterPage && Object.keys(newCacheEntries).length > 0) {
    const merged = { ...playerCache, ...newCacheEntries };
    await chrome.storage.local.set({ utrPlayerCache: merged });
    console.log('[UTR] Cached', Object.keys(merged).length, 'total (new:', Object.keys(newCacheEntries).length, ')');
  }
  console.log('[UTR] Done!');
})();
