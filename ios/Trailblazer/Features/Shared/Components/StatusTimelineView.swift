import SwiftUI

struct StatusTimelineView: View {
    let currentStatus: JobStatus
    let matchedAt: Date?
    let pickedUpAt: Date?
    let deliveredAt: Date?

    private let steps: [(label: String, status: JobStatus)] = [
        ("Posted", .POSTED),
        ("Matched", .MATCHED),
        ("En Route to Pickup", .EN_ROUTE_PICKUP),
        ("Picked Up", .PICKED_UP),
        ("En Route to Dropoff", .EN_ROUTE_DROPOFF),
        ("Delivered", .DELIVERED),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                let isCompleted = step.status.stepIndex <= currentStatus.stepIndex && !currentStatus.isTerminal
                let isCurrent = step.status == currentStatus

                HStack(spacing: 12) {
                    VStack(spacing: 0) {
                        Circle()
                            .fill(isCompleted || isCurrent ? Color.Brand.success : Color(.systemGray4))
                            .frame(width: 24, height: 24)
                            .overlay {
                                if isCompleted && !isCurrent {
                                    Image(systemName: "checkmark")
                                        .font(.caption2.bold())
                                        .foregroundStyle(.white)
                                }
                            }

                        if index < steps.count - 1 {
                            Rectangle()
                                .fill(isCompleted ? Color.Brand.success : Color(.systemGray4))
                                .frame(width: 2, height: 24)
                        }
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(step.label)
                            .font(isCurrent ? .subheadline.bold() : .subheadline)
                            .foregroundStyle(isCurrent ? .primary : .secondary)

                        if let time = timestamp(for: step.status) {
                            Text(time.shortDateTime)
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .padding(.bottom, index < steps.count - 1 ? 8 : 0)

                    Spacer()
                }
            }
        }
    }

    private func timestamp(for status: JobStatus) -> Date? {
        switch status {
        case .MATCHED: return matchedAt
        case .PICKED_UP: return pickedUpAt
        case .DELIVERED: return deliveredAt
        default: return nil
        }
    }
}
