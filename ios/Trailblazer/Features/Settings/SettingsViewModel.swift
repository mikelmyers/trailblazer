import Foundation
import SwiftUI

@Observable
final class SettingsViewModel {
    var notificationsEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: UserDefaultsKeys.notificationsEnabled) }
        set { UserDefaults.standard.set(newValue, forKey: UserDefaultsKeys.notificationsEnabled) }
    }

    var biometricEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: UserDefaultsKeys.biometricUnlockEnabled) }
        set { UserDefaults.standard.set(newValue, forKey: UserDefaultsKeys.biometricUnlockEnabled) }
    }

    var preferredTheme: String {
        get { UserDefaults.standard.string(forKey: UserDefaultsKeys.preferredTheme) ?? "system" }
        set { UserDefaults.standard.set(newValue, forKey: UserDefaultsKeys.preferredTheme) }
    }

    func signOut() async {
        await AuthManager.shared.signOut()
        await CacheService.shared.clearAll()
    }
}
