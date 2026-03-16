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
            async let profileReq: DriverResponse = apiClient.request(.driverMe)

            let (s, p) = try await (statsReq, profileReq)
            stats = s
            profile = p.driver

            // Check for active job
            do {
                let jobResponse: JobResponse = try await apiClient.request(.activeJob)
                activeJob = jobResponse.job
            } catch {
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
            let response: AvailabilityResponse = try await apiClient.request(.updateAvailability(isAvailable: newValue))
            profile = profile.map { driver in
                var d = driver
                // Re-fetch profile to get updated availability
                return d
            }
            await load() // Refresh all data
            NotificationCenter.default.post(name: .driverAvailabilityChanged, object: nil)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
