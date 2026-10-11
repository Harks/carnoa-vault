import XCTest
import Foundation
@testable import CarnoaCompanionCore

/// Cross-language contract: one synthetic JSON drives both Node and Swift parsers.
/// No passwords, user paths or other private values are used.
final class SharedEnvContractTests: XCTestCase {
    private struct FixtureSet: Decodable {
        let version: Int
        let syntheticAvailableKeys: [String]
        let cases: [Fixture]
    }
    private struct Fixture: Decodable {
        let id: String
        let fileName: String
        let content: String
        let valid: Bool
        let required: Int?
        let matched: Int?
        let missing: Int?
    }

    func testSharedNodeSwiftExampleTemplateContract() throws {
        let url = try XCTUnwrap(
            Bundle.module.url(forResource: "env-parser-contract-v1", withExtension: "json")
        )
        let contract = try JSONDecoder().decode(
            FixtureSet.self, from: Data(contentsOf: url)
        )
        XCTAssertEqual(contract.version, 1)
        XCTAssertGreaterThanOrEqual(contract.cases.count, 12)

        let synthetic = Set(contract.syntheticAvailableKeys)
        for fixture in contract.cases {
            let bytes = Data(fixture.content.utf8)
            if fixture.valid {
                let actual = try SyntheticExampleAudit.coverage(
                    templateData: bytes,
                    fileName: fixture.fileName,
                    syntheticKeyNames: synthetic
                )
                XCTAssertEqual(actual.required, fixture.required, fixture.id)
                XCTAssertEqual(actual.matched, fixture.matched, fixture.id)
                XCTAssertEqual(actual.missing, fixture.missing, fixture.id)
            } else {
                XCTAssertThrowsError(
                    try SyntheticExampleAudit.coverage(
                        templateData: bytes,
                        fileName: fixture.fileName,
                        syntheticKeyNames: synthetic
                    ), fixture.id
                ) { error in
                    XCTAssertFalse(error.localizedDescription.contains("synthetic-test-only-value"))
                }
            }
        }
    }
}
