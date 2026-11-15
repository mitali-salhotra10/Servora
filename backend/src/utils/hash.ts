import crypto from 'crypto';

/**
 * Deterministically serializes any JavaScript data structure into a canonical JSON string.
 * Rules:
 * 1. Primitive types (string, number, boolean) are serialized via standard JSON formatting.
 * 2. Null is serialized as "null".
 * 3. Undefined values in objects are omitted (matching JSON.stringify).
 * 4. Arrays maintain element order; each element is canonically serialized.
 * 5. Objects have their own keys sorted lexicographically (Unicode code point order).
 * 6. No whitespace is inserted between tokens.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }

  if (Array.isArray(obj)) {
    const serializedItems = obj.map((item) => canonicalJsonStringify(item));
    return `[${serializedItems.join(',')}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const keyValues: string[] = [];

    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
        keyValues.push(`${JSON.stringify(key)}:${canonicalJsonStringify(val)}`);
      }
    }
    return `{${keyValues.join(',')}}`;
  }

  return JSON.stringify(obj);
}

/**
 * Computes a deterministic SHA-256 hex digest over a data payload.
 *
 * NOTE: As documented in the Servora Security Architecture (SEC-007):
 * This SHA-256 seal provides cryptographic record integrity (tamper-evidence)
 * ensuring that data stored in the database has not been altered post-completion.
 * It is not an empirical guarantee that human physical evidence submitted by
 * the technician was truthful at the moment of inspection.
 */
export function computeSha256(data: unknown): string {
  const canonicalString = typeof data === 'string' ? data : canonicalJsonStringify(data);
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}
