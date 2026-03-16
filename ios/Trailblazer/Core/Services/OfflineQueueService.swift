import Foundation

actor OfflineQueueService {
    static let shared = OfflineQueueService()

    private var queue: [QueuedAction] = []
    private let fileURL: URL

    struct QueuedAction: Codable, Identifiable {
        let id: UUID
        let endpoint: String
        let method: String
        let body: Data?
        let timestamp: Date

        init(endpoint: String, method: String, body: Data?) {
            self.id = UUID()
            self.endpoint = endpoint
            self.method = method
            self.body = body
            self.timestamp = Date()
        }
    }

    private init() {
        let docs = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        fileURL = docs.appendingPathComponent("offline_queue.json")
        loadFromDisk()
    }

    func enqueue(endpoint: String, method: String, body: Data?) {
        // For location updates, replace any existing location action
        if endpoint.contains("location") {
            queue.removeAll { $0.endpoint.contains("location") }
        }

        let action = QueuedAction(endpoint: endpoint, method: method, body: body)
        queue.append(action)
        saveToDisk()
    }

    func drain() async -> [QueuedAction] {
        let actions = queue
        queue.removeAll()
        saveToDisk()
        return actions
    }

    var isEmpty: Bool {
        queue.isEmpty
    }

    var count: Int {
        queue.count
    }

    private func loadFromDisk() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        queue = (try? JSONDecoder().decode([QueuedAction].self, from: data)) ?? []
    }

    private func saveToDisk() {
        let dir = fileURL.deletingLastPathComponent()
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let data = try? JSONEncoder().encode(queue)
        try? data?.write(to: fileURL)
    }
}
