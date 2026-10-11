// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "CarnoaCompanion",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "CarnoaCompanionCore", targets: ["CarnoaCompanionCore"]),
        .executable(name: "carnoa-companion-demo", targets: ["CarnoaCompanionMac"])
    ],
    targets: [
        .target(name: "CarnoaCompanionCore"),
        .executableTarget(
            name: "CarnoaCompanionMac",
            dependencies: ["CarnoaCompanionCore"]
        ),
        .testTarget(
            name: "CarnoaCompanionCoreTests",
            dependencies: ["CarnoaCompanionCore"]
        )
    ]
)
