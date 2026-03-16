import Foundation

@Observable
final class ShipperProfileViewModel {
    var shipper: Shipper?
    var companyName = ""
    var isLoading = false
    var isSaving = false
    var error: String?
    var successMessage: String?

    private let apiClient = APIClient.shared

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response: ShipperProfileResponse = try await apiClient.request(.shipperProfile)
            shipper = response.shipper
            companyName = response.shipper.companyName
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
            let response: ShipperProfileResponse = try await apiClient.request(.updateShipperProfile(companyName: companyName))
            shipper = response.shipper
            successMessage = "Profile updated!"
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
