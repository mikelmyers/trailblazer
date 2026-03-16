import Foundation

@Observable
final class DriverJobHistoryViewModel {
    var jobs: [Job] = []
    var isLoading = false
    var error: String?
    var selectedFilter: JobFilter = .all
    var currentPage = 1
    var hasMore = true

    private let apiClient = APIClient.shared
    private let pageSize = 20

    enum JobFilter: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case completed = "Completed"
        case cancelled = "Cancelled"

        var statusParam: String? {
            switch self {
            case .all: return nil
            case .active: return "ACTIVE"
            case .completed: return "COMPLETED"
            case .cancelled: return "CANCELLED"
            }
        }
    }

    func load() async {
        isLoading = true
        error = nil
        currentPage = 1
        defer { isLoading = false }

        do {
            let response: JobListResponse = try await apiClient.request(
                .driverJobs(status: selectedFilter.statusParam, page: 1, limit: pageSize)
            )
            jobs = response.jobs
            hasMore = response.jobs.count >= pageSize
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadMore() async {
        guard hasMore, !isLoading else { return }
        currentPage += 1

        do {
            let response: JobListResponse = try await apiClient.request(
                .driverJobs(status: selectedFilter.statusParam, page: currentPage, limit: pageSize)
            )
            jobs.append(contentsOf: response.jobs)
            hasMore = response.jobs.count >= pageSize
        } catch {
            currentPage -= 1
        }
    }

    func changeFilter(_ filter: JobFilter) {
        selectedFilter = filter
        Task { await load() }
    }
}
