export function normalizeRcVersion(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";
  if (/^\d+$/.test(trimmedValue)) return `RC${trimmedValue}`;

  return trimmedValue.replace(/\brc\s*(\d+)\b/gi, "RC$1");
}

export function normalizeTargetVersion(value: string) {
  return normalizeRcVersion(value).replace(/\s+/g, " ").trim();
}

export function createTargetVersionDisplay({
  version,
  rcVersion,
  inferredTargetVersion,
}: {
  version: string;
  rcVersion: string;
  inferredTargetVersion: string;
}) {
  const normalizedVersion = version.trim();
  const normalizedRcVersion = normalizeRcVersion(rcVersion);
  const userTargetVersion = [normalizedVersion, normalizedRcVersion]
    .filter(Boolean)
    .join(" ");

  if (userTargetVersion) {
    return userTargetVersion;
  }

  if (inferredTargetVersion) {
    return `${inferredTargetVersion} (Auto inferred)`;
  }

  return "Version TBD";
}
