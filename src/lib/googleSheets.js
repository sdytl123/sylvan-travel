import { parse } from 'csv-parse/sync';

const SHEET_ID = '1uBCdye6d8KCL2x7Q2ZJQUhSJqodEsfDc-ex5LsFF-1Y';

const getSheetUrl = (tabName) => {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
};

export async function getSheetData(tabName) {
  try {
    const response = await fetch(getSheetUrl(tabName));
    const csvText = await response.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records;
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
