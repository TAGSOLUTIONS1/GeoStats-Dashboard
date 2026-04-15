import React, { useMemo, useEffect } from 'react';
import { X, Building2, DollarSign, Home, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import propertyInsights from '../../data/properties/insights.json';
import propertyListings from '../../data/properties/listings.json';

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'No Data';
  return `AED ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value))}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'No Data';
  return new Intl.NumberFormat('en-US').format(Number(value));
};

const parseObjectValue = (value) => {
  if (value === null || value === undefined) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeLocationKey = (value) => String(value || '').trim().toLowerCase();

const classifyFurnishingLabel = (label) => {
  const normalizedLabel = String(label || '').toLowerCase();
  if (normalizedLabel.includes('unfurnished')) return 'unfurnished';
  if (normalizedLabel.includes('furnished')) return 'furnished';
  return 'unknown';
};

const buildBedsTypeCountMap = () => {
  const counts = new Map();
  propertyListings.forEach((listing) => {
    const beds = listing?.Beds;
    const type = listing?.Type;
    if (beds === null || beds === undefined || !type) return;
    const key = `${beds}|${type}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
};

const buildBathsTypeCountMap = () => {
  const counts = new Map();
  propertyListings.forEach((listing) => {
    const baths = listing?.Baths;
    const type = listing?.Type;
    if (baths === null || baths === undefined || !type) return;
    const key = `${baths}|${type}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
};

const buildLocationCountMap = () => {
  const counts = new Map();
  propertyListings.forEach((listing) => {
    const location = listing?.Location ? String(listing.Location).trim() : '';
    if (!location) return;
    counts.set(location, (counts.get(location) || 0) + 1);
  });
  return counts;
};

const buildLocationDetailMap = () => {
  const locationMap = new Map();

  propertyListings.forEach((listing) => {
    const locationName = listing?.Location ? String(listing.Location).trim() : '';
    if (!locationName) return;

    const key = normalizeLocationKey(locationName);
    if (!locationMap.has(key)) {
      locationMap.set(key, {
        locationName,
        listingCount: 0,
        totalRent: 0,
        rentCount: 0,
        totalRentPerSqft: 0,
        rentPerSqftCount: 0,
        furnishedCount: 0,
        typeCounts: {},
      });
    }

    const bucket = locationMap.get(key);
    bucket.listingCount += 1;

    const rent = Number(listing?.Rent);
    if (!Number.isNaN(rent) && rent > 0) {
      bucket.totalRent += rent;
      bucket.rentCount += 1;
    }

    const rentPerSqft = Number(listing?.Rent_per_sqft);
    if (!Number.isNaN(rentPerSqft) && rentPerSqft > 0) {
      bucket.totalRentPerSqft += rentPerSqft;
      bucket.rentPerSqftCount += 1;
    }

    const furnishingClass = classifyFurnishingLabel(listing?.Furnishing);
    if (furnishingClass === 'furnished') {
      bucket.furnishedCount += 1;
    }

    const typeName = listing?.Type ? String(listing.Type).trim() : 'Unknown';
    bucket.typeCounts[typeName] = (bucket.typeCounts[typeName] || 0) + 1;
  });

  return locationMap;
};

const aggregateComboDimensionByType = (comboRows, dimensionKey) => {
  const bucketMap = new Map();

  comboRows.forEach((row) => {
    const dimensionValue = row?.[dimensionKey];
    const typeValue = row?.type;
    if (dimensionValue === null || dimensionValue === undefined || !typeValue) return;

    const count = Number(row.count || 0);
    if (count <= 0) return;

    const bucketKey = `${dimensionValue}|${typeValue}`;
    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, {
        dimension: dimensionValue,
        type: typeValue,
        listingCount: 0,
        totalRent: 0,
        rentWeight: 0,
        totalRentPerSqft: 0,
        rentPerSqftWeight: 0,
        furnishedWeightedSum: 0,
        furnishedWeight: 0,
      });
    }

    const bucket = bucketMap.get(bucketKey);
    bucket.listingCount += count;

    const avgRent = Number(row.avgRent);
    if (!Number.isNaN(avgRent) && avgRent > 0) {
      bucket.totalRent += avgRent * count;
      bucket.rentWeight += count;
    }

    const avgRentPerSqft = Number(row.avgRentPerSqft);
    if (!Number.isNaN(avgRentPerSqft) && avgRentPerSqft > 0) {
      bucket.totalRentPerSqft += avgRentPerSqft * count;
      bucket.rentPerSqftWeight += count;
    }

    const furnishedShare = Number(row.furnishedShare);
    if (!Number.isNaN(furnishedShare)) {
      bucket.furnishedWeightedSum += furnishedShare * count;
      bucket.furnishedWeight += count;
    }
  });

  return [...bucketMap.values()]
    .map((bucket) => ({
      dimension: bucket.dimension,
      type: bucket.type,
      listingCount: bucket.listingCount,
      avgRent: bucket.rentWeight > 0 ? bucket.totalRent / bucket.rentWeight : null,
      avgRentPerSqft: bucket.rentPerSqftWeight > 0 ? bucket.totalRentPerSqft / bucket.rentPerSqftWeight : null,
      furnishedShare: bucket.furnishedWeight > 0 ? bucket.furnishedWeightedSum / bucket.furnishedWeight : null,
    }))
    .sort((a, b) => b.listingCount - a.listingCount);
};

const getRowsForDataPoint = (selectedDataPoint, areaMetrics) => {
  if (selectedDataPoint === 'property-combo-counts') {
    const sourceRows = Array.isArray(propertyInsights.combo_counts) ? propertyInsights.combo_counts : [];
    const totalListings = sourceRows.reduce((sum, row) => sum + Number(row.Count ?? row.count ?? 0), 0);
    return sourceRows.map((row) => {
      const beds = row.Beds ?? row.beds ?? 'Unknown';
      const baths = row.Baths ?? row.baths ?? 'Unknown';
      const type = row.Type ?? row.type ?? 'Unknown';
      const count = row.Count ?? row.count ?? 0;
      return {
      label: `${beds} Beds / ${baths} Baths / ${type}`,
      value: count,
      valueLabel: `${formatNumber(count)} / ${formatNumber(totalListings)} listings`,
      selection: {
        selectionId: `combo-${beds}-${baths}-${type}`,
        label: `${beds}B / ${baths}Ba / ${type}`,
        beds,
        baths,
        type,
      },
      };
    });
  }

  if (selectedDataPoint === 'property-type-counts') {
    const areaTypeCounts = areaMetrics?.typeCounts || {};
    const globalRows = Array.isArray(propertyInsights.type_counts) ? propertyInsights.type_counts : [];
    const totalListings = globalRows.reduce((sum, row) => sum + Number(row.Count || 0), 0);
    return globalRows.map((row) => {
      const typeName = row.Type;
      const areaCount = Number(areaTypeCounts[typeName] || 0);
      const globalCount = Number(row.Count || 0);
      return {
        label: typeName,
        value: globalCount,
        valueLabel: `${formatNumber(globalCount)} / ${formatNumber(totalListings)} listings • area: ${formatNumber(areaCount)}`,
        selection: {
          selectionId: `type-${typeName}`,
          label: `Type: ${typeName}`,
          type: typeName,
        },
      };
    });
  }

  if (selectedDataPoint === 'property-furnishing-counts') {
    const globalCounts = { furnished: 0, unfurnished: 0, unknown: 0 };
    (propertyInsights.furnishing_counts || []).forEach((row) => {
      const key = classifyFurnishingLabel(row.Furnishing);
      globalCounts[key] += Number(row.Count || 0);
    });
    const totalListings = globalCounts.furnished + globalCounts.unfurnished + globalCounts.unknown;

    return [
      {
        label: 'Furnished',
        value: globalCounts.furnished,
        valueLabel: `${formatNumber(globalCounts.furnished)} / ${formatNumber(totalListings)} listings`,
        selection: {
          selectionId: 'furnishing-class-furnished',
          label: 'Furnishing: Furnished',
          furnishingClass: 'furnished',
        },
      },
      {
        label: 'Unfurnished',
        value: globalCounts.unfurnished,
        valueLabel: `${formatNumber(globalCounts.unfurnished)} / ${formatNumber(totalListings)} listings`,
        selection: {
          selectionId: 'furnishing-class-unfurnished',
          label: 'Furnishing: Unfurnished',
          furnishingClass: 'unfurnished',
        },
      },
    ];
  }

  if (selectedDataPoint === 'property-avg-rent-beds-type') {
    const rows = propertyInsights.avg_rent_by_beds_type || [];
    const countMap = buildBedsTypeCountMap();
    const totalListings = [...countMap.values()].reduce((sum, count) => sum + count, 0);

    return rows.map((row) => {
      const comboCount = countMap.get(`${row.Beds}|${row.Type}`) || 0;
      return {
        label: `${row.Beds} Beds / ${row.Type}`,
        value: comboCount,
        valueLabel: `${formatNumber(comboCount)} / ${formatNumber(totalListings)} listings • ${formatCurrency(row.AvgRent)}`,
        selection: {
          selectionId: `beds-type-${row.Beds}-${row.Type}`,
          label: `${row.Beds}B / ${row.Type}`,
          beds: Number(row.Beds),
          type: row.Type,
        },
      };
    });
  }

  if (selectedDataPoint === 'property-avg-rent-baths-type') {
    const rows = propertyInsights.avg_rent_by_baths_type || [];
    const countMap = buildBathsTypeCountMap();
    const totalListings = [...countMap.values()].reduce((sum, count) => sum + count, 0);

    return rows.map((row) => {
      const comboCount = countMap.get(`${row.Baths}|${row.Type}`) || 0;
      return {
        label: `${row.Baths} Baths / ${row.Type}`,
        value: comboCount,
        valueLabel: `${formatNumber(comboCount)} / ${formatNumber(totalListings)} listings • ${formatCurrency(row.AvgRent)}`,
        selection: {
          selectionId: `baths-type-${row.Baths}-${row.Type}`,
          label: `${row.Baths}Ba / ${row.Type}`,
          baths: Number(row.Baths),
          type: row.Type,
        },
      };
    });
  }

  if (selectedDataPoint === 'property-rent-per-sqft-location') {
    const rows = propertyInsights.avg_rent_per_sqft_by_location || [];
    const countMap = buildLocationCountMap();
    const totalListings = [...countMap.values()].reduce((sum, count) => sum + count, 0);

    return rows.map((row) => {
      const locationName = row?.Location ? String(row.Location).trim() : 'Unknown';
      const locationCount = countMap.get(locationName) || 0;
      return {
        label: locationName,
        value: locationCount,
        valueLabel: `${formatNumber(locationCount)} / ${formatNumber(totalListings)} listings • AED ${Number(row.AvgRentPerSqft).toFixed(2)}/sqft`,
        selection: {
          selectionId: `location-${locationName}`,
          label: `Location: ${locationName}`,
          location: locationName,
        },
      };
    });
  }

  return [];
};

const getDataPointTitle = (selectedDataPoint) => {
  const titles = {
    'property-combo-counts': 'Top Bed/Bath/Type Combinations',
    'property-type-counts': 'Property Type Distribution',
    'property-furnishing-counts': 'Furnishing Distribution',
    'property-avg-rent-beds-type': 'Average Rent by Beds and Type',
    'property-avg-rent-baths-type': 'Average Rent by Baths and Type',
    'property-rent-per-sqft-location': 'Average Rent per Sqft by Location',
  };
  return titles[selectedDataPoint] || 'Property Insights';
};

const PropertyGraphModal = ({
  isOpen = false,
  onClose = () => {},
  areaName = 'Selected Area',
  selectedDataPoint = null,
  areaMetrics = null,
  selectedFilters = [],
  onFilterToggle = () => {},
  onFilterClear = () => {},
  showSelectorSection = true,
  showInsightsSections = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const rows = useMemo(() => getRowsForDataPoint(selectedDataPoint, areaMetrics), [selectedDataPoint, areaMetrics]);
  const totalRowValue = useMemo(() => {
    if (!rows.length) return 1;
    const total = rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);
    return total > 0 ? total : 1;
  }, [rows]);
  const isTypeSelectionMode = selectedDataPoint === 'property-type-counts';
  const isFurnishingMode = selectedDataPoint === 'property-furnishing-counts';
  const isComboMode = selectedDataPoint === 'property-combo-counts';
  const isBedsTypeMode = selectedDataPoint === 'property-avg-rent-beds-type';
  const isBathsTypeMode = selectedDataPoint === 'property-avg-rent-baths-type';
  const isLocationMode = selectedDataPoint === 'property-rent-per-sqft-location';
  const selectedFilterKeys = useMemo(
    () => new Set((selectedFilters || []).map((item, index) => item.selectionId || `selection-${index}`)),
    [selectedFilters],
  );
  const furnishingBreakdown = useMemo(() => {
    const furnishingCounts = parseObjectValue(areaMetrics?.furnishingCounts);
    const furnishedCountFromBuckets = Object.entries(furnishingCounts)
      .filter(([label]) => classifyFurnishingLabel(label) === 'furnished')
      .reduce((sum, [, count]) => sum + Number(count || 0), 0);
    const unfurnishedCountFromBuckets = Object.entries(furnishingCounts)
      .filter(([label]) => classifyFurnishingLabel(label) === 'unfurnished')
      .reduce((sum, [, count]) => sum + Number(count || 0), 0);

    let furnishedCount = Number(areaMetrics?.furnishedCount ?? 0);
    let unfurnishedCount = Number(areaMetrics?.unfurnishedCount ?? 0);

    if ((furnishedCount <= 0 && unfurnishedCount <= 0) && (furnishedCountFromBuckets > 0 || unfurnishedCountFromBuckets > 0)) {
      furnishedCount = furnishedCountFromBuckets;
      unfurnishedCount = unfurnishedCountFromBuckets;
    }

    const unknownCount = Number(
      Object.entries(furnishingCounts)
        .filter(([label]) => classifyFurnishingLabel(label) === 'unknown')
        .reduce((sum, [, count]) => sum + Number(count || 0), 0),
    );

    const totalListings = Number(areaMetrics?.listingCount ?? (furnishedCount + unfurnishedCount + unknownCount));
    const furnishedShare = areaMetrics?.furnishedShare != null
      ? Number(areaMetrics.furnishedShare)
      : (totalListings > 0 ? (furnishedCount / totalListings) * 100 : null);
    const unfurnishedShare = areaMetrics?.unfurnishedShare != null
      ? Number(areaMetrics.unfurnishedShare)
      : (totalListings > 0 ? (unfurnishedCount / totalListings) * 100 : null);

    return {
      totalListings,
      furnishedCount,
      unfurnishedCount,
      unknownCount,
      furnishedShare,
      unfurnishedShare,
    };
  }, [areaMetrics]);
  const typeDetailRows = useMemo(() => {
    const typeMetrics = parseObjectValue(areaMetrics?.typeMetrics);
    const selectedTypeSet = new Set(
      (selectedFilters || [])
        .map((item) => item?.type)
        .filter((type) => Boolean(type)),
    );

    const rowsForArea = Object.entries(typeMetrics)
      .map(([type, metrics]) => ({
        type,
        listingCount: Number(metrics?.listingCount || 0),
        avgRent: metrics?.avgRent ?? null,
        avgRentPerSqft: metrics?.avgRentPerSqft ?? null,
        furnishedShare: metrics?.furnishedShare ?? null,
        selected: selectedTypeSet.has(type),
      }))
      .filter((row) => row.listingCount > 0)
      .sort((a, b) => b.listingCount - a.listingCount);

    if (!rowsForArea.length) return [];
    if (!selectedTypeSet.size) return rowsForArea;

    return [
      ...rowsForArea.filter((row) => row.selected),
      ...rowsForArea.filter((row) => !row.selected),
    ];
  }, [areaMetrics, selectedFilters]);
  const comboDetailRows = useMemo(() => {
    const metricsSource = Array.isArray(areaMetrics?.comboMetrics) ? areaMetrics.comboMetrics : [];
    if (metricsSource.length > 0) {
      return metricsSource.map((combo) => ({
        beds: combo.beds ?? 'Unknown',
        baths: combo.baths ?? 'Unknown',
        type: combo.type ?? 'Unknown',
        count: Number(combo.count || 0),
        avgRent: combo.avgRent ?? null,
        avgRentPerSqft: combo.avgRentPerSqft ?? null,
        furnishedShare: combo.furnishedShare ?? null,
      }));
    }

    const fallbackRows = Array.isArray(areaMetrics?.comboCounts) ? areaMetrics.comboCounts : [];
    return fallbackRows.map((combo) => ({
      beds: combo.beds ?? combo.Beds ?? 'Unknown',
      baths: combo.baths ?? combo.Baths ?? 'Unknown',
      type: combo.type ?? combo.Type ?? 'Unknown',
      count: Number(combo.count ?? combo.Count ?? 0),
      avgRent: combo.avgRent ?? (Number(combo.rentCount || 0) > 0 ? Number(combo.totalRent || 0) / Number(combo.rentCount || 1) : null),
      avgRentPerSqft:
        combo.avgRentPerSqft ??
        (Number(combo.rentPerSqftCount || 0) > 0
          ? Number(combo.totalRentPerSqft || 0) / Number(combo.rentPerSqftCount || 1)
          : null),
      furnishedShare:
        combo.furnishedShare ??
        (Number(combo.count ?? combo.Count ?? 0) > 0
          ? (Number(combo.furnishedCount || 0) / Number(combo.count ?? combo.Count ?? 1)) * 100
          : null),
    }));
  }, [areaMetrics]);
  const bedsTypeDetailRows = useMemo(
    () => aggregateComboDimensionByType(comboDetailRows, 'beds'),
    [comboDetailRows],
  );
  const bathsTypeDetailRows = useMemo(
    () => aggregateComboDimensionByType(comboDetailRows, 'baths'),
    [comboDetailRows],
  );
  const locationDetailRows = useMemo(() => {
    if (!isLocationMode) return [];

    const detailMap = buildLocationDetailMap();
    const sourceRows = Array.isArray(propertyInsights?.avg_rent_per_sqft_by_location)
      ? propertyInsights.avg_rent_per_sqft_by_location
      : [];
    const selectedLocationSet = new Set(
      (selectedFilters || [])
        .map((item) => normalizeLocationKey(item?.location))
        .filter((value) => Boolean(value)),
    );

    const mergedRows = sourceRows
      .map((row) => {
        const locationName = row?.Location ? String(row.Location).trim() : '';
        if (!locationName) return null;

        const key = normalizeLocationKey(locationName);
        const detail = detailMap.get(key);
        const listingCount = Number(detail?.listingCount || 0);
        const avgRent = detail?.rentCount > 0 ? detail.totalRent / detail.rentCount : null;
        const avgRentPerSqftFromListings = detail?.rentPerSqftCount > 0
          ? detail.totalRentPerSqft / detail.rentPerSqftCount
          : null;
        const avgRentPerSqft = avgRentPerSqftFromListings ?? Number(row?.AvgRentPerSqft ?? null);
        const dominantType = detail?.typeCounts
          ? Object.entries(detail.typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
          : null;
        const furnishedShare = listingCount > 0 ? (Number(detail?.furnishedCount || 0) / listingCount) * 100 : null;

        return {
          location: locationName,
          listingCount,
          avgRent,
          avgRentPerSqft: Number.isNaN(avgRentPerSqft) ? null : avgRentPerSqft,
          furnishedShare,
          dominantType,
          selected: selectedLocationSet.has(key),
        };
      })
      .filter((row) => row && (row.listingCount > 0 || row.avgRentPerSqft != null));

    if (!selectedLocationSet.size) {
      return mergedRows.sort((a, b) => b.listingCount - a.listingCount);
    }

    return [
      ...mergedRows.filter((row) => row.selected).sort((a, b) => b.listingCount - a.listingCount),
      ...mergedRows.filter((row) => !row.selected).sort((a, b) => b.listingCount - a.listingCount),
    ];
  }, [isLocationMode, selectedFilters]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: '0%' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed bottom-0 w-[98%] md:w-[95%] lg:w-[70%] 2xl:w-[75%] right-1 md:right-[2%] xl:right-[5%] z-50 p-2 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getDataPointTitle(selectedDataPoint)}</h2>
            <p className="text-sm text-gray-600 mt-1">{areaName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {showInsightsSections && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" />Listings</div>
              <div className="text-lg font-semibold text-gray-800">{formatNumber(areaMetrics?.listingCount)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" />Avg Rent</div>
              <div className="text-lg font-semibold text-gray-800">{formatCurrency(areaMetrics?.avgRent)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1"><Home className="w-3 h-3" />Avg Rent/Sqft</div>
              <div className="text-lg font-semibold text-gray-800">
                {areaMetrics?.avgRentPerSqft != null ? `AED ${Number(areaMetrics.avgRentPerSqft).toFixed(2)}` : 'No Data'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1"><BarChart3 className="w-3 h-3" />Furnished Share</div>
              <div className="text-lg font-semibold text-gray-800">
                {areaMetrics?.furnishedShare != null ? `${Number(areaMetrics.furnishedShare).toFixed(1)}%` : 'No Data'}
              </div>
              <div className="text-[11px] text-gray-600 mt-1">
                {areaMetrics?.furnishedCount != null ? `${formatNumber(areaMetrics.furnishedCount)} listings` : 'No Data'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1"><BarChart3 className="w-3 h-3" />Unfurnished Share</div>
              <div className="text-lg font-semibold text-gray-800">
                {areaMetrics?.unfurnishedShare != null ? `${Number(areaMetrics.unfurnishedShare).toFixed(1)}%` : 'No Data'}
              </div>
              <div className="text-[11px] text-gray-600 mt-1">
                {areaMetrics?.unfurnishedCount != null ? `${formatNumber(areaMetrics.unfurnishedCount)} listings` : 'No Data'}
              </div>
            </div>
          </div>
          )}

          {showSelectorSection && (
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              {isTypeSelectionMode ? 'Property Type Selector' : 'Property Selector'}
            </h3>
            {rows.some((row) => Boolean(row.selection)) && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                <p className="text-xs text-emerald-900">
                  {isTypeSelectionMode
                    ? 'Click one or more types. Map will highlight regions where that type is dominant.'
                    : 'Multi-select enabled: all available records are listed; click rows to filter map points by selected groups.'}
                </p>
                {selectedFilterKeys.size > 0 && (
                  <button
                    onClick={onFilterClear}
                    className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                  >
                    Clear All ({selectedFilterKeys.size})
                  </button>
                )}
              </div>
            )}
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500">No chart data available for this data point.</p>
            ) : isTypeSelectionMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rows.map((row) => {
                  const rowSelectionKey = row.selection?.selectionId || null;
                  const isActiveType = Boolean(rowSelectionKey && selectedFilterKeys.has(rowSelectionKey));
                  return (
                    <button
                      key={`${row.label}-${row.value}`}
                      onClick={() => {
                        if (row.selection) onFilterToggle(row.selection);
                      }}
                      className={`text-left rounded-lg border px-3 py-2 transition-colors ${isActiveType ? 'bg-emerald-100 border-emerald-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="text-sm font-medium text-gray-900">{row.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{row.valueLabel}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => {
                  const width = `${Math.max(4, (Number(row.value) / totalRowValue) * 100)}%`;
                  const rowSelectionKey = row.selection?.selectionId || null;
                  const isActiveCombo = Boolean(rowSelectionKey && selectedFilterKeys.has(rowSelectionKey));
                  const isSelectableRow = Boolean(row.selection);
                  return (
                    <div
                      key={`${row.label}-${row.value}`}
                      className={`space-y-1 rounded-md px-2 py-1 transition-colors ${isActiveCombo ? 'bg-emerald-100 border border-emerald-300' : 'border border-transparent'} ${isSelectableRow ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => {
                        if (isSelectableRow) onFilterToggle(row.selection);
                      }}
                      role={isSelectableRow ? 'button' : undefined}
                      tabIndex={isSelectableRow ? 0 : -1}
                      onKeyDown={(event) => {
                        if (!isSelectableRow) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onFilterToggle(row.selection);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate pr-3">{row.label}</span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{row.valueLabel}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-2 rounded-full ${isActiveCombo ? 'bg-emerald-700' : 'bg-emerald-500'}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {showInsightsSections && isFurnishingMode && (
            <div className="rounded-xl border border-gray-200 p-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Furnishing Detail In This Area</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">Total Listings</p>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(furnishingBreakdown.totalListings)}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-xs text-emerald-700">Furnished</p>
                  <p className="text-sm font-semibold text-emerald-900">{formatNumber(furnishingBreakdown.furnishedCount)}</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    {furnishingBreakdown.furnishedShare != null ? `${Number(furnishingBreakdown.furnishedShare).toFixed(1)}%` : 'No Data'}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-700">Unfurnished</p>
                  <p className="text-sm font-semibold text-amber-900">{formatNumber(furnishingBreakdown.unfurnishedCount)}</p>
                  <p className="text-xs text-amber-800 mt-1">
                    {furnishingBreakdown.unfurnishedShare != null ? `${Number(furnishingBreakdown.unfurnishedShare).toFixed(1)}%` : 'No Data'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showInsightsSections && isComboMode && (
            <div className="rounded-xl border border-gray-200 p-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Combo Details In This Area</h3>
              {comboDetailRows.length === 0 ? (
                <p className="text-sm text-gray-500">No combo detail available for this area.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {comboDetailRows.map((combo, index) => (
                    <div key={`${combo.beds}-${combo.baths}-${combo.type}-${index}`} className="rounded-lg border border-gray-200 p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">{`${combo.beds} Bed / ${combo.baths} Bath / ${combo.type}`}</p>
                        <p className="text-xs text-gray-600">{formatNumber(combo.count)} listings</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent</p>
                          <p className="font-medium text-gray-900">{formatCurrency(combo.avgRent)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent/Sqft</p>
                          <p className="font-medium text-gray-900">
                            {combo.avgRentPerSqft != null ? `AED ${Number(combo.avgRentPerSqft).toFixed(2)}` : 'No Data'}
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Furnished Share</p>
                          <p className="font-medium text-gray-900">
                            {combo.furnishedShare != null ? `${Number(combo.furnishedShare).toFixed(1)}%` : 'No Data'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showInsightsSections && isBedsTypeMode && (
            <div className="rounded-xl border border-gray-200 p-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Beds/Type Details In This Area</h3>
              {bedsTypeDetailRows.length === 0 ? (
                <p className="text-sm text-gray-500">No beds/type detail available for this area.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {bedsTypeDetailRows.map((detail, index) => (
                    <div key={`${detail.dimension}-${detail.type}-${index}`} className="rounded-lg border border-gray-200 p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">{`${detail.dimension} Beds / ${detail.type}`}</p>
                        <p className="text-xs text-gray-600">{formatNumber(detail.listingCount)} listings</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent</p>
                          <p className="font-medium text-gray-900">{formatCurrency(detail.avgRent)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent/Sqft</p>
                          <p className="font-medium text-gray-900">
                            {detail.avgRentPerSqft != null ? `AED ${Number(detail.avgRentPerSqft).toFixed(2)}` : 'No Data'}
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Furnished Share</p>
                          <p className="font-medium text-gray-900">
                            {detail.furnishedShare != null ? `${Number(detail.furnishedShare).toFixed(1)}%` : 'No Data'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showInsightsSections && isBathsTypeMode && (
            <div className="rounded-xl border border-gray-200 p-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Baths/Type Details In This Area</h3>
              {bathsTypeDetailRows.length === 0 ? (
                <p className="text-sm text-gray-500">No baths/type detail available for this area.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {bathsTypeDetailRows.map((detail, index) => (
                    <div key={`${detail.dimension}-${detail.type}-${index}`} className="rounded-lg border border-gray-200 p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">{`${detail.dimension} Baths / ${detail.type}`}</p>
                        <p className="text-xs text-gray-600">{formatNumber(detail.listingCount)} listings</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent</p>
                          <p className="font-medium text-gray-900">{formatCurrency(detail.avgRent)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent/Sqft</p>
                          <p className="font-medium text-gray-900">
                            {detail.avgRentPerSqft != null ? `AED ${Number(detail.avgRentPerSqft).toFixed(2)}` : 'No Data'}
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Furnished Share</p>
                          <p className="font-medium text-gray-900">
                            {detail.furnishedShare != null ? `${Number(detail.furnishedShare).toFixed(1)}%` : 'No Data'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showInsightsSections && isLocationMode && (
            <div className="rounded-xl border border-gray-200 p-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Location Details In Selected Section</h3>
              {locationDetailRows.length === 0 ? (
                <p className="text-sm text-gray-500">No location detail available.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {locationDetailRows.map((detail) => (
                    <div
                      key={detail.location}
                      className={`rounded-lg border p-3 ${detail.selected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">{detail.location}</p>
                        <p className="text-xs text-gray-600">{formatNumber(detail.listingCount)} listings</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent</p>
                          <p className="font-medium text-gray-900">{formatCurrency(detail.avgRent)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent/Sqft</p>
                          <p className="font-medium text-gray-900">
                            {detail.avgRentPerSqft != null ? `AED ${Number(detail.avgRentPerSqft).toFixed(2)}` : 'No Data'}
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Furnished Share</p>
                          <p className="font-medium text-gray-900">
                            {detail.furnishedShare != null ? `${Number(detail.furnishedShare).toFixed(1)}%` : 'No Data'}
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Dominant Type</p>
                          <p className="font-medium text-gray-900">{detail.dominantType || 'No Data'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showInsightsSections && isTypeSelectionMode && (
            <div className="rounded-xl border border-gray-200 p-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Per Type Details In This Area</h3>
              {typeDetailRows.length === 0 ? (
                <p className="text-sm text-gray-500">No per-type details found for this area.</p>
              ) : (
                <div className="space-y-2">
                  {typeDetailRows.map((detail) => (
                    <div
                      key={detail.type}
                      className={`rounded-lg border p-3 ${detail.selected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">{detail.type}</p>
                        <p className="text-xs text-gray-600">{formatNumber(detail.listingCount)} listings</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent</p>
                          <p className="font-medium text-gray-900">{formatCurrency(detail.avgRent)}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Avg Rent/Sqft</p>
                          <p className="font-medium text-gray-900">
                            {detail.avgRentPerSqft != null ? `AED ${Number(detail.avgRentPerSqft).toFixed(2)}` : 'No Data'}
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5">
                          <p className="text-gray-500">Furnished Share</p>
                          <p className="font-medium text-gray-900">
                            {detail.furnishedShare != null ? `${Number(detail.furnishedShare).toFixed(1)}%` : 'No Data'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyGraphModal;
