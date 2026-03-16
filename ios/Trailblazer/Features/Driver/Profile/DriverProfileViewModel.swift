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
            let response: DriverResponse = try await apiClient.request(.driverMe)
            driver = response.driver
            selectedVehicleType = response.driver.vehicleType
            serviceAreas = response.driver.serviceAreas
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
            let response: DriverResponse = try await apiClient.request(.updateDriverProfile(request))
            driver = response.driver
            successMessage = "Profile updated!"
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
