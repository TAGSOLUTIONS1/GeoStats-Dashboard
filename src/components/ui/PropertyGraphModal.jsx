import React, { useMemo, useEffect } from 'react';
import { X, Building2, DollarSign, Home, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import propertyInsights from '../../data/properties/insights.json';

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'No Data';
  return `AED ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value))}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'No Data';
  return new Intl.NumberFormat('en-US').format(Number(value));
};

const getRowsForDataPoint = (selectedDataPoint) => {
  if (selectedDataPoint === 'property-combo-counts') {
    return (propertyInsights.combo_counts || []).slice(0, 10).map((row) => ({
      label: `${row.Beds} Beds / ${row.Baths} Baths / ${row.Type}`,
      value: row.Count,
      valueLabel: `${formatNumber(row.Count)} listings`,
    }));
  }

  if (selectedDataPoint === 'property-type-counts') {
    return (propertyInsights.type_counts || []).slice(0, 10).map((row) => ({
      label: row.Type,
      value: row.Count,
      valueLabel: `${formatNumber(row.Count)} listings`,
    }));
  }

  if (selectedDataPoint === 'property-furnishing-counts') {
    return (propertyInsights.furnishing_counts || []).slice(0, 10).map((row) => ({
      label: row.Furnishing,
      value: row.Count,
      valueLabel: `${formatNumber(row.Count)} listings`,
    }));
  }

  if (selectedDataPoint === 'property-avg-rent-beds-type') {
    return (propertyInsights.avg_rent_by_beds_type || []).slice(0, 10).map((row) => ({
      label: `${row.Beds} Beds / ${row.Type}`,
      value: row.AvgRent,
      valueLabel: formatCurrency(row.AvgRent),
    }));
  }

  if (selectedDataPoint === 'property-avg-rent-baths-type') {
    return (propertyInsights.avg_rent_by_baths_type || []).slice(0, 10).map((row) => ({
      label: `${row.Baths} Baths / ${row.Type}`,
      value: row.AvgRent,
      valueLabel: formatCurrency(row.AvgRent),
    }));
  }

  if (selectedDataPoint === 'property-rent-per-sqft-location') {
    return (propertyInsights.avg_rent_per_sqft_by_location || []).slice(0, 10).map((row) => ({
      label: row.Location,
      value: row.AvgRentPerSqft,
      valueLabel: `AED ${Number(row.AvgRentPerSqft).toFixed(2)}/sqft`,
    }));
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

  const rows = useMemo(() => getRowsForDataPoint(selectedDataPoint), [selectedDataPoint]);
  const maxValue = useMemo(() => {
    if (!rows.length) return 1;
    return Math.max(...rows.map((row) => Number(row.value) || 0), 1);
  }, [rows]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Top 10 Snapshot</h3>
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500">No chart data available for this data point.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => {
                  const width = `${Math.max(4, (Number(row.value) / maxValue) * 100)}%`;
                  return (
                    <div key={`${row.label}-${row.value}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate pr-3">{row.label}</span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{row.valueLabel}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyGraphModal;
