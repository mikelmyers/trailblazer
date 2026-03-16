import Foundation

struct ShipperStats: Codable {
    let activeJobs: Int
    let jobsThisMonth: Int
    let monthlyLimit: Int?
    let averageRating: Double
    let tier: ShipperTier
}
