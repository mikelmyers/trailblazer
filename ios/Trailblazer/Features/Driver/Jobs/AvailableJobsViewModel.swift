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

            // Center map on jobs that have coordinates
            let jobsWithCoords = jobs.filter { $0.pickupLat != nil && $0.pickupLng != nil }
            if !jobsWithCoords.isEmpty {
                let lats = jobsWithCoords.compactMap(\.pickupLat)
                let lngs = jobsWithCoords.compactMap(\.pickupLng)
                if let minLat = lats.min(), let maxLat = lats.max(),
                   let minLng = lngs.min(), let maxLng = lngs.max() {
                    let center = CLLocationCoordinate2D(
                        latitude: (minLat + maxLat) / 2,
                        longitude: (minLng + maxLng) / 2
                    )
                    let span = MKCoordinateSpan(
                        latitudeDelta: max((maxLat - minLat) * 1.5, 0.05),
                        longitudeDelta: max((maxLng - minLng) * 1.5, 0.05)
                    )
                    mapRegion = MKCoordinateRegion(center: center, span: span)
                }
            }
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
