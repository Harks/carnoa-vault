import Foundation

/// These types demonstrate *what a user would review* before an AI action.
/// They NEVER issue a grant, authenticate a process, contact a provider,
/// use Keychain, handle credentials or produce an executable capability.
public struct SyntheticAgentRequest: Equatable, Sendable {
    public let id: String
    public let claimedAgent: String
    public let resource: String
    public let operation: String
    public let issuedAtMilliseconds: Int64
    public let expiresAtMilliseconds: Int64

    public init(
        id: String,
        claimedAgent: String,
        resource: String,
        operation: String,
        issuedAtMilliseconds: Int64,
        expiresAtMilliseconds: Int64
    ) {
        self.id = id
        self.claimedAgent = claimedAgent
        self.resource = resource
        self.operation = operation
        self.issuedAtMilliseconds = issuedAtMilliseconds
        self.expiresAtMilliseconds = expiresAtMilliseconds
    }

    /// Fixed, fictional project only. Cannot target a real GitHub project.
    public static func fixture(nowMilliseconds: Int64) -> Self {
        Self(
            id: "demo-approval-only",
            claimedAgent: "demo-agent-not-authenticated",
            resource: "github:repo/ExampleOrg/demo-repo",
            operation: "github.pulls.list",
            issuedAtMilliseconds: nowMilliseconds,
            expiresAtMilliseconds: nowMilliseconds + 120_000
        )
    }

    /// Tight test fixture allowlist. NOT an authentication/authorization rule.
    public func isWellFormed(at now: Int64) -> Bool {
        id == "demo-approval-only" &&
        claimedAgent == "demo-agent-not-authenticated" &&
        resource == "github:repo/ExampleOrg/demo-repo" &&
        operation == "github.pulls.list" &&
        issuedAtMilliseconds >= 0 &&
        issuedAtMilliseconds <= now &&
        expiresAtMilliseconds > issuedAtMilliseconds &&
        expiresAtMilliseconds > now &&
        expiresAtMilliseconds - issuedAtMilliseconds <= 120_000
    }
}

public enum SyntheticApprovalPhase: String, Equatable, Sendable {
    case pendingReview
    case reviewing
    case simulatedConfirmed
    case simulatedDenied
    case expired
    case blocked

    public var displayLabel: String {
        switch self {
        case .pendingReview: return "Waiting for review"
        case .reviewing: return "Showing fictional scope"
        case .simulatedConfirmed: return "Simulation completed — NO access granted"
        case .simulatedDenied: return "Simulation denied — NO access granted"
        case .expired: return "Demo expired — NO access granted"
        case .blocked: return "Invalid demo request — NO access granted"
        }
    }
}

public enum SyntheticApprovalAction: Sendable {
    case simulateConfirm
    case simulateDeny
}

public struct SyntheticApprovalSession: Equatable, Sendable {
    public let request: SyntheticAgentRequest
    public private(set) var phase: SyntheticApprovalPhase = .pendingReview

    public init(request: SyntheticAgentRequest) {
        self.request = request
    }

    /// No capability, credential or authorization can ever result.
    public var executable: Bool { false }

    /// Explicitly called only by a user's "Review" button in the demo.
    public mutating func review(at now: Int64) {
        guard phase == .pendingReview else { return }
        phase = request.isWellFormed(at: now) ? .reviewing : invalidReason(at: now)
    }

    public mutating func decide(_ action: SyntheticApprovalAction, at now: Int64) {
        guard phase == .reviewing else {
            // A program cannot skip the visible review step to simulate approval.
            if phase == .pendingReview { phase = .blocked }
            return
        }
        guard request.isWellFormed(at: now) else {
            phase = invalidReason(at: now)
            return
        }
        phase = action == .simulateConfirm ? .simulatedConfirmed : .simulatedDenied
    }

    /// A deny button can be used at any nonterminal stage.
    public mutating func deny(at now: Int64) {
        guard phase == .pendingReview || phase == .reviewing else { return }
        phase = request.isWellFormed(at: now) ? .simulatedDenied : invalidReason(at: now)
    }

    private func invalidReason(at now: Int64) -> SyntheticApprovalPhase {
        request.expiresAtMilliseconds <= now ? .expired : .blocked
    }
}
