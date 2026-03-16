import Foundation

enum ShipperTier: String, Codable, CaseIterable {
    case CASUAL
    case STARTER
    case GROWTH

    var displayName: String {
        switch self {
        case .CASUAL: return "Casual"
        case .STARTER: return "Starter"
        case .GROWTH: return "Growth"
        }
    }

    var description: String {
        switch self {
        case .CASUAL: return "Pay per delivery"
        case .STARTER: return "Limited monthly jobs"
        case .GROWTH: return "Unlimited deliveries"
        }
    }
}

struct Shipper: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let companyName: String
    let subscriptionTier: ShipperTier
    let subscriptionStatus: String?
    let monthlyJobCount: Int
    let createdAt: Date?
}

struct JobShipper: Codable, Hashable {
    let id: String
    let companyName: String
    let userId: String?
}
