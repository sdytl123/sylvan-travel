const SHEET_ID = '1uBCdye6d8KCL2x7Q2ZJQUhSJqodEsfDc-ex5LsFF-1Y';

const getSheetUrl = (tabName) => {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
};

// A simple, robust native CSV parser that handles basic quoting
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Basic CSV splitting (works for most Google Sheets exports)
    const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const record = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    result.push(record);
  }
  return result;
}

export async function getSheetData(tabName) {
  try {
    const response = await fetch(getSheetUrl(tabName));
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching ${tabName} sheet:`, error);
    return [];
  }
}

export async function getCountries() {
  return await getSheetData('Countries');
}

export async function getCities(countryId) {
  const allCities = await getSheetData('Cities');
  if (!countryId) return allCities;
  return allCities.filter(city => city.country_id === countryId);
}

export async function getRoutes(cityId) {
  const allRoutes = await getSheetData('Routes');
  if (!cityId) return allRoutes;
  return allRoutes.filter(route => route.city_id === cityId);
}
