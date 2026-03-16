import Foundation

@Observable
final class DriverProfileViewModel {
    var driver: Driver?
    var isLoading = false
    var isSaving = false
    var error: String?
    var successMessage: String?

    // Edit fields
    var selectedVehicleType: VehicleType = .CAR
    var serviceAreas: [String] = []

    private let apiClient = APIClient.shared

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response: DriverMeResponse = try await apiClient.request(.driverMe)
            let d = response.toDriver()
            driver = d
            selectedVehicleType = d.vehicleType
            serviceAreas = d.serviceAreas
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func save() async {
        isSaving = true
        error = nil
        successMessage = nil
        defer { isSaving = false }

        do {
            let request = UpdateDriverRequest(
                vehicleType: selectedVehicleType.rawValue,
                serviceAreas: serviceAreas
            )
            let response: DriverMeResponse = try await apiClient.request(.updateDriverProfile(request))
            driver = response.toDriver()
            successMessage = "Profile updated!"
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
