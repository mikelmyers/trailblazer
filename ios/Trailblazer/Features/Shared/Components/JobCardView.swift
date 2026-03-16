import SwiftUI

struct JobCardView: View {
    let job: Job

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                StatusBadgeView(status: job.status)
                Spacer()
                if let price = job.priceCents {
                    Text(price.formattedCurrency)
                        .font(.headline.monospacedDigit())
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.up.circle.fill")
                        .foregroundStyle(Color.Brand.success)
                        .font(.caption)
                    Text(job.pickupAddress)
                        .font(.subheadline)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    Image(systemName: "arrow.down.circle.fill")
                        .foregroundStyle(Color.Brand.error)
                        .font(.caption)
                    Text(job.dropoffAddress)
                        .font(.subheadline)
                        .lineLimit(1)
                }
            }

            HStack {
                if let size = job.packageSize {
                    Label(size.displayName, systemImage: "shippingbox")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if let urgency = job.urgency {
                    Label(urgency.displayName, systemImage: "bolt.fill")
                        .font(.caption)
                        .foregroundStyle(Color.forUrgency(urgency))
                }

                Spacer()

                if let date = job.createdAt {
                    Text(date.relativeFormatted)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
