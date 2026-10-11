import XCTest
import Foundation
@testable import CarnoaCompanionCore

final class ExampleAuditTests: XCTestCase {
    func testSyntheticCoverageCountsOnly() throws {
        let text = "# no secrets\nGITHUB_TOKEN=\nEXAMPLE_FEATURE_FLAG=\nMISSING_SERVICE=\n"
        let result = try SyntheticExampleAudit.coverage(
            templateData: Data(text.utf8),
            fileName: ".env.example"
        )
        XCTAssertEqual(result, SyntheticCoverage(required: 3, matched: 2, missing: 1))
        XCTAssertEqual(Mirror(reflecting: result).children.count, 3)
    }

    func testRejectsRealEnvironmentFileWithoutParsing() {
        XCTAssertThrowsError(try SyntheticExampleAudit.coverage(
            templateData: Data("GITHUB_TOKEN=synthetic-test-only".utf8),
            fileName: ".env"
        )) { error in
            XCTAssertEqual(error as? ExampleAuditError, .wrongFileName)
        }
    }

    func testRejectsAnyNonemptyValueAndDoesNotEchoIt() {
        let example = "GITHUB_TOKEN=demo-value-that-must-not-appear"
        XCTAssertThrowsError(try SyntheticExampleAudit.coverage(
            templateData: Data(example.utf8),
            fileName: ".env.example"
        )) { error in
            XCTAssertFalse(error.localizedDescription.contains("demo-value-that"))
        }
    }

    func testRejectsDuplicatesExportsAndShellSyntax() {
        let samples = [
            "KEY=\nKEY=",
            "export KEY=",
            "KEY= # comment",
            "KEY=$(example)",
            "KEY =",
            "1KEY=",
            "KÉY=",
            "KEY\\t="
        ]
        for sample in samples {
            XCTAssertThrowsError(try SyntheticExampleAudit.coverage(
                templateData: Data(sample.utf8),
                fileName: ".env.example"
            ), "Accepted invalid fixture \(sample)")
        }
    }

    func testStrictUTF8AndFileSizeLimits() {
        XCTAssertThrowsError(try SyntheticExampleAudit.coverage(
            templateData: Data([0xff, 0xfe, 0x00]),
            fileName: ".env.example"
        ))
        XCTAssertThrowsError(try SyntheticExampleAudit.coverage(
            templateData: Data(repeating: 65, count: 65_537),
            fileName: ".env.example"
        )) { error in
            XCTAssertEqual(error as? ExampleAuditError, .oversized)
        }
    }

    func testBoundedKeyCountAndNoValuesInResult() {
        let fixture = (0..<257).map { "KEY_\($0)=" }.joined(separator: "\n")
        XCTAssertThrowsError(try SyntheticExampleAudit.coverage(
            templateData: Data(fixture.utf8),
            fileName: ".env.example"
        )) { error in
            XCTAssertEqual(error as? ExampleAuditError, .tooManyKeys)
        }
    }
}
