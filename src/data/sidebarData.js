import { 
  Home,
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
} from 'lucide-react';

export const dataPoints = [
  {
    id: 'population-2019',
    label: 'Population 2019',
    icon: Users,
    isSelected: true,
    isPremium: false,
    description: 'Total population count for the Dubai community in 2019.',
    source: 'Dubai Statistics Center'
  },
  {
    id: 'population-2018',
    label: 'Population 2018',
    icon: Users,
    isSelected: false,
    isPremium: false,
    description: 'Total population count for the Dubai community in 2018.',
    source: 'Dubai Statistics Center'
  },
  {
    id: 'population-growth',
    label: 'Population Growth',
    icon: TrendingUp,
    isSelected: false,
    isPremium: false,
    description: 'Year-over-year population growth rate from 2018 to 2019.',
    source: 'Dubai Statistics Center'
  },
  {
    id: 'area-sq-km',
    label: 'Area (km²)',
    icon: BarChart3,
    isSelected: false,
    isPremium: false,
    description: 'Total area of the Dubai community in square kilometers.',
    source: 'Dubai Statistics Center'
  },
  {
    id: 'population-density',
    label: 'Population Density',
    icon: BarChart3,
    isSelected: false,
    isPremium: true,
    description: 'Population density calculated as population per square kilometer.',
    source: 'Dubai Statistics Center'
  },
  {
    id: 'sector',
    label: 'Sector',
    icon: Home,
    isSelected: false,
    isPremium: true,
    description: 'Administrative sector classification for the Dubai community.',
    source: 'Dubai Statistics Center'
  },
  {
    id: 'community-number',
    label: 'Community Number',
    icon: BarChart3,
    isSelected: false,
    isPremium: true,
    description: 'Unique identifier number for the Dubai community.',
    source: 'Dubai Statistics Center'
  }
];

export const dataSections = [
  {
    id: 'popular-data',
    label: 'Popular Data',
    isExpanded: true,
    items: [
      dataPoints[0], // Population 2019
      dataPoints[1], // Population 2018
      dataPoints[2], // Population Growth
      dataPoints[3], // Area (km²)
    ]
  },
  {
    id: 'demographic',
    label: 'Demographic',
    isExpanded: false,
    items: [
      dataPoints[0], // Population 2019
      dataPoints[1], // Population 2018
      dataPoints[2], // Population Growth
      dataPoints[4], // Population Density
    ]
  },
  {
    id: 'geographic',
    label: 'Geographic',
    isExpanded: false,
    items: [
      dataPoints[3], // Area (km²)
      dataPoints[4], // Population Density
      dataPoints[5], // Sector
    ]
  },
  {
    id: 'administrative',
    label: 'Administrative',
    isExpanded: false,
    items: [
      dataPoints[5], // Sector
      dataPoints[6], // Community Number
    ]
  }
];