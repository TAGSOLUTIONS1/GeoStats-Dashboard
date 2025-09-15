import { 
  Home,
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  Crown
} from 'lucide-react';

export const dataPoints = [
  {
    id: 'home-value',
    label: 'Home Value',
    icon: Home,
    isSelected: true,
    isPremium: false,
    description: 'The estimated value of residential properties in the area based on recent sales data and market trends.'
  },
  {
    id: 'home-value-growth-yoy',
    label: 'Home Value Growth (YoY)',
    icon: TrendingUp,
    isSelected: false,
    isPremium: false,
    description: 'Year-over-year percentage change in home values, indicating market growth trends.'
  },
  {
    id: 'for-sale-inventory',
    label: 'For Sale Inventory',
    icon: BarChart3,
    isSelected: false,
    isPremium: false,
    description: 'The number of active listings on the market for sale in the area in a given month as determined by Realtor.com.'
  },
  {
    id: 'home-price-forecast',
    label: 'Home Price Forecast',
    icon: TrendingUp,
    isSelected: false,
    isPremium: false,
    description: 'Projected future home price movements based on current market conditions and economic indicators.'
  },
  {
    id: 'long-term-growth-score',
    label: 'Long-Term Growth Score',
    icon: BarChart3,
    isSelected: false,
    isPremium: true,
    description: 'A comprehensive score predicting long-term property value growth potential based on multiple factors.'
  },
  {
    id: 'home-value-growth-5year',
    label: 'Home Value Growth (5-Year)',
    icon: TrendingUp,
    isSelected: false,
    isPremium: true,
    description: 'Five-year compound annual growth rate of home values in the area.'
  },
  {
    id: 'overvalued-percent',
    label: 'Overvalued %',
    icon: DollarSign,
    isSelected: false,
    isPremium: true,
    description: 'Percentage by which current home prices exceed their fundamental value based on economic indicators.'
  },
  {
    id: 'price-cut-percent',
    label: 'Price Cut %',
    icon: DollarSign,
    isSelected: false,
    isPremium: true,
    description: 'Percentage of listings that have had their prices reduced from the original listing price.'
  },
  {
    id: 'population-growth',
    label: 'Population Growth',
    icon: Users,
    isSelected: false,
    isPremium: true,
    description: 'Annual percentage change in population, indicating demographic trends affecting housing demand.'
  },
  {
    id: 'cap-rate',
    label: 'Cap Rate',
    icon: BarChart3,
    isSelected: false,
    isPremium: true,
    description: 'Capitalization rate - the ratio of net operating income to property value, used in real estate investment analysis.'
  }
];

export const dataSections = [
  {
    id: 'popular-data',
    label: 'Popular Data',
    isExpanded: true,
    items: [
      dataPoints[0], // Home Value
      dataPoints[1], // Home Value Growth (YoY)
      dataPoints[2], // For Sale Inventory
      dataPoints[3], // Home Price Forecast
    ]
  },
  {
    id: 'home-price-affordability',
    label: 'Home Price & Affordability',
    isExpanded: false,
    items: [
      dataPoints[0], // Home Value
      dataPoints[1], // Home Value Growth (YoY)
      dataPoints[5], // Home Value Growth (5-Year)
      dataPoints[6], // Overvalued %
    ]
  },
  {
    id: 'market-trends',
    label: 'Market Trends',
    isExpanded: false,
    items: [
      dataPoints[2], // For Sale Inventory
      dataPoints[3], // Home Price Forecast
      dataPoints[7], // Price Cut %
      {
        id: 'sale-inventory-growth-yoy',
        label: 'Sale Inventory Growth (YoY)',
        icon: TrendingUp,
        isSelected: false,
        isPremium: false,
        description: 'The year-over-year growth rate in the area\'s For Sale Inventory according to Realtor.com. If an area has big inventory increases, it could mean greater likelihood of home price declines, while sharply lower inventory could mean that home prices will continue to go up.'
      }
    ]
  },
  {
    id: 'demographic',
    label: 'Demographic',
    isExpanded: false,
    items: [
      dataPoints[8], // Population Growth
    ]
  },
  {
    id: 'investor-metrics',
    label: 'Investor Metrics',
    isExpanded: false,
    items: [
      dataPoints[4], // Long-Term Growth Score
      dataPoints[9], // Cap Rate
    ]
  }
];