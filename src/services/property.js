const normalizeLocationName = (value) => {
	if (!value) return '';
	return String(value)
		.toLowerCase()
		.replace(/\([^)]*\)/g, ' ')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
};

const toNumber = (value) => {
	const num = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(num) ? num : null;
};

export const buildPropertyLocationMetrics = (listings = [], insights = {}) => {
	const locationStats = new Map();

	listings.forEach((row) => {
		const location = row?.Location;
		const key = normalizeLocationName(location);
		if (!key) return;

		if (!locationStats.has(key)) {
			locationStats.set(key, {
				locationName: String(location),
				listingCount: 0,
				totalRent: 0,
				rentCount: 0,
				typeCounts: {},
				furnishingCounts: {},
			});
		}

		const item = locationStats.get(key);
		item.listingCount += 1;

		const rent = toNumber(row?.Rent);
		if (rent !== null) {
			item.totalRent += rent;
			item.rentCount += 1;
		}

		const type = row?.Type ? String(row.Type).trim() : 'Unknown';
		item.typeCounts[type] = (item.typeCounts[type] || 0) + 1;

		const furnishing = row?.Furnishing ? String(row.Furnishing).trim() : 'Unknown';
		item.furnishingCounts[furnishing] = (item.furnishingCounts[furnishing] || 0) + 1;
	});

	const rentPerSqftMap = new Map();
	const rentPerSqftRows = Array.isArray(insights?.avg_rent_per_sqft_by_location)
		? insights.avg_rent_per_sqft_by_location
		: [];
	rentPerSqftRows.forEach((row) => {
		const key = normalizeLocationName(row?.Location);
		if (!key) return;
		rentPerSqftMap.set(key, {
			avgRentPerSqft: toNumber(row?.AvgRentPerSqft),
			listingCount: toNumber(row?.ListingCount),
		});
	});

	const result = new Map();
	locationStats.forEach((value, key) => {
		const dominantType = Object.entries(value.typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
		const furnishedCount = Object.entries(value.furnishingCounts)
			.filter(([label]) => label.toLowerCase().includes('furnished'))
			.reduce((sum, [, count]) => sum + count, 0);

		const sqftData = rentPerSqftMap.get(key);
		result.set(key, {
			locationName: value.locationName,
			property_listing_count: value.listingCount,
			property_avg_rent: value.rentCount > 0 ? value.totalRent / value.rentCount : null,
			property_avg_rent_per_sqft: sqftData?.avgRentPerSqft ?? null,
			property_furnished_share: value.listingCount > 0 ? (furnishedCount / value.listingCount) * 100 : null,
			property_dominant_type: dominantType,
		});
	});

	return result;
};

const scoreLocationMatch = (locationKey, featureKey) => {
	if (!locationKey || !featureKey) return -1;
	if (locationKey === featureKey) return 1000;
	if (featureKey.includes(locationKey)) return locationKey.length;
	if (locationKey.includes(featureKey)) return featureKey.length;

	const locationTokens = new Set(locationKey.split(' '));
	const featureTokens = new Set(featureKey.split(' '));
	let overlap = 0;
	locationTokens.forEach((token) => {
		if (featureTokens.has(token) && token.length > 2) overlap += 1;
	});
	return overlap;
};

export const addPropertyMetricsToGeoJSON = (geojson, listings = [], insights = {}) => {
	if (!geojson || !Array.isArray(geojson.features)) return geojson;

	const metricsByLocation = buildPropertyLocationMetrics(listings, insights);
	const unmatched = [];

	const updatedFeatures = geojson.features.map((feature) => ({
		...feature,
		properties: {
			...feature.properties,
			property_listing_count: null,
			property_avg_rent: null,
			property_avg_rent_per_sqft: null,
			property_furnished_share: null,
			property_dominant_type: null,
			property_source_location: null,
		},
	}));

	metricsByLocation.forEach((metrics, locationKey) => {
		let bestIndex = -1;
		let bestScore = -1;

		updatedFeatures.forEach((feature, index) => {
			const cName = normalizeLocationName(feature?.properties?.CNAME_E);
			const community = normalizeLocationName(feature?.properties?.COMMUNITY_E);
			const score = Math.max(scoreLocationMatch(locationKey, cName), scoreLocationMatch(locationKey, community));
			if (score > bestScore) {
				bestScore = score;
				bestIndex = index;
			}
		});

		if (bestIndex === -1 || bestScore <= 0) {
			unmatched.push(metrics.locationName);
			return;
		}

		const current = updatedFeatures[bestIndex].properties;
		const hasCurrentData = current.property_listing_count !== null && current.property_listing_count !== undefined;
		if (hasCurrentData && current.property_listing_count > metrics.property_listing_count) {
			return;
		}

		updatedFeatures[bestIndex] = {
			...updatedFeatures[bestIndex],
			properties: {
				...current,
				...metrics,
				property_source_location: metrics.locationName,
			},
		};
	});

	return {
		...geojson,
		features: updatedFeatures,
		propertyUnmatchedLocations: unmatched,
	};
};

