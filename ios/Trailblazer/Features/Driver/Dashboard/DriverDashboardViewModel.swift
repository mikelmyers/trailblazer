import Foundation

@Observable
final class DriverDashboardViewModel {
    var stats: DriverStats?
    var profile: Driver?
    var activeJob: Job?
    var isLoading = false
    var isTogglingAvailability = false
    var error: String?

    private let apiClient = APIClient.shared

    var isAvailable: Bool {
        profile?.isAvailable ?? false
    }

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            async let statsReq: DriverStats = apiClient.request(.driverStats)
            async let profileReq: DriverMeResponse = apiClient.request(.driverMe)

            let (s, p) = try await (statsReq, profileReq)
            stats = s
            profile = p.toDriver()

            // Check for active job using the activeJobId from profile
            if let activeJobId = p.activeJobId {
                do {
                    let jobResponse: JobResponse = try await apiClient.request(.getJob(id: activeJobId))
                    activeJob = jobResponse.job
                } catch {
                    activeJob = nil
                }
            } else {
                activeJob = nil
            }
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggleAvailability(_ newValue: Bool) async {
        isTogglingAvailability = true
        defer { isTogglingAvailability = false }

        do {
            let _: AvailabilityResponse = try await apiClient.request(.updateAvailability(isAvailable: newValue))
            await load()
            NotificationCenter.default.post(name: .driverAvailabilityChanged, object: nil)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
