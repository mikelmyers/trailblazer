import SwiftUI

struct ShipperJobListView: View {
    @State private var viewModel = ShipperJobListViewModel()

    var body: some View {
        VStack(spacing: 0) {
            Picker("Filter", selection: $viewModel.selectedFilter) {
                ForEach(ShipperJobListViewModel.JobFilter.allCases, id: \.self) { filter in
                    Text(filter.rawValue).tag(filter)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .onChange(of: viewModel.selectedFilter) { _, newFilter in
                viewModel.changeFilter(newFilter)
            }

            if viewModel.jobs.isEmpty && !viewModel.isLoading {
                EmptyStateView(
                    icon: "shippingbox",
                    title: "No Jobs",
                    message: "Post a delivery to get started.",
                    actionLabel: "Post Job"
                ) {
                    // Navigate to post job
                }
                .frame(maxHeight: .infinity)
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
        .navigationTitle("My Jobs")
        .navigationDestination(for: Job.self) { job in
            ShipperJobDetailView(jobId: job.id)
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
