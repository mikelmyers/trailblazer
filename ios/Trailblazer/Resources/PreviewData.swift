import Foundation

enum PreviewData {
    static let user = SessionUser(
        id: "user_1",
        email: "driver@example.com",
        name: "John Driver",
        role: "DRIVER",
        image: nil
    )

    static let driver = Driver(
        id: "driver_1",
        userId: "user_1",
        vehicleType: .CAR,
        serviceAreas: ["Downtown", "Midtown", "Airport"],
        isAvailable: true,
        currentLat: 37.7749,
        currentLng: -122.4194,
        lastLocationAt: Date(),
        subscriptionTier: .STANDARD,
        subscriptionStatus: "active",
        stripeConnectOnboarded: true,
        rating: 4.8,
        totalJobs: 127,
        createdAt: Date(),
        user: DriverUser(name: "John Driver", email: "driver@example.com", image: nil)
    )

    static let shipper = Shipper(
        id: "shipper_1",
        userId: "user_2",
        companyName: "FastShip Co",
        subscriptionTier: .STARTER,
        subscriptionStatus: "active",
        monthlyJobCount: 23,
        createdAt: Date()
    )

    static let job = Job(
        id: "job_1",
        status: .EN_ROUTE_PICKUP,
        urgency: .EXPRESS,
        pickupAddress: "123 Main St, San Francisco, CA",
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        dropoffAddress: "456 Market St, San Francisco, CA",
        dropoffLat: 37.7897,
        dropoffLng: -122.3942,
        description: "Fragile electronics - handle with care",
        packageSize: .MEDIUM,
        priceCents: 2450,
        suggestedPriceCents: 2400,
        platformFeeCents: 490,
        driverPayoutCents: 1960,
        createdAt: Date().addingTimeInterval(-3600),
        matchedAt: Date().addingTimeInterval(-1800),
        pickedUpAt: nil,
        deliveredAt: nil,
        shipper: JobShipper(id: "shipper_1", companyName: "FastShip Co", userId: "user_2"),
        driver: JobDriver(
            id: "driver_1",
            userId: "user_1",
            vehicleType: .CAR,
            rating: 4.8,
            user: DriverUser(name: "John Driver", email: nil, image: nil)
        )
    )

    static let driverStats = DriverStats(
        todayDeliveries: 3,
        weekEarnings: 342.50,
        rating: 4.8,
        totalJobs: 127
    )

    static let shipperStats = ShipperStats(
        activeJobs: 2,
        jobsThisMonth: 23,
        monthlyLimit: 100,
        averageRating: 4.5,
        tier: .STARTER
    )

    static let earnings = EarningsSummary(
        weekEarnings: 34250,
        monthEarnings: 125800,
        allTimeEarnings: 845600,
        weekJobs: 12,
        monthJobs: 45,
        totalJobs: 127
    )

    static let jobs: [Job] = [
        job,
        Job(
            id: "job_2",
            status: .POSTED,
            urgency: .STANDARD,
            pickupAddress: "789 Oak Ave, San Francisco, CA",
            pickupLat: 37.7649,
            pickupLng: -122.4294,
            dropoffAddress: "321 Pine St, San Francisco, CA",
            dropoffLat: 37.7921,
            dropoffLng: -122.4012,
            description: nil,
            packageSize: .SMALL,
            priceCents: 1800,
            suggestedPriceCents: 1750,
            platformFeeCents: 360,
            driverPayoutCents: 1440,
            createdAt: Date().addingTimeInterval(-600),
            matchedAt: nil,
            pickedUpAt: nil,
            deliveredAt: nil,
            shipper: JobShipper(id: "shipper_2", companyName: "QuickSend", userId: "user_3"),
            driver: nil
        ),
        Job(
            id: "job_3",
            status: .DELIVERED,
            urgency: .CRITICAL,
            pickupAddress: "555 Howard St, San Francisco, CA",
            pickupLat: 37.7859,
            pickupLng: -122.3969,
            dropoffAddress: "888 Brannan St, San Francisco, CA",
            dropoffLat: 37.7719,
            dropoffLng: -122.4009,
            description: "Legal documents - time sensitive",
            packageSize: .ENVELOPE,
            priceCents: 3500,
            suggestedPriceCents: 3200,
            platformFeeCents: 700,
            driverPayoutCents: 2800,
            createdAt: Date().addingTimeInterval(-86400),
            matchedAt: Date().addingTimeInterval(-85000),
            pickedUpAt: Date().addingTimeInterval(-84000),
            deliveredAt: Date().addingTimeInterval(-82000),
            shipper: JobShipper(id: "shipper_1", companyName: "FastShip Co", userId: "user_2"),
            driver: JobDriver(
                id: "driver_1",
                userId: "user_1",
                vehicleType: .CAR,
                rating: 4.8,
                user: DriverUser(name: "John Driver", email: nil, image: nil)
            )
        ),
    ]
}
