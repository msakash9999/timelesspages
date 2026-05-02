const crypto = require("crypto");

const WAREHOUSE_COORDINATES = {
  lat: 28.6139,
  lng: 77.209
};

const COURIER_PARTNERS = [
  "Timeless Express",
  "North Star Couriers",
  "Swift Parcel",
  "Metro Line Delivery"
];

const STATUS_PROGRESS = {
  cancelled: 0,
  confirmed: 0.12,
  "in progress": 0.2,
  packed: 0.32,
  shipped: 0.48,
  "in transit": 0.68,
  "out for delivery": 0.88,
  delivered: 1
};

function roundCoordinate(value) {
  return Number(Number(value).toFixed(6));
}

function isValidCoordinate(candidate) {
  return (
    candidate &&
    Number.isFinite(Number(candidate.lat)) &&
    Number.isFinite(Number(candidate.lng))
  );
}

function hashToUnit(seed) {
  const digest = crypto.createHash("sha256").update(String(seed || "")).digest();
  return digest.readUInt32BE(0) / 0xffffffff;
}

function getAddressSeed(order) {
  return [
    order?.address?.addressLine,
    order?.address?.city,
    order?.address?.state,
    order?.address?.pincode,
    order?.userId,
    order?._id
  ]
    .filter(Boolean)
    .join("|") || "timelesspages";
}

function buildDestinationCoordinates(order) {
  const seed = getAddressSeed(order);
  const lat = WAREHOUSE_COORDINATES.lat + (hashToUnit(`${seed}:lat`) - 0.5) * 14;
  const lng = WAREHOUSE_COORDINATES.lng + (hashToUnit(`${seed}:lng`) - 0.5) * 18;
  return {
    lat: roundCoordinate(lat),
    lng: roundCoordinate(lng)
  };
}

function getProgressFromOrder(order) {
  const status = String(order?.orderStatus || "confirmed").trim().toLowerCase();
  if (STATUS_PROGRESS[status] !== undefined) {
    return STATUS_PROGRESS[status];
  }

  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const hoursPassed = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));

  if (hoursPassed >= 120) return 1;
  if (hoursPassed >= 96) return 0.88;
  if (hoursPassed >= 72) return 0.68;
  if (hoursPassed >= 48) return 0.48;
  if (hoursPassed >= 24) return 0.28;
  return 0.12;
}

function interpolatePoint(start, end, progress, wobble = 0) {
  const t = Math.max(0, Math.min(1, Number(progress || 0)));
  const lat = start.lat + (end.lat - start.lat) * t + wobble;
  const lng = start.lng + (end.lng - start.lng) * t - wobble / 2;
  return {
    lat: roundCoordinate(lat),
    lng: roundCoordinate(lng)
  };
}

function buildRoutePoints(start, end, progress) {
  const route = [];
  const steps = 5;
  for (let index = 0; index < steps; index += 1) {
    const t = steps === 1 ? 1 : index / (steps - 1);
    const wobble = Math.sin(Math.PI * t) * 0.28 * (1 - progress);
    route.push(interpolatePoint(start, end, t, wobble));
  }
  return route;
}

function getTrackingLocation(progress) {
  if (progress <= 0.12) return "Warehouse";
  if (progress <= 0.28) return "Sorting Center";
  if (progress <= 0.48) return "Regional Hub";
  if (progress <= 0.68) return "City Hub";
  if (progress <= 0.88) return "Out For Delivery";
  return "Delivered";
}

function getCourierPartner(seed) {
  const index = Math.floor(hashToUnit(`${seed}:courier`) * COURIER_PARTNERS.length);
  return COURIER_PARTNERS[index] || COURIER_PARTNERS[0];
}

function buildDeliveryEta(progress) {
  const daysRemaining = progress >= 1 ? 0 : progress >= 0.88 ? 1 : progress >= 0.68 ? 2 : progress >= 0.48 ? 3 : 4;
  const eta = new Date();
  eta.setDate(eta.getDate() + daysRemaining);
  eta.setHours(18, 0, 0, 0);
  return eta;
}

function buildDeliverySnapshot(order = {}) {
  const seed = getAddressSeed(order);
  const destinationCoordinates = isValidCoordinate(order.destinationCoordinates)
    ? {
        lat: Number(order.destinationCoordinates.lat),
        lng: Number(order.destinationCoordinates.lng)
      }
    : buildDestinationCoordinates(order);

  const progress = getProgressFromOrder(order);
  const currentLocation = isValidCoordinate(order.mapCoordinates)
    ? {
        lat: Number(order.mapCoordinates.lat),
        lng: Number(order.mapCoordinates.lng)
      }
    : interpolatePoint(WAREHOUSE_COORDINATES, destinationCoordinates, progress);
  const deliveryRoute = Array.isArray(order.deliveryRoute) && order.deliveryRoute.length > 1
    ? order.deliveryRoute
        .map((point) => ({
          lat: Number(point.lat),
          lng: Number(point.lng)
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    : buildRoutePoints(WAREHOUSE_COORDINATES, destinationCoordinates, progress);

  return {
    mapCoordinates: currentLocation,
    currentLocation,
    destinationCoordinates,
    deliveryRoute,
    deliveryProgress: Math.round(progress * 100),
    deliveryProgressLabel: `${Math.round(progress * 100)}%`,
    trackingLocation: order.trackingLocation || getTrackingLocation(progress),
    courierPartner: order.courierPartner || getCourierPartner(seed),
    deliveryETA: order.deliveryETA || buildDeliveryEta(progress)
  };
}

module.exports = {
  buildDeliverySnapshot,
  buildDeliveryEta,
  buildRoutePoints,
  buildDestinationCoordinates,
  getProgressFromOrder,
  getTrackingLocation,
  WAREHOUSE_COORDINATES
};
