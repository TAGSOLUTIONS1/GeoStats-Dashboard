// UAE Administrative Divisions Data
// Based on the 7 emirates of UAE and their major areas/districts

// GeoJSON boundaries for UAE emirates (simplified polygons)
export const uaeEmiratesGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Abu Dhabi",
        "emirateId": "abu-dhabi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [51.0, 24.5],
          [55.0, 24.5],
          [55.0, 22.5],
          [51.0, 22.5],
          [51.0, 24.5]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Dubai",
        "emirateId": "dubai"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [54.5, 25.4],
          [55.5, 25.4],
          [55.5, 24.7],
          [54.5, 24.7],
          [54.5, 25.4]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Sharjah",
        "emirateId": "sharjah"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [55.0, 25.8],
          [56.0, 25.8],
          [56.0, 24.8],
          [55.0, 24.8],
          [55.0, 25.8]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Ajman",
        "emirateId": "ajman"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [55.3, 25.8],
          [55.8, 25.8],
          [55.8, 25.5],
          [55.3, 25.5],
          [55.3, 25.8]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Ras Al Khaimah",
        "emirateId": "ras-al-khaimah"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [55.5, 26.2],
          [56.5, 26.2],
          [56.5, 25.8],
          [55.5, 25.8],
          [55.5, 26.2]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Fujairah",
        "emirateId": "fujairah"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [55.8, 25.6],
          [56.8, 25.6],
          [56.8, 24.6],
          [55.8, 24.6],
          [55.8, 25.6]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Umm Al Quwain",
        "emirateId": "umm-al-quwain"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [55.5, 26.0],
          [56.0, 26.0],
          [56.0, 25.6],
          [55.5, 25.6],
          [55.5, 26.0]
        ]]
      }
    }
  ]
};

export const uaeEmirates = {
  "abu-dhabi": {
    id: "abu-dhabi",
    name: "Abu Dhabi",
    nameAr: "أبو ظبي",
    coordinates: [54.3773, 24.2992],
    areas: [
      { id: "abu-dhabi-city", name: "Abu Dhabi City", coordinates: [54.3773, 24.2992] },
      { id: "al-ain", name: "Al Ain", coordinates: [55.7606, 24.2075] },
      { id: "al-dhafra", name: "Al Dhafra", coordinates: [54.0, 24.0] },
      { id: "liwa", name: "Liwa", coordinates: [53.5, 23.0] },
      { id: "ruwais", name: "Ruwais", coordinates: [52.73, 24.11] }
    ]
  },
  "dubai": {
    id: "dubai",
    name: "Dubai",
    nameAr: "دبي",
    coordinates: [55.2708, 25.2048],
    areas: [
      { id: "downtown-dubai", name: "Downtown Dubai", coordinates: [55.2708, 25.2048] },
      { id: "jumeirah", name: "Jumeirah", coordinates: [55.2667, 25.2167] },
      { id: "deira", name: "Deira", coordinates: [55.3333, 25.2667] },
      { id: "bur-dubai", name: "Bur Dubai", coordinates: [55.2833, 25.25] },
      { id: "marina", name: "Dubai Marina", coordinates: [55.1394, 25.0772] },
      { id: "jbr", name: "JBR", coordinates: [55.1294, 25.0672] },
      { id: "business-bay", name: "Business Bay", coordinates: [55.2708, 25.1948] },
      { id: "dubai-hills", name: "Dubai Hills", coordinates: [55.2048, 25.1148] }
    ]
  },
  "sharjah": {
    id: "sharjah",
    name: "Sharjah",
    nameAr: "الشارقة",
    coordinates: [55.4033, 25.3573],
    areas: [
      { id: "sharjah-city", name: "Sharjah City", coordinates: [55.4033, 25.3573] },
      { id: "al-khan", name: "Al Khan", coordinates: [55.3833, 25.3667] },
      { id: "al-majaz", name: "Al Majaz", coordinates: [55.3833, 25.3667] },
      { id: "al-qasba", name: "Al Qasba", coordinates: [55.3833, 25.3667] },
      { id: "al-nahda", name: "Al Nahda", coordinates: [55.3833, 25.3667] }
    ]
  },
  "ajman": {
    id: "ajman",
    name: "Ajman",
    nameAr: "عجمان",
    coordinates: [55.5136, 25.4052],
    areas: [
      { id: "ajman-city", name: "Ajman City", coordinates: [55.5136, 25.4052] },
      { id: "al-nuaimiya", name: "Al Nuaimiya", coordinates: [55.5136, 25.4052] },
      { id: "al-rawda", name: "Al Rawda", coordinates: [55.5136, 25.4052] }
    ]
  },
  "ras-al-khaimah": {
    id: "ras-al-khaimah",
    name: "Ras Al Khaimah",
    nameAr: "رأس الخيمة",
    coordinates: [55.9432, 25.7895],
    areas: [
      { id: "rak-city", name: "Ras Al Khaimah City", coordinates: [55.9432, 25.7895] },
      { id: "al-jazeerah-al-hamra", name: "Al Jazeerah Al Hamra", coordinates: [55.7833, 25.7167] },
      { id: "al-marjan-island", name: "Al Marjan Island", coordinates: [55.7833, 25.7167] }
    ]
  },
  "fujairah": {
    id: "fujairah",
    name: "Fujairah",
    nameAr: "الفجيرة",
    coordinates: [56.3264, 25.1288],
    areas: [
      { id: "fujairah-city", name: "Fujairah City", coordinates: [56.3264, 25.1288] },
      { id: "dibba", name: "Dibba", coordinates: [56.2667, 25.5833] },
      { id: "khor-fakkan", name: "Khor Fakkan", coordinates: [56.3333, 25.3333] }
    ]
  },
  "umm-al-quwain": {
    id: "umm-al-quwain",
    name: "Umm Al Quwain",
    nameAr: "أم القيوين",
    coordinates: [55.7833, 25.5667],
    areas: [
      { id: "uaq-city", name: "Umm Al Quwain City", coordinates: [55.7833, 25.5667] },
      { id: "al-riyadh", name: "Al Riyadh", coordinates: [55.7833, 25.5667] }
    ]
  }
};

// Sample data points for UAE
export const uaeDataPoints = [
  {
    coordinates: [55.2708, 25.2048],
    properties: {
      title: 'Dubai',
      emirate: 'Dubai',
      area: 'Downtown Dubai',
      dataPoint: 'For Sale Inventory',
      value: 2450
    }
  },
  {
    coordinates: [54.3773, 24.2992],
    properties: {
      title: 'Abu Dhabi',
      emirate: 'Abu Dhabi',
      area: 'Abu Dhabi City',
      dataPoint: 'For Sale Inventory',
      value: 1890
    }
  },
  {
    coordinates: [55.4033, 25.3573],
    properties: {
      title: 'Sharjah',
      emirate: 'Sharjah',
      area: 'Sharjah City',
      dataPoint: 'For Sale Inventory',
      value: 1560
    }
  },
  {
    coordinates: [55.5136, 25.4052],
    properties: {
      title: 'Ajman',
      emirate: 'Ajman',
      area: 'Ajman City',
      dataPoint: 'For Sale Inventory',
      value: 890
    }
  },
  {
    coordinates: [55.9432, 25.7895],
    properties: {
      title: 'Ras Al Khaimah',
      emirate: 'Ras Al Khaimah',
      area: 'Ras Al Khaimah City',
      dataPoint: 'For Sale Inventory',
      value: 650
    }
  },
  {
    coordinates: [56.3264, 25.1288],
    properties: {
      title: 'Fujairah',
      emirate: 'Fujairah',
      area: 'Fujairah City',
      dataPoint: 'For Sale Inventory',
      value: 420
    }
  },
  {
    coordinates: [55.7833, 25.5667],
    properties: {
      title: 'Umm Al Quwain',
      emirate: 'Umm Al Quwain',
      area: 'Umm Al Quwain City',
      dataPoint: 'For Sale Inventory',
      value: 280
    }
  }
];

// Geographic level options for UAE
export const uaeFilterOptions = ['Emirate', 'Area', 'District'];

// Helper functions
export const getEmirateById = (id) => uaeEmirates[id];
export const getAreaById = (emirateId, areaId) => {
  const emirate = uaeEmirates[emirateId];
  return emirate ? emirate.areas.find(area => area.id === areaId) : null;
};
export const getAllAreas = () => {
  const allAreas = [];
  Object.values(uaeEmirates).forEach(emirate => {
    allAreas.push(...emirate.areas.map(area => ({
      ...area,
      emirateId: emirate.id,
      emirateName: emirate.name
    })));
  });
  return allAreas;
};