const SHEET_ID = '1uBCdye6d8KCL2x7Q2ZJQUhSJqodEsfDc-ex5LsFF-1Y';

const getSheetUrl = (tabName) => {
  const timestamp = new Date().getTime();
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&cachebuster=${timestamp}`;
};

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record = {};
    headers.forEach((header, index) => {
      let val = values[index] || '';
      // 清洗链接：移除可能存在的引号、空格或不可见字符
      val = val.replace(/^"|"$/g, '').trim();
      record[header] = val;
    });
    result.push(record);
  }
  return result;
}

export async function getSheetData(tabName) {
  try {
    const response = await fetch(getSheetUrl(tabName));
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
