import Foundation

@Observable
final class ShipperDashboardViewModel {
    var stats: ShipperStats?
    var recentJobs: [Job] = []
    var isLoading = false
    var error: String?

    private let apiClient = APIClient.shared

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            async let statsReq: ShipperStats = apiClient.request(.shipperStats)
            async let jobsReq: JobListResponse = apiClient.request(.shipperJobs(status: nil, limit: 5))

            let (s, j) = try await (statsReq, jobsReq)
            stats = s
            recentJobs = j.jobs
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
