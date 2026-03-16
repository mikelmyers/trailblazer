import Foundation
import SwiftUI

@Observable
final class AppState {
    var isAuthenticated = false
    var currentUser: SessionUser?
    var currentRole: Role?
    var hasSeenOnboarding: Bool {
        get { UserDefaults.standard.bool(forKey: UserDefaultsKeys.hasSeenOnboarding) }
        set { UserDefaults.standard.set(newValue, forKey: UserDefaultsKeys.hasSeenOnboarding) }
    }
    var isOnline = true
    var hasActiveJob = false
    var isCheckingSession = true

    var needsRoleSetup: Bool {
        guard isAuthenticated, let user = currentUser else { return false }
        return currentRole == nil
    }

    func updateFromAuth(_ authManager: AuthManager) {
        isAuthenticated = authManager.isAuthenticated
        currentUser = authManager.currentUser
        if let roleString = authManager.currentUser?.role {
            currentRole = Role(rawValue: roleString)
        }
        isCheckingSession = authManager.isLoading
    }
}
