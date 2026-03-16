import SwiftUI

struct DriverJobHistoryView: View {
    @State private var viewModel = DriverJobHistoryViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Filter Picker
            Picker("Filter", selection: $viewModel.selectedFilter) {
                ForEach(DriverJobHistoryViewModel.JobFilter.allCases, id: \.self) { filter in
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
                    icon: "clock",
                    title: "No Jobs Yet",
                    message: "Your completed and past jobs will appear here."
                )
                .frame(maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.jobs) { job in
                            NavigationLink(value: job) {
                                JobCardView(job: job)
                            }
                            .buttonStyle(.plain)
                            .onAppear {
                                if job.id == viewModel.jobs.last?.id {
                                    Task { await viewModel.loadMore() }
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("Job History")
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
