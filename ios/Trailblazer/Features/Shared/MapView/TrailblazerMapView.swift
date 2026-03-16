import SwiftUI
import MapKit

struct TrailblazerMapView: View {
    var pickupCoordinate: CLLocationCoordinate2D?
    var dropoffCoordinate: CLLocationCoordinate2D?
    var driverCoordinate: CLLocationCoordinate2D?
    var jobAnnotations: [Job] = []
    var showsUserLocation: Bool = false
    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        Map(position: $position) {
            if showsUserLocation {
                UserAnnotation()
            }

            if let pickup = pickupCoordinate {
                Annotation("Pickup", coordinate: pickup) {
                    JobAnnotationView(type: .pickup)
                }
            }

            if let dropoff = dropoffCoordinate {
                Annotation("Dropoff", coordinate: dropoff) {
                    JobAnnotationView(type: .dropoff)
                }
            }

            if let driver = driverCoordinate {
                Annotation("Driver", coordinate: driver) {
                    DriverAnnotationView()
                }
            }

            ForEach(jobAnnotations.filter { $0.pickupLat != nil && $0.pickupLng != nil }) { job in
                Annotation(job.pickupAddress, coordinate: CLLocationCoordinate2D(latitude: job.pickupLat!, longitude: job.pickupLng!)) {
                    JobAnnotationView(type: .pickup)
                }
            }
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
    }
}

extension TrailblazerMapView {
    func focusOnRoute() -> TrailblazerMapView {
        var copy = self
        if let pickup = pickupCoordinate, let dropoff = dropoffCoordinate {
            let region = MKCoordinateRegion(
                center: CLLocationCoordinate2D(
                    latitude: (pickup.latitude + dropoff.latitude) / 2,
                    longitude: (pickup.longitude + dropoff.longitude) / 2
                ),
                span: MKCoordinateSpan(
                    latitudeDelta: abs(pickup.latitude - dropoff.latitude) * 1.5,
                    longitudeDelta: abs(pickup.longitude - dropoff.longitude) * 1.5
                )
            )
            copy.position = .region(region)
        }
        return copy
    }
}
