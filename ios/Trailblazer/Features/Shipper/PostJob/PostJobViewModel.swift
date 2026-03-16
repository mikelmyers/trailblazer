import Foundation
import MapKit

@Observable
final class PostJobViewModel {
    // Step tracking
    var currentStep = 0
    let totalSteps = 4

    // Step 1: Pickup
    var pickupAddress = ""
    var pickupLat: Double?
    var pickupLng: Double?

    // Step 2: Dropoff
    var dropoffAddress = ""
    var dropoffLat: Double?
    var dropoffLng: Double?

    // Step 3: Package Details
    var packageSize: PackageSize = .SMALL
    var urgency: Urgency = .STANDARD
    var jobDescription = ""

    // Step 4: Price
    var priceEstimate: PriceEstimateResponse?
    var selectedPriceCents: Int = 0

    // State
    var isLoading = false
    var isSubmitting = false
    var error: String?
    var createdJob: Job?

    private let apiClient = APIClient.shared

    var canProceedToPrice: Bool {
        pickupLat != nil && pickupLng != nil && dropoffLat != nil && dropoffLng != nil
    }

    func setPickup(address: String, coordinate: CLLocationCoordinate2D) {
        pickupAddress = address
        pickupLat = coordinate.latitude
        pickupLng = coordinate.longitude
    }

    func setDropoff(address: String, coordinate: CLLocationCoordinate2D) {
        dropoffAddress = address
        dropoffLat = coordinate.latitude
        dropoffLng = coordinate.longitude
    }

    func fetchPriceEstimate() async {
        guard let pLat = pickupLat, let pLng = pickupLng,
              let dLat = dropoffLat, let dLng = dropoffLng else { return }

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let request = PriceEstimateRequest(
                pickupLat: pLat, pickupLng: pLng,
                dropoffLat: dLat, dropoffLng: dLng,
                packageSize: packageSize.rawValue,
                urgency: urgency.rawValue
            )
            priceEstimate = try await apiClient.request(.priceEstimate(request))
            selectedPriceCents = priceEstimate?.suggestedPriceCents ?? 0
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func submitJob() async -> Bool {
        guard let pLat = pickupLat, let pLng = pickupLng,
              let dLat = dropoffLat, let dLng = dropoffLng else { return false }

        isSubmitting = true
        error = nil
        defer { isSubmitting = false }

        do {
            let request = CreateJobRequest(
                pickupAddress: pickupAddress,
                pickupLat: pLat,
                pickupLng: pLng,
                dropoffAddress: dropoffAddress,
                dropoffLat: dLat,
                dropoffLng: dLng,
                packageSize: packageSize.rawValue,
                urgency: urgency.rawValue,
                description: jobDescription.isEmpty ? nil : jobDescription,
                priceCents: selectedPriceCents
            )
            let response: JobResponse = try await apiClient.request(.createJob(request))
            createdJob = response.job
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }
}
