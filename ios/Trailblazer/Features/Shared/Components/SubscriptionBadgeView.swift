import SwiftUI

struct SubscriptionBadgeView: View {
    let tier: String

    var body: some View {
        Text(tier)
            .font(.caption.bold())
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(colorForTier)
            .clipShape(Capsule())
    }

    private var colorForTier: Color {
        switch tier.uppercased() {
        case "PRO", "GROWTH": return Color.Brand.accent
        case "STANDARD", "STARTER": return Color.Brand.primary
        default: return .gray
        }
    }
}
