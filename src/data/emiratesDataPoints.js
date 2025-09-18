const uaeData = [
    {
      id: "AE-01",
      name: "Abu Dhabi",
      capital: "Abu Dhabi City",
      area_km2: 67340,
      population: 3200000,
      coordinates: [54.3773, 24.4539],
      cities: [
        {
          id: "AE-01-001",
          name: "Abu Dhabi City",
          population: 1600000,
          coordinates: [54.3773, 24.4539],
          areas: [
            { id: "AE-01-001-01", name: "Downtown Abu Dhabi", population: 250000, postal: "P.O. Box 00001-19999" },
            { id: "AE-01-001-02", name: "Al Reem Island", population: 130000, postal: "P.O. Box 20000-29999" },
            { id: "AE-01-001-03", name: "Al Khalidiyah", population: 100000, postal: "P.O. Box 30000-39999" }
          ]
        },
        {
          id: "AE-01-002",
          name: "Al Ain",
          population: 766000,
          coordinates: [55.7649, 24.2075],
          areas: [
            { id: "AE-01-002-01", name: "Central District", population: 150000 },
            { id: "AE-01-002-02", name: "Al Jimi", population: 80000 }
          ]
        },
        {
          id: "AE-01-003",
          name: "Madinat Zayed",
          population: 60000,
          coordinates: [53.6515, 23.6545],
          areas: []
        }
      ]
    },
    {
      id: "AE-02",
      name: "Dubai",
      capital: "Dubai",
      area_km2: 4114,
      population: 3500000,
      coordinates: [55.2962, 25.2769],
      cities: [
        {
          id: "AE-02-001",
          name: "Dubai City",
          population: 3500000,
          coordinates: [55.2962, 25.2769],
          areas: [
            { id: "AE-02-001-01", name: "Deira", population: 500000, postal: "P.O. Box 10000-19999" },
            { id: "AE-02-001-02", name: "Bur Dubai", population: 400000, postal: "P.O. Box 20000-29999" },
            { id: "AE-02-001-03", name: "Jumeirah", population: 150000, postal: "P.O. Box 30000-39999" },
            { id: "AE-02-001-04", name: "Dubai Marina", population: 120000, postal: "P.O. Box 40000-49999" },
            { id: "AE-02-001-05", name: "Downtown Dubai", population: 180000, postal: "P.O. Box 50000-59999" }
          ]
        }
      ]
    },
    {
      id: "AE-03",
      name: "Sharjah",
      capital: "Sharjah City",
      area_km2: 2590,
      population: 1600000,
      coordinates: [55.4038, 25.3573],
      cities: [
        {
          id: "AE-03-001",
          name: "Sharjah City",
          population: 1400000,
          coordinates: [55.4038, 25.3573],
          areas: [
            { id: "AE-03-001-01", name: "Al Nahda", population: 120000 },
            { id: "AE-03-001-02", name: "Al Majaz", population: 100000 }
          ]
        },
        {
          id: "AE-03-002",
          name: "Khor Fakkan",
          population: 30000,
          coordinates: [56.3480, 25.3319],
          areas: []
        }
      ]
    },
    {
      id: "AE-04",
      name: "Ajman",
      capital: "Ajman City",
      area_km2: 260,
      population: 500000,
      coordinates: [55.5136, 25.4052],
      cities: [
        {
          id: "AE-04-001",
          name: "Ajman City",
          population: 500000,
          coordinates: [55.5136, 25.4052],
          areas: [
            { id: "AE-04-001-01", name: "Al Rashidiya", population: 80000 },
            { id: "AE-04-001-02", name: "Al Nuaimiya", population: 60000 }
          ]
        }
      ]
    },
    {
      id: "AE-05",
      name: "Umm Al Quwain",
      capital: "UAQ City",
      area_km2: 777,
      population: 70000,
      coordinates: [55.5633, 25.5610],
      cities: [
        {
          id: "AE-05-001",
          name: "UAQ City",
          population: 70000,
          coordinates: [55.5633, 25.5610],
          areas: []
        }
      ]
    },
    {
      id: "AE-06",
      name: "Ras Al Khaimah",
      capital: "RAK City",
      area_km2: 1684,
      population: 400000,
      coordinates: [55.9411, 25.8007],
      cities: [
        {
          id: "AE-06-001",
          name: "RAK City",
          population: 300000,
          coordinates: [55.9411, 25.8007],
          areas: [
            { id: "AE-06-001-01", name: "Al Nakheel", population: 60000 }
          ]
        }
      ]
    },
    {
      id: "AE-07",
      name: "Fujairah",
      capital: "Fujairah City",
      area_km2: 1165,
      population: 150000,
      coordinates: [56.3349, 25.1288],
      cities: [
        {
          id: "AE-07-001",
          name: "Fujairah City",
          population: 100000,
          coordinates: [56.3349, 25.1288],
          areas: [
            { id: "AE-07-001-01", name: "Dibba", population: 30000 }
          ]
        }
      ]
    }
  ];

// Transform the data for map usage
const emiratesDataPoints = uaeData.map(emirate => ({
  coordinates: emirate.coordinates,
  properties: {
    title: emirate.name,
    emirate: emirate.name,
    dataPoint: 'For Sale Inventory',
    value: Math.floor(emirate.population * 0.1), // Rough estimate of properties
    population: emirate.population,
    area: emirate.area_km2,
    capital: emirate.capital,
    cities: emirate.cities.length
  }
}));

// Add city-level data points
const cityDataPoints = uaeData.flatMap(emirate => 
  emirate.cities.map(city => ({
    coordinates: city.coordinates,
    properties: {
      title: city.name,
      emirate: emirate.name,
      dataPoint: 'For Sale Inventory',
      value: Math.floor(city.population * 0.08), // Rough estimate of properties
      population: city.population,
      type: 'city'
    }
  }))
);

// Add area-level data points for major areas
const areaDataPoints = uaeData.flatMap(emirate => 
  emirate.cities.flatMap(city => 
    city.areas.map(area => ({
      coordinates: city.coordinates, // Use city coordinates for areas
      properties: {
        title: area.name,
        emirate: emirate.name,
        city: city.name,
        dataPoint: 'For Sale Inventory',
        value: Math.floor(area.population * 0.06), // Rough estimate of properties
        population: area.population,
        type: 'area',
        postal: area.postal || null
      }
    }))
  )
);

export { uaeData, emiratesDataPoints, cityDataPoints, areaDataPoints };