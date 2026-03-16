import SwiftUI
import MapKit

struct AvailableJobsView: View {
    @State private var viewModel = AvailableJobsViewModel()
    @State private var showList = true

    var body: some View {
        VStack(spacing: 0) {
            // Map
            TrailblazerMapView(
                jobAnnotations: viewModel.jobs,
                showsUserLocation: true
            )
            .frame(height: showList ? 250 : .infinity)
            .animation(.easeInOut, value: showList)

            // Toggle
            Button {
                showList.toggle()
            } label: {
                HStack {
                    Image(systemName: showList ? "map.fill" : "list.bullet")
                    Text(showList ? "Full Map" : "Show List")
                        .font(.subheadline)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))
            }

            // Job List
            if showList {
                if viewModel.jobs.isEmpty && !viewModel.isLoading {
                    EmptyStateView(
                        icon: "briefcase",
                        title: "No Jobs Available",
                        message: "Check back soon for new delivery opportunities."
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.jobs) { job in
                                NavigationLink(value: job) {
                                    JobCardView(job: job)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(16)
                    }
                }
            }
        }
        .navigationTitle("Available Jobs")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Job.self) { job in
            JobDetailView(jobId: job.id)
        }
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
        .overlay {
            if viewModel.isLoading && viewModel.jobs.isEmpty {
                ProgressView()
            }
        }
    }
}
