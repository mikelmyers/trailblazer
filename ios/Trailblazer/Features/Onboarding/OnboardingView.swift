import SwiftUI

struct OnboardingView: View {
    var onComplete: () -> Void
    @State private var viewModel = OnboardingViewModel()

    var body: some View {
        VStack {
            TabView(selection: $viewModel.currentPage) {
                OnboardingPageView(
                    icon: "shippingbox.fill",
                    title: "Deliver Anything",
                    description: "From envelopes to pallets, Trailblazer connects you with on-demand delivery drivers.",
                    color: .Brand.primary
                )
                .tag(0)

                OnboardingPageView(
                    icon: "location.fill",
                    title: "Real-Time Tracking",
                    description: "Track your deliveries live on the map. Know exactly where your package is.",
                    color: .Brand.success
                )
                .tag(1)

                OnboardingPageView(
                    icon: "dollarsign.circle.fill",
                    title: "Earn On Your Schedule",
                    description: "Drivers set their own hours and earn competitive payouts for every delivery.",
                    color: .Brand.accent
                )
                .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            Button {
                if viewModel.currentPage < viewModel.totalPages - 1 {
                    withAnimation { viewModel.currentPage += 1 }
                } else {
                    onComplete()
                }
            } label: {
                Text(viewModel.currentPage < viewModel.totalPages - 1 ? "Next" : "Get Started")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.Brand.primary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)

            if viewModel.currentPage < viewModel.totalPages - 1 {
                Button("Skip") { onComplete() }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 16)
            }
        }
    }
}
