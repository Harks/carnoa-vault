import SwiftUI
import CarnoaCompanionCore

/// A static fake-action UI. It never sends a request, requests Touch ID,
/// reads secrets or grants any permission. Deliberately separate from Vault.
struct SyntheticAgentApprovalView: View {
    @State private var session = SyntheticApprovalSession(
        request: .fixture(nowMilliseconds: Self.currentTimeMilliseconds())
    )

    private static func currentTimeMilliseconds() -> Int64 {
        Int64(Date().timeIntervalSince1970 * 1_000)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 17) {
            Label("AI access — non-executable preview", systemImage: "person.crop.circle.badge.questionmark")
                .font(.title2.bold())

            Text("Synthetic operation only. This app cannot verify agent identity, grant permission, contact GitHub or access real credentials.")
                .foregroundStyle(.orange)
                .fixedSize(horizontal: false, vertical: true)

            GroupBox("Fictional request to review") {
                VStack(alignment: .leading, spacing: 8) {
                    detail("Claimed agent (UNVERIFIED)", session.request.claimedAgent)
                    detail("Resource", session.request.resource)
                    detail("Action", session.request.operation)
                    detail("Lifetime", "120 seconds maximum (demonstration)")
                    Text("No process identity, no user biometrics, no API key, no issued grant.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 5)
            }

            HStack(spacing: 12) {
                Label(session.phase.displayLabel, systemImage: statusSymbol)
                    .foregroundStyle(session.phase == .simulatedConfirmed ? .orange : .secondary)
                    .accessibilityIdentifier("synthetic-approval-status")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            HStack(spacing: 10) {
                if session.phase == .pendingReview {
                    Button("Review fictionally scoped action") {
                        session.review(at: Self.currentTimeMilliseconds())
                    }
                    .buttonStyle(.borderedProminent)
                }
                if session.phase == .reviewing {
                    Button("Simulate confirmation") {
                        session.decide(.simulateConfirm, at: Self.currentTimeMilliseconds())
                    }
                    .buttonStyle(.borderedProminent)
                }
                if session.phase == .pendingReview || session.phase == .reviewing {
                    Button("Simulate denial") {
                        session.deny(at: Self.currentTimeMilliseconds())
                    }
                }
                Button("Reset simulation") {
                    session = SyntheticApprovalSession(
                        request: .fixture(nowMilliseconds: Self.currentTimeMilliseconds())
                    )
                }
            }

            Divider()
            Text("Any positive result here is only an on-screen simulation. Production execution stays disabled regardless of these controls. An independently authenticated workload, signed and revocable permit, human consent and an external security audit are still required.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(24)
    }

    private var statusSymbol: String {
        switch session.phase {
        case .pendingReview, .reviewing: "doc.text.magnifyingglass"
        case .simulatedConfirmed: "exclamationmark.triangle"
        case .simulatedDenied, .expired, .blocked: "xmark.shield"
        }
    }

    private func detail(_ title: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(title)
                .font(.callout)
                .foregroundStyle(.secondary)
                .frame(width: 198, alignment: .leading)
            Text(value)
                .font(.callout.monospaced())
                .textSelection(.disabled)
        }
    }
}
