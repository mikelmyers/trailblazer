import Foundation

enum VehicleType: String, Codable, CaseIterable {
    case BIKE
    case CAR
    case VAN
    case TRUCK
    case CARGO_VAN

    var displayName: String {
        switch self {
        case .BIKE: return "Bike"
        case .CAR: return "Car"
        case .VAN: return "Van"
        case .TRUCK: return "Truck"
        case .CARGO_VAN: return "Cargo Van"
        }
    }
}

enum DriverTier: String, Codable, CaseIterable {
    case FREE
    case STANDARD
    case PRO

    var displayName: String {
        switch self {
        case .FREE: return "Free"
        case .STANDARD: return "Standard"
        case .PRO: return "Pro"
        }
    }

    var monthlyPrice: String {
        switch self {
        case .FREE: return "$0"
        case .STANDARD: return "$49"
        case .PRO: return "$99"
        }
    }
}

struct Driver: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let vehicleType: VehicleType
    let serviceAreas: [String]
    let isAvailable: Bool
    let currentLat: Double?
    let currentLng: Double?
    let lastLocationAt: Date?
    let subscriptionTier: DriverTier
    let subscriptionStatus: String?
    let stripeConnectOnboarded: Bool
    let rating: Double
    let totalJobs: Int
    let createdAt: Date?
    let user: DriverUser?
}

struct DriverUser: Codable, Hashable {
    let name: String?
    let email: String?
    let image: String?
}

struct JobDriver: Codable, Hashable {
    let id: String
    let userId: String
    let vehicleType: VehicleType
    let rating: Double
    let user: DriverUser?
}

struct UpdateDriverRequest: Encodable {
    let vehicleType: String?
    let serviceAreas: [String]?
}

struct LocationUpdateResponse: Codable {
    let driver: LocationDriver
}

struct LocationDriver: Codable {
    let id: String
    let currentLat: Double?
    let currentLng: Double?
    let lastLocationAt: Date?
}
