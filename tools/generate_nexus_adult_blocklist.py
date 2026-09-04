#!/usr/bin/env python3
"""Generate a compact native C++ adult-domain list from StevenBlack's porn-only hosts file.

The generated file is intentionally deterministic. The source URL, date, SHA-256 and
entry count are embedded so release builds can audit exactly which snapshot was used.
"""
from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

SOURCE = "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts"
DOMAIN_RE = re.compile(r"^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([^\s#]+)")


def parse(path: Path) -> list[str]:
    domains: set[str] = set()
    for raw in path.read_text(encoding="utf-8", errors="strict").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        match = DOMAIN_RE.match(line)
        if not match:
            continue
        domain = match.group(1).strip().strip(".").lower()
        if domain and domain != "localhost":
            domains.add(domain)
    return sorted(domains)


def emit(domains: list[str], source_sha256: str, output: Path) -> None:
    # Compact NUL-separated payload. Native lookup code treats each entry as a suffix
    # boundary match. Keeping the payload in native code avoids a Kotlin String[] asset.
    payload = "\\0".join(domains) + "\\0"
    lines = [
        "// GENERATED FILE. DO NOT EDIT BY HAND.",
        f"// Source: {SOURCE}",
        f"// Source SHA-256: {source_sha256}",
        f"// Domain count: {len(domains)}",
        "#pragma once",
        "#include <cstddef>",
        "namespace nexus::adult_blocklist {",
        f"inline constexpr char kSourceSha256[] = \"{source_sha256}\";",
        f"inline constexpr std::size_t kDomainCount = {len(domains)};",
        f"inline constexpr char kDomains[] = \"{payload}\";",
        "}",
    ]
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} INPUT_HOSTS OUTPUT_CPP", file=sys.stderr)
        return 2
    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    raw = source.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    domains = parse(source)
    if not domains:
        raise SystemExit("No domains parsed from source hosts file")
    emit(domains, sha, output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
