import Foundation

@Observable
final class ShipperOnboardingViewModel {
    var companyName = ""
    var selectedTier: ShipperTier = .CASUAL
    var isLoading = false
    var error: String?

    private let apiClient = APIClient.shared

    var isValid: Bool {
        !companyName.trimmingCharacters(in: .whitespaces).isEmpty
    }

    func submit() async -> Bool {
        guard isValid else {
            error = "Please enter your company name."
            return false
        }

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let _: MessageResponse = try await apiClient.request(
                .shipperOnboarding(companyName: companyName.trimmingCharacters(in: .whitespaces), selectedTier: selectedTier.rawValue)
            )
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
