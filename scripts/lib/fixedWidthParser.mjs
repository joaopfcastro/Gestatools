/**
 * Parser for SIGTAP fixed-width text layout files (*_layout.txt and *.txt).
 */

/**
 * Parses a _layout.txt file content into column field specifications.
 * Expected layout format per line: COLUMN_NAME TYPE SIZE START END
 */
export function parseLayoutFile(layoutContent) {
  const lines = layoutContent.split(/\r?\n/);
  const fields = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Split by whitespace
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 4) {
      const name = parts[0].toUpperCase();
      const type = parts[1];
      const size = parseInt(parts[2], 10);
      const start = parseInt(parts[3], 10) - 1; // 1-indexed to 0-indexed
      const end = parseInt(parts[4] || (parts[3] + size - 1), 10);

      fields.push({
        name,
        type,
        size,
        start,
        end,
      });
    }
  }

  return fields;
}

/**
 * Parses fixed-width data file content using specified field specs.
 */
export function parseFixedWidthData(dataContent, fields) {
  const lines = dataContent.split(/\r?\n/);
  const records = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!line.trim()) continue;

    const record = {};
    for (const field of fields) {
      const value = line.substring(field.start, field.end).trim();
      record[field.name] = value;
    }
    records.push(record);
  }

  return records;
}
