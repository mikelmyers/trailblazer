import SwiftUI
import MapKit

struct ActiveJobView: View {
    let jobId: String
    @State private var viewModel = ActiveJobViewModel()
    @State private var showCancelConfirmation = false
    @State private var showAdvanceConfirmation = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if let job = viewModel.job {
            VStack(spacing: 0) {
                // Map
                TrailblazerMapView(
                    pickupCoordinate: CLLocationCoordinate2D(latitude: job.pickupLat, longitude: job.pickupLng),
                    dropoffCoordinate: CLLocationCoordinate2D(latitude: job.dropoffLat, longitude: job.dropoffLng),
                    showsUserLocation: true
                )
                .frame(height: 280)

                // Job Info Card
                ScrollView {
                    VStack(spacing: 16) {
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

                        // Navigate Button
                        let destination = job.status.stepIndex <= 2
                            ? CLLocationCoordinate2D(latitude: job.pickupLat, longitude: job.pickupLng)
                            : CLLocationCoordinate2D(latitude: job.dropoffLat, longitude: job.dropoffLng)
                        let destName = job.status.stepIndex <= 2 ? job.pickupAddress : job.dropoffAddress

                        Button {
                            openInMaps(coordinate: destination, name: destName)
                        } label: {
                            Label("Navigate", systemImage: "location.fill")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.Brand.primary)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        // Action Buttons
                        if let actionLabel = job.status.driverActionLabel {
                            Button {
                                showAdvanceConfirmation = true
                            } label: {
                                Text(actionLabel)
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                                    .background(Color.Brand.success)
                                    .foregroundStyle(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                            }
                            .sensoryFeedback(.impact(weight: .heavy), trigger: showAdvanceConfirmation)
                        }

                        if job.status == .DELIVERED {
                            VStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 48))
                                    .foregroundStyle(Color.Brand.success)
                                Text("Delivery Complete!")
                                    .font(.title3.bold())
                                if let payout = job.driverPayoutCents {
                                    Text("Earned: \(payout.formattedCurrency)")
                                        .font(.headline)
                                        .foregroundStyle(Color.Brand.success)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(24)
                            .background(Color.Brand.success.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        }

                        // Cancel (only for certain statuses)
                        if job.status.validTransitions.contains(.CANCELLED) {
                            Button(role: .destructive) {
                                showCancelConfirmation = true
                            } label: {
                                Text("Cancel Job")
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
            .navigationTitle("Active Delivery")
            .navigationBarTitleDisplayMode(.inline)
            .loadingOverlay(isPresented: viewModel.isUpdating)
            .confirmationDialog("Confirm Action", isPresented: $showAdvanceConfirmation) {
                if let label = job.status.driverActionLabel {
                    Button(label) {
                        Task { await viewModel.advanceStatus() }
                    }
                }
                Button("Cancel", role: .cancel) {}
            }
            .confirmationDialog("Cancel this job?", isPresented: $showCancelConfirmation) {
                Button("Cancel Job", role: .destructive) {
                    Task {
                        if await viewModel.cancelJob() {
                            dismiss()
                        }
                    }
                }
                Button("Keep Job", role: .cancel) {}
            }
        } else {
            ProgressView()
                .task { await viewModel.load(jobId: jobId) }
        }
    }

    private func openInMaps(coordinate: CLLocationCoordinate2D, name: String) {
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = name
        mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving])
    }
}
