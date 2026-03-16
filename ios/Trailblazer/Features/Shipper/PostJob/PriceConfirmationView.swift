import SwiftUI

struct PriceConfirmationView: View {
    @Bindable var viewModel: PostJobViewModel
    var onSubmit: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Confirm Price")
                    .font(.title2.bold())

                if let estimate = viewModel.priceEstimate {
                    // Route Info
                    HStack(spacing: 24) {
                        VStack {
                            Text(String(format: "%.1f km", estimate.route.distanceKm))
                                .font(.headline)
                            Text("Distance")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        VStack {
                            Text(String(format: "%.0f min", estimate.route.durationMin))
                                .font(.headline)
                            Text("Duration")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Price
                    VStack(spacing: 12) {
                        Text("Suggested Price")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text(estimate.suggestedPriceFormatted)
                            .font(.system(size: 48, weight: .bold, design: .rounded))

                        Text("Range: \(estimate.priceRange.minFormatted) - \(estimate.priceRange.maxFormatted)")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        // Price Slider
                        VStack(spacing: 4) {
                            Slider(
                                value: Binding(
                                    get: { Double(viewModel.selectedPriceCents) },
                                    set: { viewModel.selectedPriceCents = Int($0) }
                                ),
                                in: Double(estimate.priceRange.minCents)...Double(estimate.priceRange.maxCents),
                                step: 50
                            )
                            .tint(Color.Brand.primary)

                            Text("Your price: \(viewModel.selectedPriceCents.formattedCurrency)")
                                .font(.headline)
                        }
                    }
                    .padding(20)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Breakdown
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Price Breakdown")
                            .font(.subheadline.bold())
                        BreakdownRow(label: "Base Cost", value: estimate.breakdown.baseCost)
                        BreakdownRow(label: "Package", value: estimate.breakdown.package)
                        BreakdownRow(label: "Urgency", value: estimate.breakdown.urgency)
                        BreakdownRow(label: "Time", value: estimate.breakdown.time)
                        BreakdownRow(label: "Route", value: estimate.breakdown.routeComplexity)
                        BreakdownRow(label: "Region", value: estimate.breakdown.region)
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                // Submit
                Button(action: onSubmit) {
                    Group {
                        if viewModel.isSubmitting {
                            ProgressView().tint(.white)
                        } else {
                            Text("Post Delivery - \(viewModel.selectedPriceCents.formattedCurrency)")
                        }
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.Brand.success)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .disabled(viewModel.isSubmitting)
                .sensoryFeedback(.success, trigger: viewModel.createdJob != nil)

                if let error = viewModel.error {
                    ErrorBannerView(message: error) { viewModel.error = nil }
                }
            }
            .padding(24)
        }
    }
}

struct BreakdownRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
        }
    }
}
