import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface Finding {
  file: string;
  line: number;
  pattern: string;
  excerpt: string;
}

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "Stripe Secret Key", regex: /sk_(live|test)_[A-Za-z0-9]+/g },
  { name: "Stripe Publishable Key", regex: /pk_(live|test)_[A-Za-z0-9]+/g },
  { name: "Google API Key", regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Private Key Block", regex: /-----BEGIN (RSA |EC |)?PRIVATE KEY-----/g },
  { name: "Database URL with credentials", regex: /DATABASE_URL\s*=\s*['\"]?postgres(ql)?:\/\/.+:.+@/g },
  { name: "Abacus API Key", regex: /ABACUSAI_API_KEY\s*=\s*[A-Za-z0-9]{20,}/g },
  { name: "Generic Token Assignment", regex: /(SECRET|TOKEN|API_KEY)\s*=\s*['\"][^'\"]{24,}['\"]/g },
];

const ALLOWLIST_PATTERNS = [
  "your-api-key",
  "your_password",
  "your-sendgrid-api-key",
  "SENDGRID_API_KEY='SG.your-sendgrid-api-key'",
  "generate-a-32-character-random-string-here",
  "generate-a-separate-download-token-secret",
  "postgresql://your_username:[REDACTED]@your_host:5432/your_database",
  "postgresql://your_username:your_password@your_host:5432/your_database",
  "DATABASE_URL=postgresql://...",
  "[REDACTED]",
];

function getTrackedFiles(rootDir: string): string[] {
  const output = execSync("git ls-files", {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("public/images/"));
}

function scanFile(filePath: string, relativePath: string): Finding[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const findings: Finding[] = [];

  lines.forEach((line, index) => {
    if (ALLOWLIST_PATTERNS.some((allowed) => line.includes(allowed))) return;

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          pattern: pattern.name,
          excerpt: line.slice(0, 160),
        });
      }
      pattern.regex.lastIndex = 0;
    }
  });

  return findings;
}

function main() {
  const rootDir = process.cwd();
  const files = getTrackedFiles(rootDir);

  const findings = files.flatMap((relativePath) => {
    const absolutePath = path.join(rootDir, relativePath);
    return scanFile(absolutePath, relativePath);
  });

  if (findings.length === 0) {
    console.log("✅ Security audit passed: no secret patterns found in tracked files.");
    process.exit(0);
  }

  console.error("❌ Security audit failed. Potential secrets found:");
  findings.forEach((finding) => {
    console.error(`- ${finding.file}:${finding.line} [${finding.pattern}] ${finding.excerpt}`);
  });
  process.exit(1);
}

main();
