import Foundation
import CoreLocation

actor LocationUploadService {
    private let apiClient = APIClient.shared
    private var lastUploadedLocation: CLLocation?
    private var lastUploadTime: Date?
    private let minimumInterval: TimeInterval = 30  // 30 seconds
    private let minimumDistance: CLLocationDistance = 100  // 100 meters

    func uploadIfNeeded(location: CLLocation) async {
        let now = Date()

        // Skip if both thresholds are unmet: time < 30s AND distance < 100m
        if let lastTime = lastUploadTime, now.timeIntervalSince(lastTime) < minimumInterval,
           let lastLocation = lastUploadedLocation, location.distance(from: lastLocation) < minimumDistance {
            return
        }

        do {
            let _: LocationUpdateResponse = try await apiClient.request(
                .updateLocation(lat: location.coordinate.latitude, lng: location.coordinate.longitude)
            )
            lastUploadedLocation = location
            lastUploadTime = now
        } catch {
            print("Location upload failed: \(error.localizedDescription)")
        }
    }
}
