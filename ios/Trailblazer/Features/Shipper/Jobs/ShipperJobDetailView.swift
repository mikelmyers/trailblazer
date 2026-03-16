import SwiftUI
import MapKit

struct ShipperJobDetailView: View {
    let jobId: String
    @State private var viewModel = ShipperJobDetailViewModel()
    @State private var showCancelConfirmation = false

    var body: some View {
        ScrollView {
            if let job = viewModel.job {
                VStack(spacing: 20) {
                    // Map with driver location
                    TrailblazerMapView(
                        pickupCoordinate: CLLocationCoordinate2D(latitude: job.pickupLat, longitude: job.pickupLng),
                        dropoffCoordinate: CLLocationCoordinate2D(latitude: job.dropoffLat, longitude: job.dropoffLng)
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

                    // Status Timeline
                    StatusTimelineView(
                        currentStatus: job.status,
                        matchedAt: job.matchedAt,
                        pickedUpAt: job.pickedUpAt,
                        deliveredAt: job.deliveredAt
                    )
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Addresses
                    VStack(spacing: 12) {
                        AddressRow(icon: "arrow.up.circle.fill", color: .Brand.success, label: "Pickup", address: job.pickupAddress)
                        Divider()
                        AddressRow(icon: "arrow.down.circle.fill", color: .Brand.error, label: "Dropoff", address: job.dropoffAddress)
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Driver Info
                    if let driver = job.driver {
                        HStack(spacing: 12) {
                            Image(systemName: "person.circle.fill")
                                .font(.title)
                                .foregroundStyle(Color.Brand.primary)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(driver.user?.name ?? "Driver")
                                    .font(.headline)
                                HStack(spacing: 4) {
                                    RatingStarsView(rating: driver.rating, starSize: 12)
                                    Text(driver.vehicleType.displayName)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Spacer()
                        }
                        .padding(16)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }

                    // Details
                    VStack(spacing: 12) {
                        DetailRow(label: "Package Size", value: job.packageSize.displayName)
                        DetailRow(label: "Urgency", value: job.urgency.displayName)
                        if let desc = job.description, !desc.isEmpty {
                            DetailRow(label: "Notes", value: desc)
                        }
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Cancel
                    if job.status.validTransitions.contains(.CANCELLED) {
                        Button(role: .destructive) {
                            showCancelConfirmation = true
                        } label: {
                            Text("Cancel Delivery")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
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
        .loadingOverlay(isPresented: viewModel.isCancelling, message: "Cancelling...")
        .overlay {
            if viewModel.isLoading && viewModel.job == nil {
                ProgressView()
            }
        }
        .confirmationDialog("Cancel this delivery?", isPresented: $showCancelConfirmation) {
            Button("Cancel Delivery", role: .destructive) {
                Task { await viewModel.cancelJob(jobId: jobId) }
            }
            Button("Keep", role: .cancel) {}
        }
        .task {
            await viewModel.load(jobId: jobId)
            viewModel.startPolling(jobId: jobId)
        }
        .onDisappear {
            viewModel.stopPolling()
        }
    }
}
