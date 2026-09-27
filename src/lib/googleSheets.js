const SHEET_ID = '1uBCdye6d8KCL2x7Q2ZJQUhSJqodEsfDc-ex5LsFF-1Y';

const getSheetUrl = (tabName) => {
  const timestamp = new Date().getTime();
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&cachebuster=${timestamp}`;
};

export function parseCSV(text) {
 const rows = []; let row = [], value = '', quoted = false;
 for (let i = 0; i < text.length; i++) {
  const c = text[i];
  if (c === '"') { if (quoted && text[i+1] === '"') { value += '"'; i++; } else quoted = !quoted; }
  else if (c === ',' && !quoted) { row.push(value.trim()); value = ''; }
  else if ((c === '\n' || c === '\r') && !quoted) { if(c === '\r' && text[i+1] === '\n') i++; row.push(value.trim()); rows.push(row); row=[]; value=''; }
  else value += c;
 }
 if(quoted) throw new Error('Unclosed CSV quote');
 row.push(value.trim()); rows.push(row);
 const headers = rows.shift() || [];
 return rows.filter(row => row.some(Boolean)).map(row => Object.fromEntries(headers.flatMap((h,i) => h ? [[h.replace(/^\uFEFF/, ''), row[i] || '']] : [])));
}

export async function getSheetData(tabName) {
  try {
    const response = await fetch(getSheetUrl(tabName), {signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    if (/^\s*</.test(csvText)) throw new Error('Expected CSV, received HTML');
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching ${tabName} sheet:`, error);
    return [];
  }
}

export async function getCountries() {
  const rows = await getSheetData('Countries');
  if (!rows.length) throw new Error('Countries data unavailable');
  return rows.filter(row => row.country_id).map(row => ({...row, country_name: row.country_name || (row.country_id === 'newzealand' ? '新西兰' : row.country_id)}));
}

export async function getActivities() {
  const rows = await getSheetData('activity');
  const activities = rows.filter(row => row.index_id === 'activities' && row.activity_id && row.activity_name);
  if (!activities.length) throw new Error('activity sheet has no valid activities');
  const ids = new Set();
  for (const activity of activities) {
    if (ids.has(activity.activity_id)) throw new Error(`Duplicate activity_id: ${activity.activity_id}`);
    ids.add(activity.activity_id);
  }
  return activities;
}

export async function getCities(countryId) {
  const allCities = (await getSheetData('Cities')).filter(row => row.city_id && row.country_id);
  if (!allCities.length) throw new Error('Cities data unavailable');
  if (!countryId) return allCities;
  return allCities.filter(city => city.country_id === countryId);
}

export async function getRoutes(cityId) {
  const allRoutes = await getSheetData('Routes');
  if (!cityId) return allRoutes;
  return allRoutes.filter(route => route.city_id.replace(/[‘’]/g, "'") === cityId.replace(/[‘’]/g, "'"));
}
