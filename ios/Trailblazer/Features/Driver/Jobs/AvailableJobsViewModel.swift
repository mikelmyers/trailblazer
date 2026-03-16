import Foundation
import MapKit

@Observable
final class AvailableJobsViewModel {
    var jobs: [Job] = []
    var isLoading = false
    var error: String?
    var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    private let apiClient = APIClient.shared

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response: AvailableJobsResponse = try await apiClient.request(.availableJobs)
            jobs = response.jobs

            // Center map on jobs if available
            if let first = jobs.first {
                let lats = jobs.map(\.pickupLat)
                let lngs = jobs.map(\.pickupLng)
                let center = CLLocationCoordinate2D(
                    latitude: (lats.min()! + lats.max()!) / 2,
                    longitude: (lngs.min()! + lngs.max()!) / 2
                )
                let span = MKCoordinateSpan(
                    latitudeDelta: max((lats.max()! - lats.min()!) * 1.5, 0.05),
                    longitudeDelta: max((lngs.max()! - lngs.min()!) * 1.5, 0.05)
                )
                mapRegion = MKCoordinateRegion(center: center, span: span)
            }
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
