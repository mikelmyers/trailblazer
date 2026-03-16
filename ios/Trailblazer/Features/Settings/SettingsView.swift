import SwiftUI

struct SettingsView: View {
    @State private var viewModel = SettingsViewModel()
    @Environment(AppState.self) private var appState
    @State private var showSignOutConfirmation = false

    var body: some View {
        List {
            Section("Notifications") {
                Toggle("Push Notifications", isOn: $viewModel.notificationsEnabled)
                    .onChange(of: viewModel.notificationsEnabled) { _, newValue in
                        if newValue {
                            Task { await PushNotificationService.requestPermission() }
                        }
                    }
            }

            Section("Security") {
                if BiometricAuthService.availableBiometricType != .none {
                    Toggle(
                        BiometricAuthService.availableBiometricType == .faceID ? "Face ID Unlock" : "Touch ID Unlock",
                        isOn: $viewModel.biometricEnabled
                    )
                }
            }

            Section("Appearance") {
                Picker("Theme", selection: $viewModel.preferredTheme) {
                    Text("System").tag("system")
                    Text("Light").tag("light")
                    Text("Dark").tag("dark")
                }
            }

            if appState.currentRole != nil {
                Section("Role") {
                    Button("Switch Role") {
                        appState.currentRole = appState.currentRole == .DRIVER ? .SHIPPER : .DRIVER
                    }
                    HStack {
                        Text("Current Role")
                        Spacer()
                        Text(appState.currentRole?.rawValue.capitalized ?? "-")
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section {
                Button(role: .destructive) {
                    showSignOutConfirmation = true
                } label: {
                    HStack {
                        Text("Sign Out")
                        Spacer()
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                }
            }

            Section {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Settings")
        .confirmationDialog("Sign out?", isPresented: $showSignOutConfirmation) {
            Button("Sign Out", role: .destructive) {
                Task { await viewModel.signOut() }
            }
            Button("Cancel", role: .cancel) {}
        }
    }
}
