import SwiftUI

struct AppRootView: View {
    @State private var appState = AppState()
    @State private var authManager = AuthManager.shared

    var body: some View {
        Group {
            if appState.isCheckingSession {
                LaunchScreenView()
            } else if !appState.hasSeenOnboarding {
                OnboardingView {
                    appState.hasSeenOnboarding = true
                }
            } else if !appState.isAuthenticated {
                AuthNavigationView()
            } else {
                MainTabView()
            }
        }
        .environment(appState)
        .environment(authManager)
        .task {
            await authManager.checkSession()
            appState.updateFromAuth(authManager)
        }
        .onChange(of: authManager.isAuthenticated) {
            appState.updateFromAuth(authManager)
        }
    }
}

struct LaunchScreenView: View {
    var body: some View {
        ZStack {
            Color.Brand.primary.ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "shippingbox.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.white)
                Text("Trailblazer")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                ProgressView()
                    .tint(.white)
            }
        }
    }
}

struct AuthNavigationView: View {
    var body: some View {
        NavigationStack {
            SignInView()
        }
    }
}
