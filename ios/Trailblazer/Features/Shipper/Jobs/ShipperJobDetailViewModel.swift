import Foundation

@Observable
final class ShipperJobDetailViewModel {
    var job: Job?
    var isLoading = false
    var isCancelling = false
    var error: String?
    private var pollTask: Task<Void, Never>?

    private let apiClient = APIClient.shared

    func load(jobId: String) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response: JobResponse = try await apiClient.request(.getJob(id: jobId))
            job = response.job
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func cancelJob(jobId: String) async -> Bool {
        isCancelling = true
        error = nil
        defer { isCancelling = false }

        do {
            let response: JobResponse = try await apiClient.request(
                .updateJobStatus(id: jobId, status: JobStatus.CANCELLED.rawValue)
            )
            job = response.job
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func startPolling(jobId: String) {
        guard job?.status.isActive == true else { return }
        pollTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 10_000_000_000)
                if Task.isCancelled { break }
                await load(jobId: jobId)
                if job?.status.isTerminal == true {
                    break
                }
            }
        }
    }

    func stopPolling() {
        pollTask?.cancel()
        pollTask = nil
    }
}
