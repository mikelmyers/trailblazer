import CoreLocation

extension CLLocationCoordinate2D {
    /// Distance to another coordinate in meters
    func distance(to other: CLLocationCoordinate2D) -> CLLocationDistance {
        let from = CLLocation(latitude: latitude, longitude: longitude)
        let to = CLLocation(latitude: other.latitude, longitude: other.longitude)
        return from.distance(from: to)
    }

    /// Distance to another coordinate in kilometers
    func distanceKm(to other: CLLocationCoordinate2D) -> Double {
        distance(to: other) / 1000.0
    }
}
