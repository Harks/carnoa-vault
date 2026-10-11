import XCTest
import Foundation
@testable import CarnoaCompanionCore

final class SyntheticApprovalTests: XCTestCase {
    private let now: Int64 = 1_780_000_000_000

    func testExplicitReviewThenSimulationCannotGrantRealAccess() {
        var session = SyntheticApprovalSession(
            request: .fixture(nowMilliseconds: now))
        XCTAssertEqual(session.phase, .pendingReview)
        XCTAssertFalse(session.executable)
        session.review(at: now)
        XCTAssertEqual(session.phase, .reviewing)
        session.decide(.simulateConfirm, at: now + 1)
        XCTAssertEqual(session.phase, .simulatedConfirmed)
        XCTAssertFalse(session.executable)
        XCTAssertTrue(session.phase.displayLabel.contains("NO access"))
    }

    func testNoApprovalWithoutReviewOrAfterTerminalDecision() {
        var session = SyntheticApprovalSession(
            request: .fixture(nowMilliseconds: now))
        session.decide(.simulateConfirm, at: now)
        XCTAssertEqual(session.phase, .blocked)
        session.review(at: now)
        XCTAssertEqual(session.phase, .blocked)
        XCTAssertFalse(session.executable)
    }

    func testUserCanDenyFromPendingAndCannotChangeAfterDeny() {
        var session = SyntheticApprovalSession(
            request: .fixture(nowMilliseconds: now))
        session.deny(at: now)
        XCTAssertEqual(session.phase, .simulatedDenied)
        session.decide(.simulateConfirm, at: now)
        XCTAssertEqual(session.phase, .simulatedDenied)
        XCTAssertFalse(session.executable)
    }

    func testExpirationBeforeReviewAndDuringReviewFailsClosed() {
        var expired = SyntheticApprovalSession(
            request: .fixture(nowMilliseconds: now))
        expired.review(at: now + 120_000)
        XCTAssertEqual(expired.phase, .expired)
        var midway = SyntheticApprovalSession(
            request: .fixture(nowMilliseconds: now))
        midway.review(at: now + 40_000)
        midway.decide(.simulateConfirm, at: now + 120_000)
        XCTAssertEqual(midway.phase, .expired)
    }

    func testFutureIssuedTimestampFailsClosed() {
        var session = SyntheticApprovalSession(
            request: .fixture(nowMilliseconds: now + 100))
        session.review(at: now)
        XCTAssertEqual(session.phase, .blocked)
        XCTAssertFalse(session.executable)
    }

    func testMismatchedProjectAndAgentCannotBeReviewed() {
        let base = SyntheticAgentRequest.fixture(nowMilliseconds: now)
        let cases: [(String, String, String)] = [
            ("agent-not-trusted", base.resource, base.operation),
            (base.claimedAgent, "github:repo/ActualOrg/real-production", base.operation),
            (base.claimedAgent, base.resource, "github.repository.delete"),
            (base.claimedAgent, "https://example.invalid/secret", base.operation)
        ]
        for (agent, resource, operation) in cases {
            var session = SyntheticApprovalSession(request: SyntheticAgentRequest(
                id: base.id, claimedAgent: agent, resource: resource,
                operation: operation, issuedAtMilliseconds: now,
                expiresAtMilliseconds: now + 120_000))
            session.review(at: now)
            XCTAssertEqual(session.phase, .blocked)
            XCTAssertFalse(session.executable)
        }
    }

    func testExcessiveLifetimeAndInvalidWindowCannotPass() {
        let b = SyntheticAgentRequest.fixture(nowMilliseconds: now)
        for (start, expiry) in [
            (now, now + 120_001), (now, now), (now, now - 1),
            (-1, 5), (now + 1, now + 10)
        ] {
            var session = SyntheticApprovalSession(request: SyntheticAgentRequest(
                id: b.id, claimedAgent: b.claimedAgent,
                resource: b.resource, operation: b.operation,
                issuedAtMilliseconds: start, expiresAtMilliseconds: expiry))
            session.review(at: now)
            XCTAssertFalse(session.executable)
            XCTAssertNotEqual(session.phase, .reviewing)
        }
    }

    func testDisplayStateCarriesNoTokensOrCredentialValues() {
        let request = SyntheticAgentRequest.fixture(nowMilliseconds: now)
        var session = SyntheticApprovalSession(request: request)
        session.review(at: now)
        session.decide(.simulateDeny, at: now)
        XCTAssertEqual(session.phase, .simulatedDenied)
        XCTAssertFalse(session.executable)
        XCTAssertFalse(String(describing: session).contains("secret"))
        XCTAssertFalse(session.phase.displayLabel.contains(request.resource))
        XCTAssertFalse(session.phase.displayLabel.contains(request.claimedAgent))
    }
}
