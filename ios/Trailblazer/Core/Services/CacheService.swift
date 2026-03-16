import Foundation

actor CacheService {
    static let shared = CacheService()

    private let cacheDir: URL

    struct CacheEntry<T: Codable>: Codable {
        let data: T
        let timestamp: Date
        let ttlSeconds: TimeInterval
    }

    private init() {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        cacheDir = appSupport.appendingPathComponent("cache")
        try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
    }

    func get<T: Codable>(_ key: String, type: T.Type) -> T? {
        let url = cacheDir.appendingPathComponent("\(key).json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        guard let entry = try? JSONDecoder().decode(CacheEntry<T>.self, from: data) else { return nil }

        // Check TTL
        if Date().timeIntervalSince(entry.timestamp) > entry.ttlSeconds {
            try? FileManager.default.removeItem(at: url)
            return nil
        }

        return entry.data
    }

    func set<T: Codable>(_ key: String, value: T, ttlSeconds: TimeInterval = 3600) {
        let entry = CacheEntry(data: value, timestamp: Date(), ttlSeconds: ttlSeconds)
        let url = cacheDir.appendingPathComponent("\(key).json")
        let data = try? JSONEncoder().encode(entry)
        try? data?.write(to: url)
    }

    func invalidate(_ key: String) {
        let url = cacheDir.appendingPathComponent("\(key).json")
        try? FileManager.default.removeItem(at: url)
    }

    func clearAll() {
        try? FileManager.default.removeItem(at: cacheDir)
        try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
    }
}
