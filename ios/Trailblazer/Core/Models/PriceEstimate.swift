import Foundation

struct PriceEstimateRequest: Encodable {
    let pickupLat: Double
    let pickupLng: Double
    let dropoffLat: Double
    let dropoffLng: Double
    let packageSize: String
    let urgency: String
}

struct PriceEstimateResponse: Codable {
    let suggestedPriceCents: Int
    let suggestedPriceFormatted: String
    let priceRange: PriceRange
    let breakdown: PriceBreakdown
    let route: RouteInfo
}

struct PriceRange: Codable {
    let minCents: Int
    let maxCents: Int
    let minFormatted: String
    let maxFormatted: String
}

struct PriceBreakdown: Codable {
    let baseCost: String
    let package: String
    let urgency: String
    let time: String
    let routeComplexity: String
    let region: String
}

struct RouteInfo: Codable {
    let distanceKm: Double
    let durationMin: Double
}
