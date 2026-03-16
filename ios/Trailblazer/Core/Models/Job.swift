import Foundation

enum JobStatus: String, Codable, CaseIterable {
    case POSTED
    case MATCHING
    case MATCHED
    case EN_ROUTE_PICKUP
    case PICKED_UP
    case EN_ROUTE_DROPOFF
    case DELIVERED
    case CANCELLED
    case FAILED
    case REFUNDED

    var displayName: String {
        switch self {
        case .POSTED: return "Posted"
        case .MATCHING: return "Matching"
        case .MATCHED: return "Matched"
        case .EN_ROUTE_PICKUP: return "En Route to Pickup"
        case .PICKED_UP: return "Picked Up"
        case .EN_ROUTE_DROPOFF: return "En Route to Dropoff"
        case .DELIVERED: return "Delivered"
        case .CANCELLED: return "Cancelled"
        case .FAILED: return "Failed"
        case .REFUNDED: return "Refunded"
        }
    }

    var isActive: Bool {
        switch self {
        case .POSTED, .MATCHING, .MATCHED, .EN_ROUTE_PICKUP, .PICKED_UP, .EN_ROUTE_DROPOFF:
            return true
        default:
            return false
        }
    }

    var isTerminal: Bool {
        switch self {
        case .DELIVERED, .CANCELLED, .FAILED, .REFUNDED:
            return true
        default:
            return false
        }
    }

    /// Valid next statuses per the backend state machine
    var validTransitions: [JobStatus] {
        switch self {
        case .POSTED: return [.MATCHING, .CANCELLED]
        case .MATCHING: return [.MATCHED, .CANCELLED, .FAILED]
        case .MATCHED: return [.EN_ROUTE_PICKUP, .CANCELLED]
        case .EN_ROUTE_PICKUP: return [.PICKED_UP, .CANCELLED, .FAILED]
        case .PICKED_UP: return [.EN_ROUTE_DROPOFF, .FAILED]
        case .EN_ROUTE_DROPOFF: return [.DELIVERED, .FAILED]
        case .DELIVERED: return [.REFUNDED]
        case .CANCELLED, .FAILED, .REFUNDED: return []
        }
    }

    /// The next driver action status (for the active job flow)
    var nextDriverAction: JobStatus? {
        switch self {
        case .MATCHED: return .EN_ROUTE_PICKUP
        case .EN_ROUTE_PICKUP: return .PICKED_UP
        case .PICKED_UP: return .EN_ROUTE_DROPOFF
        case .EN_ROUTE_DROPOFF: return .DELIVERED
        default: return nil
        }
    }

    var driverActionLabel: String? {
        switch self {
        case .MATCHED: return "Start Pickup"
        case .EN_ROUTE_PICKUP: return "Confirm Pickup"
        case .PICKED_UP: return "Start Delivery"
        case .EN_ROUTE_DROPOFF: return "Confirm Delivery"
        default: return nil
        }
    }

    var stepIndex: Int {
        switch self {
        case .POSTED, .MATCHING: return 0
        case .MATCHED: return 1
        case .EN_ROUTE_PICKUP: return 2
        case .PICKED_UP: return 3
        case .EN_ROUTE_DROPOFF: return 4
        case .DELIVERED: return 5
        case .CANCELLED, .FAILED, .REFUNDED: return -1
        }
    }
}

enum Urgency: String, Codable, CaseIterable {
    case STANDARD
    case EXPRESS
    case CRITICAL

    var displayName: String {
        switch self {
        case .STANDARD: return "Standard"
        case .EXPRESS: return "Express"
        case .CRITICAL: return "Critical"
        }
    }
}

enum PackageSize: String, Codable, CaseIterable {
    case ENVELOPE
    case SMALL
    case MEDIUM
    case LARGE
    case PALLET

    var displayName: String {
        switch self {
        case .ENVELOPE: return "Envelope"
        case .SMALL: return "Small"
        case .MEDIUM: return "Medium"
        case .LARGE: return "Large"
        case .PALLET: return "Pallet"
        }
    }
}

struct Job: Codable, Identifiable {
    let id: String
    let status: JobStatus
    let urgency: Urgency
    let pickupAddress: String
    let pickupLat: Double
    let pickupLng: Double
    let dropoffAddress: String
    let dropoffLat: Double
    let dropoffLng: Double
    let description: String?
    let packageSize: PackageSize
    let priceCents: Int?
    let suggestedPriceCents: Int?
    let platformFeeCents: Int?
    let driverPayoutCents: Int?
    let createdAt: Date?
    let matchedAt: Date?
    let pickedUpAt: Date?
    let deliveredAt: Date?
    let shipper: JobShipper?
    let driver: JobDriver?
}

struct JobResponse: Codable {
    let job: Job
}

struct JobListResponse: Codable {
    let jobs: [Job]
    let pagination: Pagination?
}

struct Pagination: Codable {
    let page: Int?
    let limit: Int?
    let total: Int?
    let totalPages: Int?
}

struct CreateJobRequest: Encodable {
    let pickupAddress: String
    let pickupLat: Double
    let pickupLng: Double
    let dropoffAddress: String
    let dropoffLat: Double
    let dropoffLng: Double
    let packageSize: String
    let urgency: String
    let description: String?
    let priceCents: Int
}

struct UpdateJobStatusRequest: Encodable {
    let status: String
}
