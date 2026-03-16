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

struct DriverResponse: Codable {
    let driver: Driver
}

struct ShipperProfileResponse: Codable {
    let shipper: Shipper
}

struct AvailableJobsResponse: Codable {
    let jobs: [Job]
}
