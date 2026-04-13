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

const normalizeText = (value) => {
	if (value === null || value === undefined) return '';
	return String(value)
		.toLowerCase()
		.replace(/\([^)]*\)/g, ' ')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
};

const extractPoint = (listing) => {
	const lng = toNumber(listing?.Longitude);
	const lat = toNumber(listing?.Latitude);
	if (lng === null || lat === null) return null;
	return [lng, lat];
};

const isPointInRing = ([x, y], ring) => {
	let inside = false;
	for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
		const [xi, yi] = ring[index];
		const [xj, yj] = ring[previous];
		const intersects = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
		if (intersects) inside = !inside;
	}
	return inside;
};

const isPointInPolygon = (point, polygon) => {
	if (!Array.isArray(polygon) || polygon.length === 0) return false;
	if (polygon.length > 0 && Array.isArray(polygon[0]) && Array.isArray(polygon[0][0])) {
		const outerRing = polygon[0];
		if (!isPointInRing(point, outerRing)) return false;
		for (let index = 1; index < polygon.length; index += 1) {
			if (isPointInRing(point, polygon[index])) return false;
		}
		return true;
	}
	return isPointInRing(point, polygon);
};

const getGeometryPolygons = (geometry) => {
	if (!geometry) return [];
	if (geometry.type === 'Polygon') return [geometry.coordinates];
	if (geometry.type === 'MultiPolygon') return geometry.coordinates;
	return [];
};

const getGeometryBounds = (geometry) => {
	const polygons = getGeometryPolygons(geometry);
	let minLng = Infinity;
	let minLat = Infinity;
	let maxLng = -Infinity;
	let maxLat = -Infinity;

	polygons.forEach((polygon) => {
		polygon.forEach((ring) => {
			ring.forEach(([lng, lat]) => {
				if (lng < minLng) minLng = lng;
				if (lat < minLat) minLat = lat;
				if (lng > maxLng) maxLng = lng;
				if (lat > maxLat) maxLat = lat;
			});
		});
	});

	if (!Number.isFinite(minLng)) return null;
	return [minLng, minLat, maxLng, maxLat];
};

const boundsContainPoint = (bounds, point) => {
	if (!bounds) return true;
	const [minLng, minLat, maxLng, maxLat] = bounds;
	const [lng, lat] = point;
	return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
};

const getListingText = (listing) => normalizeText([
	listing?.Address,
	listing?.Location,
	listing?.Type,
	listing?.Furnishing,
	listing?.Beds,
	listing?.Baths,
	listing?.Rent,
	listing?.Rent_per_sqft,
].filter(Boolean).join(' '));

const matchesSearch = (listing, query) => {
	if (!query) return true;
	const haystack = getListingText(listing);
	const needles = normalizeText(query).split(' ').filter(Boolean);
	if (needles.length === 0) return true;
	return needles.every((needle) => haystack.includes(needle));
};

const doesListingMatchSelection = (listing, selection = {}) => {
	const beds = toNumber(listing?.Beds);
	const baths = toNumber(listing?.Baths);
	const type = normalizeText(listing?.Type);
	const furnishing = normalizeText(listing?.Furnishing);
	const furnishingClass = classifyFurnishingLabel(listing?.Furnishing);
	const location = normalizeLocationName(listing?.Location);
	const address = normalizeText(listing?.Address);

	if (selection.type && type !== selection.type) return false;
	if (selection.furnishing && furnishing !== selection.furnishing) return false;
	if (selection.furnishingClass && furnishingClass !== selection.furnishingClass) return false;
	if (selection.beds !== null && selection.beds !== undefined && beds !== selection.beds) return false;
	if (selection.baths !== null && selection.baths !== undefined && baths !== selection.baths) return false;
	if (selection.location) {
		const target = normalizeLocationName(selection.location);
		if (!location.includes(target) && !address.includes(target)) return false;
	}

	return true;
};

export const filterPropertyListings = (listings = [], filters = {}) => {
	const minRent = toNumber(filters.minRent);
	const maxRent = toNumber(filters.maxRent);
	const minBeds = toNumber(filters.minBeds);
	const maxBeds = toNumber(filters.maxBeds);
	const minBaths = toNumber(filters.minBaths);
	const maxBaths = toNumber(filters.maxBaths);
	const minRentPerSqft = toNumber(filters.minRentPerSqft);
	const maxRentPerSqft = toNumber(filters.maxRentPerSqft);
	const locationFilter = normalizeLocationName(filters.location);
	const query = normalizeText(filters.searchQuery);
	const comboSelections = Array.isArray(filters.comboSelections)
		? filters.comboSelections
			.map((combo) => ({
				beds: toNumber(combo?.beds),
				baths: toNumber(combo?.baths),
				type: normalizeText(combo?.type),
				furnishing: normalizeText(combo?.furnishing),
				furnishingClass: normalizeText(combo?.furnishingClass),
				location: combo?.location ? String(combo.location) : null,
			}))
			.filter((combo) => combo.type || combo.furnishing || combo.furnishingClass || combo.location || combo.beds !== null || combo.baths !== null)
		: [];

	return listings.filter((listing) => {
		const rent = toNumber(listing?.Rent);
		const beds = toNumber(listing?.Beds);
		const baths = toNumber(listing?.Baths);
		const rentPerSqft = toNumber(listing?.Rent_per_sqft);
		const type = normalizeText(listing?.Type);
		const furnishing = normalizeText(listing?.Furnishing);
		const location = normalizeLocationName(listing?.Location);

		if (minRent !== null && (rent === null || rent < minRent)) return false;
		if (maxRent !== null && (rent === null || rent > maxRent)) return false;
		if (minBeds !== null && (beds === null || beds < minBeds)) return false;
		if (maxBeds !== null && (beds === null || beds > maxBeds)) return false;
		if (minBaths !== null && (baths === null || baths < minBaths)) return false;
		if (maxBaths !== null && (baths === null || baths > maxBaths)) return false;
		if (minRentPerSqft !== null && (rentPerSqft === null || rentPerSqft < minRentPerSqft)) return false;
		if (maxRentPerSqft !== null && (rentPerSqft === null || rentPerSqft > maxRentPerSqft)) return false;
		if (filters.type && type !== normalizeText(filters.type)) return false;
		if (filters.furnishing && furnishing !== normalizeText(filters.furnishing)) return false;
		if (comboSelections.length > 0) {
			const matchesCombo = comboSelections.some((combo) => doesListingMatchSelection(listing, combo));

			if (!matchesCombo) return false;
		}
		if (locationFilter && !location.includes(locationFilter) && !normalizeText(listing?.Address).includes(locationFilter)) return false;
		if (query && !matchesSearch(listing, query)) return false;
		return true;
	});
};

export const getPropertyPointsGeoJSON = (listings = []) => ({
	type: 'FeatureCollection',
	features: listings
		.filter((listing) => extractPoint(listing))
		.map((listing) => {
			const selectionIndex = -1;
			return {
				type: 'Feature',
				properties: {
					address: listing?.Address ?? null,
					rent: toNumber(listing?.Rent),
					beds: toNumber(listing?.Beds),
					baths: toNumber(listing?.Baths),
					type: listing?.Type ?? null,
					furnishing: listing?.Furnishing ?? null,
					location: listing?.Location ?? null,
					rent_per_sqft: toNumber(listing?.Rent_per_sqft),
					selection_index: selectionIndex,
					listing: listing,
				},
				geometry: {
					type: 'Point',
					coordinates: extractPoint(listing),
				},
			};
		}),
});

export const getPropertyPointsGeoJSONWithSelections = (listings = [], selections = []) => ({
	type: 'FeatureCollection',
	features: listings
		.filter((listing) => extractPoint(listing))
		.map((listing) => {
			const selectionIndex = selections.findIndex((selection) => doesListingMatchSelection(listing, selection));
			return {
				type: 'Feature',
				properties: {
					address: listing?.Address ?? null,
					rent: toNumber(listing?.Rent),
					beds: toNumber(listing?.Beds),
					baths: toNumber(listing?.Baths),
					type: listing?.Type ?? null,
					furnishing: listing?.Furnishing ?? null,
					location: listing?.Location ?? null,
					rent_per_sqft: toNumber(listing?.Rent_per_sqft),
					selection_index: selectionIndex,
					listing: listing,
				},
				geometry: {
					type: 'Point',
					coordinates: extractPoint(listing),
				},
			};
		}),
});

const getAreaAccumulator = () => ({
	listingCount: 0,
	totalRent: 0,
	rentCount: 0,
	totalRentPerSqft: 0,
	rentPerSqftCount: 0,
	typeCounts: {},
	typeMetrics: {},
	furnishingCounts: {},
	bedsCounts: {},
	bathsCounts: {},
	comboCounts: {},
});

const updateAccumulator = (accumulator, listing) => {
	accumulator.listingCount += 1;

	const rent = toNumber(listing?.Rent);
	if (rent !== null) {
		accumulator.totalRent += rent;
		accumulator.rentCount += 1;
	}

	const rentPerSqft = toNumber(listing?.Rent_per_sqft);
	if (rentPerSqft !== null) {
		accumulator.totalRentPerSqft += rentPerSqft;
		accumulator.rentPerSqftCount += 1;
	}

	const type = listing?.Type ? String(listing.Type).trim() : 'Unknown';
	accumulator.typeCounts[type] = (accumulator.typeCounts[type] || 0) + 1;
	if (!accumulator.typeMetrics[type]) {
		accumulator.typeMetrics[type] = {
			listingCount: 0,
			totalRent: 0,
			rentCount: 0,
			totalRentPerSqft: 0,
			rentPerSqftCount: 0,
			furnishedCount: 0,
		};
	}
	const currentTypeMetric = accumulator.typeMetrics[type];
	currentTypeMetric.listingCount += 1;
	if (rent !== null) {
		currentTypeMetric.totalRent += rent;
		currentTypeMetric.rentCount += 1;
	}
	if (rentPerSqft !== null) {
		currentTypeMetric.totalRentPerSqft += rentPerSqft;
		currentTypeMetric.rentPerSqftCount += 1;
	}

	const furnishing = listing?.Furnishing ? String(listing.Furnishing).trim() : 'Unknown';
	accumulator.furnishingCounts[furnishing] = (accumulator.furnishingCounts[furnishing] || 0) + 1;
	if (classifyFurnishingLabel(furnishing) === 'furnished') {
		currentTypeMetric.furnishedCount += 1;
	}

	const beds = listing?.Beds !== null && listing?.Beds !== undefined ? String(listing.Beds) : 'Unknown';
	accumulator.bedsCounts[beds] = (accumulator.bedsCounts[beds] || 0) + 1;

	const baths = listing?.Baths !== null && listing?.Baths !== undefined ? String(listing.Baths) : 'Unknown';
	accumulator.bathsCounts[baths] = (accumulator.bathsCounts[baths] || 0) + 1;

	const comboKey = `${beds}|${baths}|${type}`;
	if (!accumulator.comboCounts[comboKey]) {
		accumulator.comboCounts[comboKey] = {
			beds,
			baths,
			type,
			count: 0,
			totalRent: 0,
			rentCount: 0,
			totalRentPerSqft: 0,
			rentPerSqftCount: 0,
			furnishedCount: 0,
		};
	}
	accumulator.comboCounts[comboKey].count += 1;
	if (rent !== null) {
		accumulator.comboCounts[comboKey].totalRent += rent;
		accumulator.comboCounts[comboKey].rentCount += 1;
	}
	if (rentPerSqft !== null) {
		accumulator.comboCounts[comboKey].totalRentPerSqft += rentPerSqft;
		accumulator.comboCounts[comboKey].rentPerSqftCount += 1;
	}
	if (classifyFurnishingLabel(furnishing) === 'furnished') {
		accumulator.comboCounts[comboKey].furnishedCount += 1;
	}
};

const getDominantValue = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

const classifyFurnishingLabel = (label) => {
	const normalizedLabel = String(label || '').toLowerCase();
	if (normalizedLabel.includes('unfurnished')) return 'unfurnished';
	if (normalizedLabel.includes('furnished')) return 'furnished';
	return 'unknown';
};

const getFurnishingCategoryMetrics = (furnishingCounts = {}) => {
	let furnishedCount = 0;
	let unfurnishedCount = 0;

	Object.entries(furnishingCounts).forEach(([label, count]) => {
		const furnishingClass = classifyFurnishingLabel(label);
		const numericCount = Number(count) || 0;
		if (furnishingClass === 'unfurnished') {
			unfurnishedCount += numericCount;
			return;
		}
		if (furnishingClass === 'furnished') {
			furnishedCount += numericCount;
		}
	});

	let dominantFurnishing = 'unknown';
	if (furnishedCount > 0 || unfurnishedCount > 0) {
		if (furnishedCount > unfurnishedCount) dominantFurnishing = 'furnished';
		else if (unfurnishedCount > furnishedCount) dominantFurnishing = 'unfurnished';
		else dominantFurnishing = 'mixed';
	}

	return {
		furnishedCount,
		unfurnishedCount,
		dominantFurnishing,
	};
};

const pointMatchesFeature = (point, feature) => {
	if (!point || !feature?.geometry) return false;
	const bounds = feature.__bounds ?? getGeometryBounds(feature.geometry);
	if (!boundsContainPoint(bounds, point)) return false;

	const polygons = getGeometryPolygons(feature.geometry);
	return polygons.some((polygon) => isPointInPolygon(point, polygon));
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

	const updatedFeatures = geojson.features.map((feature) => ({
		...feature,
		__bounds: getGeometryBounds(feature.geometry),
		properties: {
			...feature.properties,
			property_listing_count: 0,
			property_avg_rent: null,
			property_avg_rent_per_sqft: null,
			property_furnished_share: null,
			property_unfurnished_share: null,
			property_dominant_type: null,
			property_source_location: null,
			property_total_rent: null,
			property_total_rent_per_sqft: null,
			property_type_counts: null,
			property_type_metrics: null,
			property_furnishing_counts: null,
			property_beds_counts: null,
			property_baths_counts: null,
			property_combo_metrics: null,
		},
	}));

	const accumulators = updatedFeatures.map(() => getAreaAccumulator());
	const unmatchedListings = [];

	listings.forEach((listing) => {
		const point = extractPoint(listing);
		if (!point) return;

		const featureIndex = updatedFeatures.findIndex((feature) => pointMatchesFeature(point, feature));
		if (featureIndex === -1) {
			unmatchedListings.push(listing);
			return;
		}

		updateAccumulator(accumulators[featureIndex], listing);
	});

	const fallbackUnmatchedListings = [];
	unmatchedListings.forEach((listing) => {
		const locationKey = normalizeLocationName(listing?.Location || listing?.Address);
		if (!locationKey) {
			fallbackUnmatchedListings.push(listing);
			return;
		}

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
			fallbackUnmatchedListings.push(listing);
			return;
		}

		updateAccumulator(accumulators[bestIndex], listing);
	});

	const processedFeatures = updatedFeatures.map((feature, index) => {
		const accumulator = accumulators[index];
		const property_listing_count = accumulator.listingCount;
		const property_avg_rent = accumulator.rentCount > 0 ? accumulator.totalRent / accumulator.rentCount : null;
		const property_avg_rent_per_sqft = accumulator.rentPerSqftCount > 0 ? accumulator.totalRentPerSqft / accumulator.rentPerSqftCount : null;
		const sortedComboCounts = Object.values(accumulator.comboCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, 20);
		const comboMetrics = Object.values(accumulator.comboCounts)
			.sort((a, b) => b.count - a.count)
			.map((combo) => ({
				beds: combo.beds,
				baths: combo.baths,
				type: combo.type,
				count: combo.count,
				avgRent: combo.rentCount > 0 ? combo.totalRent / combo.rentCount : null,
				avgRentPerSqft: combo.rentPerSqftCount > 0 ? combo.totalRentPerSqft / combo.rentPerSqftCount : null,
				furnishedShare: combo.count > 0 ? (combo.furnishedCount / combo.count) * 100 : null,
			}));
		const furnishedTotal = Object.entries(accumulator.furnishingCounts)
			.filter(([label]) => classifyFurnishingLabel(label) === 'furnished')
			.reduce((sum, [, count]) => sum + count, 0);
		const furnishingCategoryMetrics = getFurnishingCategoryMetrics(accumulator.furnishingCounts);
		const propertyTypeMetrics = Object.entries(accumulator.typeMetrics).reduce((result, [type, metric]) => {
			result[type] = {
				listingCount: metric.listingCount,
				avgRent: metric.rentCount > 0 ? metric.totalRent / metric.rentCount : null,
				avgRentPerSqft: metric.rentPerSqftCount > 0 ? metric.totalRentPerSqft / metric.rentPerSqftCount : null,
				furnishedShare: metric.listingCount > 0 ? (metric.furnishedCount / metric.listingCount) * 100 : null,
			};
			return result;
		}, {});

		return {
			...feature,
			properties: {
				...feature.properties,
				property_listing_count,
				property_avg_rent,
				property_avg_rent_per_sqft,
				property_furnished_share: property_listing_count > 0 ? (furnishedTotal / property_listing_count) * 100 : null,
				property_unfurnished_share: property_listing_count > 0 ? (furnishingCategoryMetrics.unfurnishedCount / property_listing_count) * 100 : null,
				property_dominant_type: getDominantValue(accumulator.typeCounts),
				property_source_location: feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || null,
				property_total_rent: accumulator.totalRent,
				property_total_rent_per_sqft: accumulator.totalRentPerSqft,
				property_type_counts: accumulator.typeCounts,
				property_type_metrics: propertyTypeMetrics,
				property_furnishing_counts: accumulator.furnishingCounts,
				property_furnished_count: furnishingCategoryMetrics.furnishedCount,
				property_unfurnished_count: furnishingCategoryMetrics.unfurnishedCount,
				property_dominant_furnishing: furnishingCategoryMetrics.dominantFurnishing,
				property_beds_counts: accumulator.bedsCounts,
				property_baths_counts: accumulator.bathsCounts,
				property_combo_counts: sortedComboCounts,
				property_combo_metrics: comboMetrics,
			},
		};
	});

	return {
		...geojson,
		features: processedFeatures,
		propertyUnmatchedListings: fallbackUnmatchedListings,
		propertySummary: {
			totalListings: listings.length,
			matchedListings: listings.length - fallbackUnmatchedListings.length,
			unmatchedListings: fallbackUnmatchedListings.length,
		},
	};
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

