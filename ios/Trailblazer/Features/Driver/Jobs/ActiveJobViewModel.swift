import Foundation
import MapKit

@Observable
final class ActiveJobViewModel {
    var job: Job?
    var isLoading = false
    var isUpdating = false
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

    func advanceStatus() async -> Bool {
        guard let job, let nextStatus = job.status.nextDriverAction else { return false }

        isUpdating = true
        error = nil
        defer { isUpdating = false }

        do {
            let response: JobResponse = try await apiClient.request(
                .updateJobStatus(id: job.id, status: nextStatus.rawValue)
            )
            self.job = response.job
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func cancelJob() async -> Bool {
        guard let job else { return false }

        isUpdating = true
        error = nil
        defer { isUpdating = false }

        do {
            let response: JobResponse = try await apiClient.request(
                .updateJobStatus(id: job.id, status: JobStatus.CANCELLED.rawValue)
            )
            self.job = response.job
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
        pollTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 10_000_000_000) // 10 seconds
                if Task.isCancelled { break }
                await load(jobId: jobId)
            }
        }
    }

    func stopPolling() {
        pollTask?.cancel()
        pollTask = nil
    }
}
