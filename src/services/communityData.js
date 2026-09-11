// Registry of every data point that can be painted on the community map.
// Each entry resolves to a COMM_NUM -> number lookup, so Map.jsx can merge the
// values onto the GeoJSON features and colour by them.
import greenSpace from '../data/osm/green-space.json';
import healthcare from '../data/osm/healthcare.json';
import transport from '../data/osm/transport.json';
import populationByCommunity from '../data/dsc/population-by-community.json';
import trafficSafety from '../data/dsc/traffic-safety.json';
import homeValue from '../data/dld18/home-value-by-community.json';
import ppsmByCommunity from '../data/amp/price-per-sqm-by-community.json';
import capRate from '../data/dldx/cap-rate.json';
import rentalRate from '../data/dldx/rental-rate.json';
import rentForHouses from '../data/dldx/rent-for-houses.json';
import priceToRent from '../data/dldx/price-to-rent.json';
import schoolQuality from '../data/osm/school-quality.json';
import jobDiversity from '../data/osm/job-diversity.json';
import walkability from '../data/osm/walkability.json';
import accessibility from '../data/osm/accessibility.json';
import rentPctIncome from '../data/dldx/rent-as-percent-of-income.json';
import longTermGrowth from '../data/composite/long-term-growth-score.json';
import medianListing from '../data/pf/median-listing-price.json';
import affordability from '../data/derived/affordability.json';
import schoolingCost from '../data/schools/schooling-cost-by-community.json';
import emergencyProximity from '../data/osm/emergency-proximity.json';
import livability from '../data/composite/livability-score.json';
import culturalDiversity from '../data/schools/cultural-diversity-index.json';
import communityFacilities from '../data/osm/community-facilities.json';
import youthFacilities from '../data/osm/youth-facilities.json';
import daysOnMarket from '../data/bayut/days-on-market.json';
import newListings from '../data/bayut/new-listings-count.json';
import mortgageRegs from '../data/dld/mortgage-registrations-by-community.json';
import affordableSales from '../data/dld/affordable-housing-units.json';
import familySized from '../data/dld/family-sized-homes.json';
import medianPriceYoY from '../data/dld/median-price-yoy.json';
import grossYield from '../data/dld/gross-rental-yield.json';
import rentGrowth from '../data/dld/rent-growth-yoy.json';
import freeholdShare from '../data/dld/freehold-share.json';
import leaseRenewal from '../data/dld/lease-renewal-rate.json';
import offplanGap from '../data/dld/offplan-price-gap.json';
import txLiquidity from '../data/dld/transaction-liquidity.json';
import maxDrawdown from '../data/dld/max-historical-drawdown.json';
import priceVsHistory from '../data/dld/price-vs-own-history.json';
import unitSize from '../data/dld/average-unit-size.json';
import corporateTenancy from '../data/dld/corporate-tenancy-share.json';
import valueIncome from '../data/derived/value-income.json';
import mtgPctIncome from '../data/derived/mtg-payments-income-percent.json';
import ownershipCost from '../data/derived/monthly-home-ownership-cost.json';
import overvalued from '../data/derived/overvalued-percent.json';
import forSaleInventory from '../data/pf/for-sale-inventory.json';
import affordabilityIndex from '../data/composite/affordability-index.json';
import marketHealth from '../data/composite/housing-market-health-score.json';
import schoolScore from '../data/composite/school-quality-score.json';
import economicHealth from '../data/composite/economic-health-score.json';
import neighborhoodAmenity from '../data/composite/neighborhood-quality-score.json';

const GREEN = ['#e8f5e9', '#c8e6c9', '#81c784', '#4caf50', '#2e7d32', '#1b5e20'];
// Safety is inverted: many incidents = bad, so the scale runs green -> red.
const SAFETY = ['#1b5e20', '#66bb6a', '#fff59d', '#ffb74d', '#e57373', '#b71c1c'];
const BLUE = ['#e3f2fd', '#bbdefb', '#64b5f6', '#2196f3', '#1565c0', '#0d47a1'];

export const mapDataPoints = {
  'green-space-per-capita': {
    dataset: greenSpace,
    property: 'GreenSpace_Per10k',
    metric: 'per10kPeople',
    labelDigits: 1,
    labelSuffix: '',
    label: 'Green spaces per 10k residents',
    stops: [0, 0.42, 1.81, 9.26, 31.7, 80],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'healthcare-accessibility-score': {
    dataset: healthcare,
    property: 'Healthcare_PerSqKm',
    metric: 'perSqKm',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Healthcare facilities per km²',
    stops: [0, 0.13, 0.32, 1.13, 4.4, 10.7],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'public-transportation-coverage': {
    dataset: transport,
    property: 'Transport_PerSqKm',
    metric: 'perSqKm',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Transit stops per km²',
    stops: [0, 0.11, 0.38, 1.52, 4.7, 10.6],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'population-growth': {
    dataset: populationByCommunity,
    property: 'PopGrowth_Cagr',
    metric: 'growthCagrPct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Population growth (annual %, 2011–2022)',
    stops: [-0.29, 2.46, 5.68, 16.1, 39.5, 80],
    palette: BLUE,
    source: 'Dubai Statistics Center',
  },
  'community-safety-score': {
    dataset: trafficSafety,
    property: 'Safety_IncidentsPer1k',
    metric: 'per1kPeople',
    labelDigits: 1,
    labelSuffix: '',
    label: 'Road incidents per 1k people (2023–25)',
    stops: [11.1, 21.6, 39.6, 58.6, 96.5, 217],
    palette: SAFETY,
    source: 'Dubai Traffic Incident Reports',
    inverted: true,
  },
  'emergency-services-response-time': {
    dataset: emergencyProximity,
    property: 'Emergency_AvgKm',
    metric: 'avgKm',
    labelDigits: 1,
    labelSuffix: ' km',
    label: 'Avg. distance to nearest fire station, police & hospital (km)',
    stops: [0.55, 1.46, 3.05, 5.32, 10.68, 68.7],
    palette: SAFETY,
    source: 'OpenStreetMap (Overpass, Sep 2026)',
    inverted: true,
  },
  'livability-score': {
    dataset: livability,
    property: 'Livability_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Livability score (0–100, percentile composite)',
    stops: [16.9, 42.4, 52.7, 61.9, 68.7, 84],
    palette: GREEN,
    source: 'Composite of 6 GeoStats layers (OSM, KHDA, Dubai Police)',
  },
  'days-on-market': {
    dataset: daysOnMarket,
    property: 'Listings_MedianDays',
    metric: 'medianDaysListed',
    labelDigits: 0,
    labelSuffix: ' days',
    label: 'Median days listed, active for-sale listings (Apr 2024)',
    stops: [9, 38, 44, 48, 51, 82],
    palette: SAFETY,
    source: 'Bayut listings snapshot, Apr 2024 (Hugging Face mirror)',
    inverted: true,
  },
  'new-listings-count': {
    dataset: newListings,
    property: 'Listings_New30d',
    metric: 'newListings30d',
    labelDigits: 0,
    labelSuffix: '',
    label: 'New for-sale listings in 30 days (Apr 2024)',
    stops: [3, 17, 57, 107, 264, 1130],
    palette: BLUE,
    source: 'Bayut listings snapshot, Apr 2024 (Hugging Face mirror)',
  },
  'mortgaged-home-percent': {
    dataset: mortgageRegs,
    property: 'Mortgage_Per100Sales',
    metric: 'mortgagesPer100Sales',
    labelDigits: 0,
    labelSuffix: ' /100',
    label: 'Mortgage registrations per 100 home sales (2023–24)',
    stops: [0, 5.5, 13.5, 20.6, 30.6, 100],
    palette: BLUE,
    source: 'DLD transactions 2023–Aug 2024 (Hugging Face mirror)',
  },
  'affordable-housing-units': {
    dataset: affordableSales,
    property: 'Affordable_SalesPct',
    metric: 'affordableSalesPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Residential sales at or below AED 1m (2019–2023)',
    stops: [0, 1.5, 9.1, 26.1, 59, 96.2],
    palette: GREEN,
    source: 'DLD transactions 2019–2023 (Kaggle mirror)',
  },
  'family-household-percent': {
    dataset: familySized,
    property: 'FamilySized_Pct',
    metric: 'familySizedPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Family-sized homes (3+ bedrooms) as a share of sales (2019–2023)',
    stops: [0, 6.6, 13.6, 24.9, 53.6, 100],
    palette: BLUE,
    source: 'DLD transactions 2019–2023 (Kaggle mirror)',
  },
  'median-listing-price-yoy': {
    dataset: medianPriceYoY,
    property: 'MedianPrice_YoYPct',
    metric: 'medianPriceYoYPct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Median transacted price change, 2023 vs 2022',
    stops: [-42, 3.1, 9.5, 15.9, 20, 78.4],
    palette: BLUE,
    source: 'DLD transactions, 2022 vs 2023 (Kaggle mirror)',
  },
  'gross-rental-yield': {
    dataset: grossYield,
    property: 'Gross_YieldPct',
    metric: 'grossYieldPct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Gross rental yield (registered rents vs registered sale prices)',
    stops: [0.71, 4.32, 5.19, 6.17, 8.79, 21.98],
    palette: GREEN,
    source: 'DLD Ejari contracts + DLD sales, 2021–2023 (Kaggle mirror)',
  },
  'rent-growth-yoy': {
    dataset: rentGrowth,
    property: 'Rent_GrowthPct',
    metric: 'rentGrowthPct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Median registered rent change, 2023 vs 2022',
    stops: [-10.5, 4.4, 8, 12.5, 16.7, 35.7],
    palette: BLUE,
    source: 'DLD Ejari contracts, 2022 vs 2023 (Kaggle mirror)',
  },
  'freehold-share': {
    dataset: freeholdShare,
    property: 'Freehold_Pct',
    metric: 'freeholdPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Freehold share of residential tenancies',
    stops: [0, 0.1, 0.2, 30.1, 99.5, 100],
    palette: BLUE,
    source: 'DLD Ejari contracts, 2008–2023 (Kaggle mirror)',
  },
  'lease-renewal-rate': {
    dataset: leaseRenewal,
    property: 'Renewal_RatePct',
    metric: 'renewalRatePct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Tenancies that are renewals rather than new lets',
    stops: [15.6, 34.2, 42.1, 49.4, 57.4, 70.3],
    palette: GREEN,
    source: 'DLD Ejari contracts, 2008–2023 (Kaggle mirror)',
  },
  'offplan-price-gap': {
    dataset: offplanGap,
    property: 'Offplan_PremiumPct',
    metric: 'offplanPremiumPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Off-plan price premium vs ready homes (2021–2023)',
    stops: [-12.2, 7.8, 24.3, 37.6, 59.6, 122.2],
    palette: BLUE,
    source: 'DLD transactions 2021–2023 (Kaggle mirror)',
  },
  'transaction-liquidity': {
    dataset: txLiquidity,
    property: 'Sales_PerYear',
    metric: 'salesPerYear',
    labelDigits: 0,
    labelSuffix: '/yr',
    label: 'Residential sales per year (2021–2023 average)',
    stops: [20, 44, 360, 709, 1709, 6904],
    palette: GREEN,
    source: 'DLD transactions 2021–2023 (Kaggle mirror)',
  },
  // Values run from about -87 (deepest fall) up to 0 (never fell), so the GREEN
  // ramp puts the resilient communities at the dark end. Higher is better here,
  // which is why this one is not flagged inverted.
  'max-historical-drawdown': {
    dataset: maxDrawdown,
    property: 'Max_DrawdownPct',
    metric: 'maxDrawdownPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Worst peak-to-trough price fall on record',
    stops: [-87.3, -50.4, -41, -29.4, -17.6, 0],
    palette: GREEN,
    source: 'DLD transactions 2000–2023 (Kaggle mirror)',
  },
  'price-vs-own-history': {
    dataset: priceVsHistory,
    property: 'VsOwnHistory_Pct',
    metric: 'vsOwnHistoryPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Price per m² vs the community’s own long-run average',
    stops: [-34.1, 0.7, 20.1, 31.3, 55.3, 107.8],
    palette: SAFETY,
    inverted: true,
    source: 'DLD transactions 2010–2023 (Kaggle mirror)',
  },
  'average-unit-size': {
    dataset: unitSize,
    property: 'Median_AreaSqm',
    metric: 'medianAreaSqm',
    labelDigits: 0,
    labelSuffix: ' m²',
    label: 'Median apartment size, m² (2019–2023)',
    stops: [34, 67, 75, 101, 124, 301],
    palette: BLUE,
    source: 'DLD transactions 2019–2023 (Kaggle mirror)',
  },
  'neighborhood-quality-score': {
    dataset: neighborhoodAmenity,
    property: 'Neighborhood_AmenityScore',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Neighbourhood amenity score (0–100, percentile composite)',
    stops: [0, 28, 42, 57, 75, 96],
    palette: GREEN,
    source: 'OpenStreetMap (Overpass, Sep 2026)',
  },
  'corporate-tenancy-share': {
    dataset: corporateTenancy,
    property: 'Corporate_TenancyPct',
    metric: 'corporateTenancyPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Tenancies leased by a company rather than an individual (2019–2023)',
    stops: [0, 3.5, 6.7, 10.2, 18.5, 100],
    palette: BLUE,
    source: 'DLD Ejari contracts 2019–2023 (Kaggle mirror)',
  },
  'community-engagement-index': {
    dataset: communityFacilities,
    property: 'Community_FacilitiesPer10k',
    metric: 'per10kPeople',
    labelDigits: 1,
    labelSuffix: ' /10k',
    label: 'Community facilities per 10k residents',
    stops: [0.12, 0.9, 1.3, 2.68, 5.04, 14.71],
    palette: GREEN,
    source: 'OpenStreetMap (Overpass, Sep 2026) + DSC population',
  },
  'youth-development-programs': {
    dataset: youthFacilities,
    property: 'Youth_FacilitiesPer10k',
    metric: 'per10kPeople',
    labelDigits: 1,
    labelSuffix: ' /10k',
    label: 'Youth & sports facilities per 10k residents',
    stops: [0.05, 0.95, 2.27, 4.54, 9.71, 32.01],
    palette: GREEN,
    source: 'OpenStreetMap (Overpass, Sep 2026) + DSC population',
  },
  'cultural-diversity-index': {
    dataset: culturalDiversity,
    property: 'CulturalDiversity_Index',
    metric: 'index',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Cultural diversity index (school-curriculum proxy, 0–100)',
    stops: [14.8, 23, 35.1, 39.2, 45.9, 54.5],
    palette: BLUE,
    source: 'KHDA school curricula 2024/25 (proxy)',
  },
  'average-schooling-cost': {
    dataset: schoolingCost,
    property: 'School_MeanFee',
    metric: 'meanAnnualFee',
    labelDigits: 0,
    labelDivisor: 1000,
    labelSuffix: 'K AED/yr',
    label: 'Average annual school fee (AED)',
    stops: [10099, 19785, 32342, 47969, 59105, 70689],
    palette: BLUE,
    source: 'KHDA fee schedules 2024/25 (bundled)',
  },
  'public-school-quality-rating': {
    dataset: schoolQuality,
    property: 'School_AvgRating',
    metric: 'avgRating',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Average DSIB school rating (1–5)',
    stops: [2, 2.5, 3, 3.5, 4.25, 5],
    palette: BLUE,
    source: 'KHDA DSIB ratings',
  },
  'job-market-diversity': {
    dataset: jobDiversity,
    property: 'Jobs_Diversity',
    metric: 'jobDiversity',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Business category diversity (Shannon H)',
    stops: [1.86, 2.35, 2.66, 3.04, 3.17, 3.45],
    palette: BLUE,
    source: 'OpenStreetMap',
  },
  'walkability-score': {
    dataset: walkability,
    property: 'Walk_PerSqKm',
    metric: 'walkPerSqKm',
    labelDigits: 1,
    labelSuffix: '',
    label: 'Pedestrian ways per km²',
    stops: [0.27, 7.95, 34, 73.6, 116.9, 200],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'home-value': {
    dataset: homeValue,
    property: 'HomeValue_Median',
    metric: 'medianPrice',
    labelDigits: 1,
    labelDivisor: 1000000,
    labelSuffix: 'M AED',
    label: 'Median home sale price (AED)',
    stops: [400000, 525000, 850000, 1967888, 2436630, 8000000],
    palette: BLUE,
    source: 'Dubai Land Department 1995-2023 export (mirror)',
  },
  'price-per-sqm': {
    dataset: ppsmByCommunity,
    property: 'PricePerSqm',
    metric: 'latestPricePerSqm',
    labelDigits: 0,
    labelSuffix: ' AED',
    label: 'Price per m² (AED)',
    stops: [3125, 6754, 14014, 20786, 28108, 43635],
    palette: BLUE,
    source: 'Dubai area price history (DLD-derived)',
  },
  'cap-rate': {
    dataset: capRate,
    property: 'CapRate_Gross',
    metric: 'capRatePct',
    labelDigits: 2,
    labelSuffix: '%',
    label: 'Gross rental yield (%)',
    stops: [1.78, 2.67, 4.07, 5.2, 6.72, 9.09],
    palette: GREEN,
    source: 'DLD Exchange (Ejari + DLD, 2026 YTD)',
  },
  'rental-rate': {
    dataset: rentalRate,
    property: 'Rent_Flat',
    metric: 'flatRentAed',
    labelDigits: 0,
    labelSuffix: ' AED',
    label: 'Median annual flat rent (AED)',
    stops: [40000, 50000, 60000, 79380, 115000, 205000],
    palette: BLUE,
    source: 'DLD Exchange (Ejari, 2026 YTD)',
  },
  'rent-for-houses': {
    dataset: rentForHouses,
    property: 'Rent_Villa',
    metric: 'villaRentAed',
    labelDigits: 0,
    labelSuffix: ' AED',
    label: 'Median annual villa rent (AED)',
    stops: [110000, 150000, 190000, 280000, 310000, 1450000],
    palette: BLUE,
    source: 'DLD Exchange (Ejari, 2026 YTD)',
  },
  'home-value-to-rent-ratio': {
    dataset: priceToRent,
    property: 'PriceToRent_Years',
    metric: 'priceToRentYears',
    labelDigits: 1,
    labelSuffix: ' yrs',
    label: 'Home value to rent ratio (years)',
    stops: [14.4, 19, 23, 37.4, 51.4, 75.3],
    palette: SAFETY,
    source: 'DLD Exchange (Ejari + DLD, 2026 YTD)',
  },
  'disability-accessibility-score': {
    dataset: accessibility,
    property: 'Access_Pct',
    metric: 'accessiblePct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Wheelchair-accessible share of tagged places (%)',
    stops: [8.1, 27.3, 43.2, 66.7, 83.8, 90.9],
    palette: GREEN,
    source: 'OpenStreetMap (wheelchair tag)',
  },
  'rent-as-percent-of-income': {
    dataset: rentPctIncome,
    property: 'RentPctIncome',
    metric: 'pctOfIncome',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Rent as % of income (proxy)',
    stops: [21.7, 27.1, 32.5, 43, 62.3, 111],
    palette: SAFETY,
    source: 'DLD Exchange (Ejari, 2026 YTD) / World Bank GDP proxy',
  },
  'long-term-growth-score': {
    dataset: longTermGrowth,
    property: 'GrowthScore',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Long-term growth score (0-100)',
    stops: [35, 44, 59, 75, 84, 90],
    palette: BLUE,
    source: 'In-house composite (population + home value + income growth)',
  },
  'median-listing-price': {
    dataset: medianListing,
    property: 'ListingPrice_Median',
    metric: 'medianListingPrice',
    labelDigits: 1,
    labelDivisor: 1000000,
    labelSuffix: 'M AED',
    label: 'Median asking price (AED)',
    stops: [992500, 1344876, 1760000, 2825000, 3490000, 5495000],
    palette: BLUE,
    source: 'Property Finder listings (Feb 2026 snapshot)',
  },
  'mortgage-payment': {
    dataset: affordability,
    property: 'Mortgage_Monthly',
    metric: 'mortgageMonthly',
    labelDigits: 0,
    labelSuffix: ' AED/mo',
    label: 'Est. monthly mortgage payment (AED)',
    stops: [4187, 5673, 7424, 11917, 14722, 23179],
    palette: BLUE,
    source: 'Derived: PF Feb-2026 asking x ENBD 3.99% / 25yr / 80% LTV',
  },
  'salary-to-afford-a-house': {
    dataset: affordability,
    property: 'Salary_ToAfford',
    metric: 'salaryToAfford',
    labelDigits: 0,
    labelDivisor: 1000,
    labelSuffix: 'K AED/yr',
    label: 'Income needed to afford a home (AED/yr)',
    stops: [167466, 226922, 296967, 476665, 588872, 927178],
    palette: BLUE,
    source: 'Derived: 30% of income to mortgage (ENBD 3.99% / 25yr / 80% LTV)',
  },
  'buy-v-rent-differential': {
    dataset: affordability,
    property: 'BuyVsRent_Monthly',
    metric: 'buyVsRentMonthly',
    labelDigits: 0,
    labelSuffix: ' AED/mo',
    label: 'Buy vs rent: mortgage minus rent (AED/mo)',
    stops: [-1140, -177, 1061, 3072, 4722, 6096],
    palette: SAFETY,
    source: 'Derived: ENBD mortgage vs Ejari 2026 flat rent',
  },
  'overvalued-percent': {
    dataset: overvalued,
    property: 'Overvalued_Pct',
    metric: 'overvaluedPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Over / undervalued vs its own price-to-income history',
    stops: [-38, 3, 24, 40, 66, 182],
    palette: SAFETY,
    inverted: true,
    source: 'Derived: community price/m2 history / UAE GDP per capita',
  },
  'value-income': {
    dataset: valueIncome,
    property: 'ValueToIncome',
    metric: 'valueToIncome',
    labelDigits: 1,
    labelSuffix: 'x income',
    label: 'Home value as a multiple of annual income',
    stops: [3.4, 6.5, 8.4, 11.9, 16.8, 29.8],
    palette: SAFETY,
    inverted: true,
    source: 'Derived: PF Feb-2026 asking / UAE GDP per capita 2024',
  },
  'mtg-payments-income-percent': {
    dataset: mtgPctIncome,
    property: 'MtgPct_Income',
    metric: 'pctOfIncome',
    labelDigits: 0,
    labelSuffix: '% of income',
    label: 'Mortgage payments as % of income',
    stops: [17.3, 32.9, 42.6, 60.3, 85, 150.7],
    palette: SAFETY,
    inverted: true,
    source: 'Derived: ENBD 3.99% / 25yr / 80% LTV vs UAE GDP per capita',
  },
  'monthly-home-ownership-cost': {
    dataset: ownershipCost,
    property: 'Ownership_Monthly',
    metric: 'monthlyCost',
    labelDigits: 0,
    labelSuffix: ' AED/mo',
    label: 'Est. monthly ownership cost (AED)',
    stops: [3236, 6162, 7981, 11297, 15919, 28216],
    palette: BLUE,
    source: 'Derived: ENBD mortgage + stated service-charge assumption',
  },
  'for-sale-inventory': {
    dataset: forSaleInventory,
    property: 'ForSale_Listings',
    metric: 'listings',
    labelDigits: 0,
    labelSuffix: ' listings',
    label: 'Residential listings on the market',
    stops: [1, 2, 5, 18, 37, 158],
    palette: BLUE,
    source: 'Property Finder listings (Feb 2026 snapshot)',
  },
  'affordability-index': {
    dataset: affordabilityIndex,
    property: 'Affordability_Index',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Affordability index (0-100, higher = more affordable)',
    stops: [14, 30, 43, 51, 61, 91],
    palette: GREEN,
    source: 'In-house composite of four affordability data points',
  },
  'housing-market-health-score': {
    dataset: marketHealth,
    property: 'MarketHealth_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Housing market health score (0-100)',
    stops: [9, 26, 43, 56, 67, 91],
    palette: BLUE,
    source: 'In-house composite: yield, transaction depth, price growth',
  },
  'school-quality-score': {
    dataset: schoolScore,
    property: 'SchoolQuality_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'School quality score (0-100)',
    stops: [9, 29, 46, 54, 67, 87],
    palette: GREEN,
    source: 'In-house composite: DSIB ratings, density, curricula, fees',
  },
  'economic-health-score': {
    dataset: economicHealth,
    property: 'EconomicHealth_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Economic health score (0-100)',
    stops: [9, 34, 45, 55, 64, 90],
    palette: GREEN,
    source: 'In-house composite: business diversity, density, population growth',
  },
};


/** COMM_NUM -> metric value for one sidebar data point (null values dropped). */
export const getValuesByCommunity = (dataPointId) => {
  const cfg = mapDataPoints[dataPointId];
  if (!cfg) return null;
  const out = {};
  cfg.dataset.rows.forEach((row) => {
    const value = row[cfg.metric];
    if (value != null) out[row.code] = value;
  });
  return out;
};

/** Metadata for the legend / attribution line. */
export const getMapDataPointMeta = (dataPointId) => {
  const cfg = mapDataPoints[dataPointId];
  if (!cfg) return null;
  const { dataset, label, source, inverted } = cfg;
  return {
    label,
    source,
    stops: cfg.stops,
    palette: cfg.palette,
    inverted: !!inverted,
    period: dataset.period || null,
    note: dataset.limitation || dataset.note || null,
    communities: Object.keys(getValuesByCommunity(dataPointId) || {}).length,
  };
};

export default mapDataPoints;
