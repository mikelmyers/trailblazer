import Foundation

@Observable
final class DriverOnboardingViewModel {
    var currentStep = 0
    var selectedVehicleType: VehicleType = .CAR
    var serviceAreas: [String] = []
    var newArea = ""
    var connectStatus: Bool = false
    var isLoading = false
    var error: String?
    var stripeConnectURL: URL?

    private let apiClient = APIClient.shared

    let totalSteps = 3

    func saveProfile() async -> Bool {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let request = UpdateDriverRequest(
                vehicleType: selectedVehicleType.rawValue,
                serviceAreas: serviceAreas
            )
            let _: DriverMeResponse = try await apiClient.request(.updateDriverProfile(request))
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func startStripeConnect() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let response: StripeConnectResponse = try await apiClient.request(.stripeConnectOnboard)
            stripeConnectURL = URL(string: response.url)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func checkConnectStatus() async {
        do {
            let response: StripeConnectStatusResponse = try await apiClient.request(.stripeConnectStatus)
            connectStatus = response.onboarded
        } catch {
            // Non-critical
        }
    }

    func addServiceArea() {
        let trimmed = newArea.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !serviceAreas.contains(trimmed) else { return }
        serviceAreas.append(trimmed)
        newArea = ""
    }

    func removeServiceArea(_ area: String) {
        serviceAreas.removeAll { $0 == area }
    }
}
