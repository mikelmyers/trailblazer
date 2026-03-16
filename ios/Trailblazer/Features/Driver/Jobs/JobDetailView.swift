import SwiftUI
import MapKit

struct JobDetailView: View {
    let jobId: String
    @State private var viewModel = JobDetailViewModel()
    @State private var showAcceptConfirmation = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            if let job = viewModel.job {
                VStack(spacing: 20) {
                    // Map
                    TrailblazerMapView(
                        pickupCoordinate: job.pickupCoordinate,
                        dropoffCoordinate: job.dropoffCoordinate
                    )
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Status & Price
                    HStack {
                        StatusBadgeView(status: job.status)
                        Spacer()
                        if let price = job.priceCents {
                            Text(price.formattedCurrency)
                                .font(.title2.bold())
                        }
                    }

                    // Addresses
                    VStack(spacing: 12) {
                        AddressRow(icon: "arrow.up.circle.fill", color: .Brand.success, label: "Pickup", address: job.pickupAddress)
                        Divider()
                        AddressRow(icon: "arrow.down.circle.fill", color: .Brand.error, label: "Dropoff", address: job.dropoffAddress)
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Details
                    VStack(spacing: 12) {
                        if let size = job.packageSize {
                            DetailRow(label: "Package Size", value: size.displayName)
                        }
                        if let urgency = job.urgency {
                            DetailRow(label: "Urgency", value: urgency.displayName)
                        }
                        if let desc = job.description, !desc.isEmpty {
                            DetailRow(label: "Notes", value: desc)
                        }
                        if let payout = job.driverPayoutCents {
                            DetailRow(label: "Your Payout", value: payout.formattedCurrency)
                        }
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Shipper Info
                    if let shipper = job.shipper {
                        HStack {
                            Image(systemName: "building.2.fill")
                                .foregroundStyle(.secondary)
                            Text(shipper.companyName)
                                .font(.subheadline)
                            Spacer()
                        }
                        .padding(16)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }

                    // Action Button
                    if job.status == .POSTED {
                        Button {
                            showAcceptConfirmation = true
                        } label: {
                            Text("Accept Job")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(Color.Brand.success)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        }
                        .sensoryFeedback(.impact(weight: .medium), trigger: showAcceptConfirmation)
                    }

                    if let error = viewModel.error {
                        ErrorBannerView(message: error) { viewModel.error = nil }
                    }
                }
                .padding(16)
            }
        }
        .navigationTitle("Job Details")
        .navigationBarTitleDisplayMode(.inline)
        .loadingOverlay(isPresented: viewModel.isUpdating, message: "Accepting job...")
        .overlay {
            if viewModel.isLoading && viewModel.job == nil {
                ProgressView()
            }
        }
        .confirmationDialog("Accept this job?", isPresented: $showAcceptConfirmation) {
            Button("Accept") {
                Task {
                    if await viewModel.updateStatus(jobId: jobId, newStatus: .MATCHED) {
                        dismiss()
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        }
        .task { await viewModel.load(jobId: jobId) }
    }
}

struct AddressRow: View {
    let icon: String
    let color: Color
    let label: String
    let address: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(address)
                    .font(.subheadline)
            }
            Spacer()
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.bold())
        }
    }
}
