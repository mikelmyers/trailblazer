import Foundation

@Observable
final class EarningsViewModel {
    var earnings: EarningsSummary?
    var isLoading = false
    var error: String?

    private let apiClient = APIClient.shared

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            earnings = try await apiClient.request(.driverEarnings)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
