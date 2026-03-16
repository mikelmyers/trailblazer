import SwiftUI

extension Color {
    enum Brand {
        static let primary = Color(red: 0.18, green: 0.50, blue: 0.91)     // Blue
        static let secondary = Color(red: 0.09, green: 0.11, blue: 0.17)   // Dark
        static let accent = Color(red: 0.96, green: 0.65, blue: 0.14)      // Amber
        static let success = Color(red: 0.16, green: 0.71, blue: 0.47)     // Green
        static let warning = Color(red: 0.96, green: 0.65, blue: 0.14)     // Amber
        static let error = Color(red: 0.91, green: 0.27, blue: 0.27)       // Red
        static let background = Color(.systemBackground)
        static let secondaryBackground = Color(.secondarySystemBackground)
        static let tertiaryBackground = Color(.tertiarySystemBackground)
    }
}

extension Color {
    /// Color for a job status badge
    static func forStatus(_ status: JobStatus) -> Color {
        switch status {
        case .POSTED: return .Brand.primary
        case .MATCHING: return .Brand.accent
        case .MATCHED: return .Brand.success
        case .EN_ROUTE_PICKUP: return .orange
        case .PICKED_UP: return .Brand.accent
        case .EN_ROUTE_DROPOFF: return .orange
        case .DELIVERED: return .Brand.success
        case .CANCELLED: return .gray
        case .FAILED: return .Brand.error
        case .REFUNDED: return .purple
        }
    }

    static func forUrgency(_ urgency: Urgency) -> Color {
        switch urgency {
        case .STANDARD: return .Brand.primary
        case .EXPRESS: return .Brand.accent
        case .CRITICAL: return .Brand.error
        }
    }
}
