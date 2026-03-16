import Foundation

@Observable
final class ShipperProfileViewModel {
    var companyName = ""
    var contactEmail: String?
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
            companyName = response.companyName
            contactEmail = response.contactEmail
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
            let _: OkResponse = try await apiClient.request(.updateShipperProfile(companyName: companyName))
            successMessage = "Profile updated!"
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
