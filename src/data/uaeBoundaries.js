// UAE Administrative Boundaries Data
// This includes the 7 Emirates and major cities

export const uaeEmirates = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Abu Dhabi",
        name_ar: "أبو ظبي",
        emirate: "Abu Dhabi",
        population: 3200000,
        area: 67340
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [50.0, 22.0], [56.0, 22.0], [56.0, 26.0], [50.0, 26.0], [50.0, 22.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Dubai",
        name_ar: "دبي",
        emirate: "Dubai",
        population: 3400000,
        area: 4114
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [55.0, 24.5], [56.0, 24.5], [56.0, 25.5], [55.0, 25.5], [55.0, 24.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sharjah",
        name_ar: "الشارقة",
        emirate: "Sharjah",
        population: 1800000,
        area: 2590
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [55.0, 24.0], [56.0, 24.0], [56.0, 25.0], [55.0, 25.0], [55.0, 24.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ajman",
        name_ar: "عجمان",
        emirate: "Ajman",
        population: 540000,
        area: 259
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [55.0, 24.5], [55.5, 24.5], [55.5, 25.0], [55.0, 25.0], [55.0, 24.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ras Al Khaimah",
        name_ar: "رأس الخيمة",
        emirate: "Ras Al Khaimah",
        population: 416000,
        area: 1684
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [55.5, 24.0], [56.5, 24.0], [56.5, 26.0], [55.5, 26.0], [55.5, 24.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Fujairah",
        name_ar: "الفجيرة",
        emirate: "Fujairah",
        population: 256000,
        area: 1166
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [56.0, 23.5], [56.5, 23.5], [56.5, 25.5], [56.0, 25.5], [56.0, 23.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Umm Al Quwain",
        name_ar: "أم القيوين",
        emirate: "Umm Al Quwain",
        population: 80000,
        area: 777
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [55.5, 24.0], [56.0, 24.0], [56.0, 25.0], [55.5, 25.0], [55.5, 24.0]
        ]]
      }
    }
  ]
};

export const uaeCities = {
  type: "FeatureCollection",
  features: [
    // Abu Dhabi Emirate Cities
    {
      type: "Feature",
      properties: {
        name: "Abu Dhabi City",
        emirate: "Abu Dhabi",
        population: 1500000,
        type: "Capital"
      },
      geometry: {
        type: "Point",
        coordinates: [54.3773, 24.4539]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Al Ain",
        emirate: "Abu Dhabi",
        population: 766000,
        type: "Major City"
      },
      geometry: {
        type: "Point",
        coordinates: [55.7606, 24.2075]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Liwa",
        emirate: "Abu Dhabi",
        population: 20000,
        type: "Town"
      },
      geometry: {
        type: "Point",
        coordinates: [53.8, 23.1]
      }
    },
    
    // Dubai Emirate Cities
    {
      type: "Feature",
      properties: {
        name: "Dubai City",
        emirate: "Dubai",
        population: 3400000,
        type: "Major City"
      },
      geometry: {
        type: "Point",
        coordinates: [55.2962, 25.2769]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Jebel Ali",
        emirate: "Dubai",
        population: 50000,
        type: "Industrial Area"
      },
      geometry: {
        type: "Point",
        coordinates: [55.0, 24.9]
      }
    },
    
    // Sharjah Emirate Cities
    {
      type: "Feature",
      properties: {
        name: "Sharjah City",
        emirate: "Sharjah",
        population: 1800000,
        type: "Major City"
      },
      geometry: {
        type: "Point",
        coordinates: [55.4033, 25.3573]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Khor Fakkan",
        emirate: "Sharjah",
        population: 35000,
        type: "Coastal City"
      },
      geometry: {
        type: "Point",
        coordinates: [56.3, 25.3]
      }
    },
    
    // Other Emirates
    {
      type: "Feature",
      properties: {
        name: "Ajman City",
        emirate: "Ajman",
        population: 540000,
        type: "City"
      },
      geometry: {
        type: "Point",
        coordinates: [55.5136, 25.4052]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ras Al Khaimah City",
        emirate: "Ras Al Khaimah",
        population: 416000,
        type: "City"
      },
      geometry: {
        type: "Point",
        coordinates: [55.9432, 25.7895]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Fujairah City",
        emirate: "Fujairah",
        population: 256000,
        type: "City"
      },
      geometry: {
        type: "Point",
        coordinates: [56.3264, 25.1288]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Umm Al Quwain City",
        emirate: "Umm Al Quwain",
        population: 80000,
        type: "City"
      },
      geometry: {
        type: "Point",
        coordinates: [55.7432, 25.5647]
      }
    }
  ]
};

export const boundaryLevels = [
  {
    id: 'emirates',
    name: 'Emirates',
    name_ar: 'الإمارات',
    description: 'Show the 7 Emirates of UAE',
    icon: '🏛️'
  },
  {
    id: 'cities',
    name: 'Cities',
    name_ar: 'المدن',
    description: 'Show major cities and towns',
    icon: '🏙️'
  },
  {
    id: 'areas',
    name: 'Areas',
    name_ar: 'المناطق',
    description: 'Show districts and areas',
    icon: '🏘️'
  },
  {
    id: 'zones',
    name: 'Zones',
    name_ar: 'المناطق',
    description: 'Show free zones and special areas',
    icon: '🏭'
  }
];

export const getBoundaryData = (level) => {
  switch (level) {
    case 'emirates':
      return uaeEmirates;
    case 'cities':
      return uaeCities;
    case 'areas':
      // For now, return cities as areas - in real implementation, you'd have specific area data
      return uaeCities;
    case 'zones':
      // For now, return cities as zones - in real implementation, you'd have specific zone data
      return uaeCities;
    default:
      return uaeEmirates;
  }
};