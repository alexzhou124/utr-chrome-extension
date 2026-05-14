
const DEFAULT_PIN = '37.4,-122.0';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UTR_SEARCH') {
    fetchUTRSearch(request.name, request.city).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (request.type === 'UTR_RATING') {
    fetchUTRRating(request.playerId).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

async function fetchUTRSearch(name, city) {
  let url = `https://api.utrsports.net/v2/search/players?query=${encodeURIComponent(name)}&top=50&skip=0&searchOrigin=searchPage&showTennisContent=true&showPickleballContent=true`;
  url += `&pin=${encodeURIComponent(DEFAULT_PIN)}&distance=100mi&utrType=verified&utrTeamType=singles`;

  const resp = await fetch(url, { credentials: 'include' });
  if (!resp.ok) return { error: `Search failed (${resp.status})` };
  const data = await resp.json();
  const hits = data.hits || data.players || [];
  if (!hits || hits.length === 0) {
    // Retry without location
    const url2 = `https://api.utrsports.net/v2/search/players?query=${encodeURIComponent(name)}&top=50&skip=0&searchOrigin=searchPage&showTennisContent=true&showPickleballContent=true`;
    const resp2 = await fetch(url2, { credentials: 'include' });
    if (!resp2.ok) return { error: 'not found', players: [] };
    const data2 = await resp2.json();
    const hits2 = data2.hits || data2.players || [];
    if (!hits2 || hits2.length === 0) return { error: 'not found', players: [] };
    return { players: hits2.map(h => { const s = h.source||h; return { id: s.id, displayName: s.displayName||`${s.firstName||''} ${s.lastName||''}`.trim(), location: s.location?.display||s.city||s.locationDisplay||'' }; }) };
  }
  return { players: hits.map(h => { const s = h.source||h; return { id: s.id, displayName: s.displayName||`${s.firstName||''} ${s.lastName||''}`.trim(), location: s.location?.display||s.city||s.locationDisplay||'' }; }) };
}

async function fetchUTRRating(playerId) {
  const rankResp = await fetch(`https://api.utrsports.net/rankings/v1/player/${playerId}`, { credentials: 'include' });
  if (rankResp.ok) {
    const data = await rankResp.json();
    if (data.success && data.data && data.data.rankings) {
      let singles = null, doubles = null;
      for (const r of data.data.rankings) {
        if (r.ratingType === 'SinglesTennis') singles = r.rating;
        if (r.ratingType === 'DoublesTennis') doubles = r.rating;
      }
      return { singles, doubles, profileUrl: data.data.profileUrl || `https://app.utrsports.net/profiles/${playerId}`, source: 'rankings' };
    }
  }
  const profResp = await fetch(`https://api.utrsports.net/v1/player/${playerId}/profile`, { credentials: 'include' });
  if (!profResp.ok) return { error: 'Both APIs failed' };
  const p = await profResp.json();
  return { singles: p.singlesUtr||null, doubles: p.doublesUtr||null, profileUrl: `https://app.utrsports.net/profiles/${playerId}`, source: 'profile' };
}
