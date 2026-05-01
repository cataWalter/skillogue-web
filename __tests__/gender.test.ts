import { normalizeGender } from '../src/lib/gender';

describe('normalizeGender', () => {
  it('normalizes canonical and legacy binary gender values', () => {
    expect(normalizeGender('Male')).toBe('Male');
    expect(normalizeGender('female')).toBe('Female');
    expect(normalizeGender('M')).toBe('Male');
    expect(normalizeGender('F')).toBe('Female');
    expect(normalizeGender('uomo')).toBe('Male');
    expect(normalizeGender('donna')).toBe('Female');
    expect(normalizeGender('maschio')).toBe('Male');
    expect(normalizeGender('femminile')).toBe('Female');
  });

  it('returns null for unsupported or empty values', () => {
    expect(normalizeGender('Non-binary')).toBeNull();
    expect(normalizeGender('Other')).toBeNull();
    expect(normalizeGender('Prefer not to say')).toBeNull();
    expect(normalizeGender('')).toBeNull();
    expect(normalizeGender(undefined)).toBeNull();
    expect(normalizeGender(null)).toBeNull();
  });
});
