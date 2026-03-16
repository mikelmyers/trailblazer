import Foundation

@Observable
final class JobDetailViewModel {
    var job: Job?
    var isLoading = false
    var isUpdating = false
    var error: String?

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

    func updateStatus(jobId: String, newStatus: JobStatus) async -> Bool {
        isUpdating = true
        error = nil
        defer { isUpdating = false }

        do {
            let response: JobResponse = try await apiClient.request(
                .updateJobStatus(id: jobId, status: newStatus.rawValue)
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
}
