import Foundation

/// Only synthetically named keys, never values. No credential access,
/// filesystem scanning, network requests, Keychain, or AI-provider calls.
public enum ExampleAuditError: Error, Equatable, LocalizedError {
    case wrongFileName
    case invalidUTF8
    case oversized
    case malformedLine
    case duplicateKey
    case tooManyKeys

    public var errorDescription: String? {
        switch self {
        case .wrongFileName: return "Only a user-selected .env.example is supported."
        case .invalidUTF8: return "Template encoding must be valid UTF-8."
        case .oversized: return "Template is too large."
        case .malformedLine: return "Template must contain empty KEY= entries only."
        case .duplicateKey: return "The template contains a duplicate key."
        case .tooManyKeys: return "The template contains too many keys."
        }
    }
}

public struct SyntheticCoverage: Equatable, Sendable {
    public let required: Int
    public let matched: Int
    public let missing: Int

    public init(required: Int, matched: Int, missing: Int) {
        self.required = required
        self.matched = matched
        self.missing = missing
    }
}

public enum SyntheticExampleAudit {
    public static let maxBytes = 65_536
    public static let maxKeys = 256

    // These are fictional key names with NO stored secret values.
    public static let demoKeyNames: Set<String> = [
        "GITHUB_TOKEN", "DEMO_DATABASE_URL", "EXAMPLE_FEATURE_FLAG"
    ]

    public static func coverage(
        templateData: Data,
        fileName: String,
        syntheticKeyNames: Set<String> = demoKeyNames
    ) throws -> SyntheticCoverage {
        guard fileName == ".env.example" else { throw ExampleAuditError.wrongFileName }
        guard templateData.count <= maxBytes else { throw ExampleAuditError.oversized }
        guard let input = String(data: templateData, encoding: .utf8) else {
            throw ExampleAuditError.invalidUTF8
        }

        var names: Set<String> = []
        var required = 0
        var matched = 0
        for line in input.components(separatedBy: "\n") {
            let candidate = line.hasSuffix("\r") ? String(line.dropLast()) : line
            if candidate.isEmpty { continue }
            if candidate.trimmingCharacters(in: .whitespaces).hasPrefix("#") {
                continue
            }
            guard candidate.hasSuffix("=") else { throw ExampleAuditError.malformedLine }
            let key = String(candidate.dropLast())
            guard isValidKey(key) else { throw ExampleAuditError.malformedLine }
            guard names.insert(key).inserted else { throw ExampleAuditError.duplicateKey }
            required += 1
            guard required <= maxKeys else { throw ExampleAuditError.tooManyKeys }
            if syntheticKeyNames.contains(key) { matched += 1 }
        }
        return SyntheticCoverage(
            required: required,
            matched: matched,
            missing: required - matched
        )
    }

    private static func isValidKey(_ value: String) -> Bool {
        let codepoints = Array(value.unicodeScalars)
        guard !codepoints.isEmpty && codepoints.count <= 128 else { return false }
        func asciiAlphaOrUnderscore(_ c: Unicode.Scalar) -> Bool {
            let v = c.value
            return (65...90).contains(v) || (97...122).contains(v) || v == 95
        }
        guard asciiAlphaOrUnderscore(codepoints[0]) else { return false }
        return codepoints.dropFirst().allSatisfy { c in
            asciiAlphaOrUnderscore(c) || (48...57).contains(c.value)
        }
    }
}
