import Foundation

struct MessageResponse: Codable {
    let message: String
}

struct ErrorResponse: Codable {
    let error: String
    let details: [String: [String]]?
}

struct SignUpResponse: Codable {
    let message: String
    let userId: String?
}

struct CSRFResponse: Codable {
    let csrfToken: String
}

struct AvailabilityResponse: Codable {
    let isAvailable: Bool
}

struct StripeCheckoutResponse: Codable {
    let url: String
}

struct StripePortalResponse: Codable {
    let url: String
}

struct StripeConnectResponse: Codable {
    let url: String
}

struct StripeConnectStatusResponse: Codable {
    let onboarded: Bool
    let accountId: String?
}

struct SubscriptionResponse: Codable {
    let tier: String
    let status: String?
    let currentPeriodEnd: Date?
}

/// Matches the flat response from /api/drivers/me
struct DriverMeResponse: Codable {
    let id: String
    let userName: String
    let email: String?
    let image: String?
    let isAvailable: Bool
    let vehicleType: VehicleType
    let serviceAreas: [String]
    let rating: Double
    let totalJobs: Int
    let subscriptionTier: DriverTier
    let subscriptionStatus: String?
    let stripeConnectOnboarded: Bool
    let activeJobId: String?

    /// Convert to a Driver model for use in the app
    func toDriver() -> Driver {
        Driver(
            id: id,
            userId: "",
            vehicleType: vehicleType,
            serviceAreas: serviceAreas,
            isAvailable: isAvailable,
            currentLat: nil,
            currentLng: nil,
            lastLocationAt: nil,
            subscriptionTier: subscriptionTier,
            subscriptionStatus: subscriptionStatus,
            stripeConnectOnboarded: stripeConnectOnboarded,
            rating: rating,
            totalJobs: totalJobs,
            createdAt: nil,
            user: DriverUser(name: userName, email: email, image: image)
        )
    }
}

/// Wrapper for endpoints that return { driver: {...} }
struct DriverResponse: Codable {
    let driver: Driver
}

/// Matches the flat response from /api/shipper/profile
struct ShipperProfileResponse: Codable {
    let companyName: String
    let contactEmail: String?
    let defaultPackageSize: String?
    let defaultUrgency: String?
    let defaultSpecialInstructions: String?
}

struct OkResponse: Codable {
    let ok: Bool
}

struct AvailableJobsResponse: Codable {
    let jobs: [Job]
}
