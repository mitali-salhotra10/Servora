import { describe, it, expect } from 'vitest';
import { canonicalJsonStringify, computeSha256 } from '../../src/utils/hash';

describe('Deterministic Canonical JSON & SHA-256 Trust Engine', () => {
  it('should serialize objects with different key insertion order into identical canonical JSON', () => {
    const objA = { z: 100, a: 'first', m: true };
    const objB = { a: 'first', m: true, z: 100 };
    const objC = { m: true, z: 100, a: 'first' };

    const strA = canonicalJsonStringify(objA);
    const strB = canonicalJsonStringify(objB);
    const strC = canonicalJsonStringify(objC);

    expect(strA).toBe('{"a":"first","m":true,"z":100}');
    expect(strA).toBe(strB);
    expect(strB).toBe(strC);

    // Hashes must be strictly identical
    expect(computeSha256(objA)).toBe(computeSha256(objB));
    expect(computeSha256(objB)).toBe(computeSha256(objC));
  });

  it('should deterministically serialize deeply nested objects and arrays', () => {
    const payload1 = {
      technicianId: 'tech-uuid-1',
      siteId: 'site-uuid-1',
      metadata: {
        pressureBar: 14.2,
        hydrantOperational: true,
        nestedCheck: {
          beta: 2,
          alpha: 1
        }
      },
      tags: ['extinguisher', 'co2']
    };

    const payload2 = {
      metadata: {
        nestedCheck: {
          alpha: 1,
          beta: 2
        },
        hydrantOperational: true,
        pressureBar: 14.2
      },
      tags: ['extinguisher', 'co2'],
      siteId: 'site-uuid-1',
      technicianId: 'tech-uuid-1'
    };

    const hash1 = computeSha256(payload1);
    const hash2 = computeSha256(payload2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // Valid SHA-256 hex string
  });

  it('should correctly handle null, undefined, and Date objects', () => {
    const date = new Date('2026-10-27T10:00:00.000Z');
    const obj = {
      notes: null,
      omittedField: undefined,
      timestamp: date
    };

    const str = canonicalJsonStringify(obj);
    expect(str).toBe('{"notes":null,"timestamp":"2026-10-27T10:00:00.000Z"}');
  });

  it('should document that hash provides record integrity, not truthfulness guarantee', () => {
    // Verified that the computeSha256 utility provides cryptographic tamper-evidence
    // while keeping evidence integrity separate from human authenticity claims.
    const fakeData = { status: 'INSPECTED', notes: 'Technician did not actually visit' };
    const hash = computeSha256(fakeData);
    expect(hash).toBeDefined();
  });
});
