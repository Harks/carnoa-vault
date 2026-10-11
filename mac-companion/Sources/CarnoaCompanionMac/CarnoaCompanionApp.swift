import SwiftUI
import AppKit
import UniformTypeIdentifiers
import CarnoaCompanionCore

@main
struct CarnoaCompanionApp: App {
    var body: some Scene {
        MenuBarExtra("Carnoa Demo", systemImage: "shield.lefthalf.filled") {
            MenuContents()
        }
        Window("Carnoa — Synthetic Project Readiness", id: "readiness") {
            ProjectReadinessView()
                .frame(minWidth: 520, minHeight: 430)
        }
    }
}

private struct MenuContents: View {
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        Text("Carnoa | Experimental synthetic-data preview")
        Button("Open demo dashboard") {
            openWindow(id: "readiness")
        }
        Divider()
        Text("No Keychain access • No passwords • No AI execution")
        Button("Quit demo") {
            NSApplication.shared.terminate(nil)
        }
    }
}

private struct ProjectReadinessView: View {
    @State private var showImporter = false
    @State private var counts: SyntheticCoverage?
    @State private var errorText: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Label("Carnoa Local Secrets", systemImage: "lock.shield")
                .font(.title2.bold())

            Text("Synthetic test only — never use real passwords or API keys.")
                .foregroundStyle(.orange)
                .fontWeight(.semibold)

            Text("Choose an example project template. This app only checks which empty KEY= names match a fixed synthetic sample. It does not read a real .env file, retrieve a Vault secret, connect to Apple Passwords, or invoke any AI.")
                .fixedSize(horizontal: false, vertical: true)

            Button {
                showImporter = true
            } label: {
                Label("Select .env.example", systemImage: "doc.text.magnifyingglass")
            }
            .buttonStyle(.borderedProminent)
            Text("If .env.example is hidden in the picker, press Command–Shift–Period to show dotfiles.")
                .font(.caption)
                .foregroundStyle(.secondary)

            if let counts {
                GroupBox("Synthetic key-name coverage") {
                    HStack(spacing: 18) {
                        metric("Required", counts.required)
                        metric("Matched", counts.matched)
                        metric("Missing", counts.missing)
                    }.frame(maxWidth: .infinity)
                }
            }
            if let errorText {
                Text(errorText)
                    .foregroundStyle(.red)
                    .accessibilityLabel("Example template rejected")
            }
            Divider()
            Text("Source is experimental, not independently audited. This is NOT a password manager, Touch ID approval, or an authenticated agent broker.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .fileImporter(isPresented: $showImporter, allowedContentTypes: [.item]) { selection in
            counts = nil
            errorText = nil
            switch selection {
            case .success(let url):
                do {
                    guard url.lastPathComponent == ".env.example" else {
                        throw ExampleAuditError.wrongFileName
                    }
                    let allowed = url.startAccessingSecurityScopedResource()
                    defer { if allowed { url.stopAccessingSecurityScopedResource() } }
                    // Read only explicit user-picked example files; deny symlink files.
                    let attributes = try url.resourceValues(
                        forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey]
                    )
                    guard attributes.isRegularFile == true &&
                          attributes.isSymbolicLink != true else {
                        throw ExampleAuditError.malformedLine
                    }
                    guard let length = attributes.fileSize,
                          length <= SyntheticExampleAudit.maxBytes else {
                        throw ExampleAuditError.oversized
                    }
                    let data = try Data(contentsOf: url, options: [.uncached])
                    counts = try SyntheticExampleAudit.coverage(
                        templateData: data,
                        fileName: url.lastPathComponent
                    )
                } catch {
                    errorText = "Template rejected: " +
                        ((error as? LocalizedError)?.errorDescription ??
                            "Unable to read the selected example.")
                }
            case .failure:
                errorText = "No example template selected."
            }
        }
    }

    private func metric(_ title: String, _ value: Int) -> some View {
        VStack(spacing: 6) {
            Text(String(value))
                .font(.title.bold())
                .monospacedDigit()
            Text(title)
                .font(.caption)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }
}
