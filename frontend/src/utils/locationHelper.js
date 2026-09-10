/**
 * Helper utilities for extracting and formatting customer delivery locations
 * and Google Maps live navigation links across Artisan and Admin order views.
 */

/**
 * Parses an order and returns structured location data including
 * direct Google Maps links, GPS coordinates, and clean delivery address.
 * 
 * @param {Object|string} orderOrAddress Order object or shipping address string
 * @returns {Object} Extracted location metadata
 */
export function extractOrderLocation(orderOrAddress) {
  let shippingAddress = '';
  let liveLocationUrl = null;
  let latitude = null;
  let longitude = null;

  if (typeof orderOrAddress === 'string') {
    shippingAddress = orderOrAddress || '';
  } else if (orderOrAddress && typeof orderOrAddress === 'object') {
    shippingAddress = orderOrAddress.shipping_address || '';
    liveLocationUrl = orderOrAddress.live_location_url || null;
    latitude = orderOrAddress.latitude || null;
    longitude = orderOrAddress.longitude || null;
  }

  // 1. Check if direct live_location_url exists
  if (liveLocationUrl && typeof liveLocationUrl === 'string' && liveLocationUrl.includes('google.com/maps')) {
    const coordsMatch = liveLocationUrl.match(/[?&]q=([-\d.]+),([-\d.]+)/);
    if (coordsMatch) {
      latitude = parseFloat(coordsMatch[1]);
      longitude = parseFloat(coordsMatch[2]);
    }
  }

  // 2. Check if shipping address contains a Google Maps URL
  if (!latitude && shippingAddress) {
    const urlMatch = shippingAddress.match(/https:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com)[/?][^\s"'()]+/i);
    if (urlMatch) {
      const candidateUrl = urlMatch[0].replace(/[,.]+$/, '');
      const coordsMatch = candidateUrl.match(/[?&]q=([-\d.]+),([-\d.]+)/);
      if (coordsMatch) {
        latitude = parseFloat(coordsMatch[1]);
        longitude = parseFloat(coordsMatch[2]);
        liveLocationUrl = candidateUrl;
      }
    }
  }

  // 3. Check if shipping address contains GPS coordinates e.g. (GPS: 12.34567, 76.54321) or GPS: 12.34567, 76.54321
  if ((!latitude || !longitude) && shippingAddress) {
    const gpsMatch = shippingAddress.match(/(?:GPS|Location):\s*([-\d.]+)[,\s]+([-\d.]+)/i);
    if (gpsMatch) {
      latitude = parseFloat(gpsMatch[1]);
      longitude = parseFloat(gpsMatch[2]);
      if (!liveLocationUrl && !isNaN(latitude) && !isNaN(longitude)) {
        liveLocationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      }
    }
  }

  const hasLiveGps = !!(latitude && longitude && !isNaN(latitude) && !isNaN(longitude));

  // Determine the effective Google Maps navigation URL
  let mapsUrl = liveLocationUrl;
  if (hasLiveGps) {
    mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  } else {
    // Graceful fallback: Google Maps search URL with postal address
    const cleanQuery = shippingAddress
      .replace(/📍\s*Live Location:.*$/i, '')
      .replace(/\(GPS:.*?\)/gi, '')
      .replace(/\[Method:.*?\]/gi, '')
      .trim();
    if (cleanQuery) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;
    } else {
      mapsUrl = null;
    }
  }

  // Generate clean readable address without messy internal GPS tokens
  const cleanAddress = shippingAddress
    .replace(/📍\s*Live Location:.*$/i, '')
    .replace(/\(GPS:.*?\)/gi, '')
    .replace(/\[Method:.*?\]/gi, '')
    .trim()
    .replace(/,\s*$/, '');

  const coordinatesText = hasLiveGps
    ? `${Number(latitude).toFixed(5)}°, ${Number(longitude).toFixed(5)}°`
    : null;

  return {
    hasLiveGps,
    mapsUrl,
    liveLocationUrl: hasLiveGps ? mapsUrl : null,
    latitude: hasLiveGps ? latitude : null,
    longitude: hasLiveGps ? longitude : null,
    coordinatesText,
    cleanAddress: cleanAddress || shippingAddress,
    rawAddress: shippingAddress
  };
}
