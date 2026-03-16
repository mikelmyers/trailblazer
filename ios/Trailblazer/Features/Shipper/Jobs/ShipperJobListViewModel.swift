import Foundation

@Observable
final class ShipperJobListViewModel {
    var jobs: [Job] = []
    var isLoading = false
    var error: String?
    var selectedFilter: JobFilter = .active

    private let apiClient = APIClient.shared

    enum JobFilter: String, CaseIterable {
        case active = "Active"
        case completed = "Completed"
        case all = "All"

        var statusParam: String? {
            switch self {
            case .active: return "active"
            case .completed: return "DELIVERED"
            case .all: return nil
            }
        }
    }

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response: JobListResponse = try await apiClient.request(
                .shipperJobs(status: selectedFilter.statusParam, limit: 50)
            )
            jobs = response.jobs
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func changeFilter(_ filter: JobFilter) {
        selectedFilter = filter
        Task { await load() }
    }
}
