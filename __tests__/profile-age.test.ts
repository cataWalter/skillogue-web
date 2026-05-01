import { calculateAgeFromBirthDate, normalizeBirthDate } from '../src/lib/profile-age';
import {
  calculateProfileAge,
  getBirthDateRange,
  isBirthDateWithinAgeRange,
} from '../src/lib/profile-age';

describe('profile age helpers', () => {
  describe('normalizeBirthDate', () => {
    it('keeps date inputs unchanged', () => {
      expect(normalizeBirthDate('1990-04-25')).toBe('1990-04-25');
    });

    it('normalizes ISO datetime values from backend records', () => {
      expect(normalizeBirthDate('1990-04-25T00:00:00.000Z')).toBe('1990-04-25');
      expect(normalizeBirthDate('1990-04-25 00:00:00+00:00')).toBe('1990-04-25');
    });

    it('rejects invalid values', () => {
      expect(normalizeBirthDate('1990-04-25abc')).toBeNull();
      expect(normalizeBirthDate('not-a-date')).toBeNull();
    });
  });

  describe('calculateAgeFromBirthDate', () => {
    it('returns null for invalid calendar dates and future birthdays', () => {
      expect(calculateAgeFromBirthDate('1990-02-30', new Date('2026-04-26T12:00:00.000Z'))).toBeNull();
      expect(calculateAgeFromBirthDate('2030-04-25', new Date('2026-04-26T12:00:00.000Z'))).toBeNull();
    });

    it('subtracts a year when the birthday has not happened yet', () => {
      expect(calculateAgeFromBirthDate('1990-12-25', new Date('2026-04-26T12:00:00.000Z'))).toBe(35);
    });

    it('calculates age from datetime-backed birth dates', () => {
      expect(calculateAgeFromBirthDate('1990-04-25T00:00:00.000Z', new Date('2026-04-26T12:00:00.000Z'))).toBe(36);
    });
  });

  describe('calculateProfileAge', () => {
    it('falls back to the legacy age when birth date parsing fails', () => {
      expect(calculateProfileAge({ birth_date: 'invalid', age: '27' })).toBe(27);
      expect(calculateProfileAge({ birth_date: 'invalid', age: 'not-a-number' })).toBeNull();
      expect(calculateProfileAge(null)).toBeNull();
    });
  });

  describe('range helpers', () => {
    it('returns inclusive birth date bounds for a target age range', () => {
      expect(getBirthDateRange(18, 30, new Date('2026-04-26T12:00:00.000Z'))).toEqual({
        min: '1996-04-26',
        max: '2008-04-26',
      });
    });

    it('checks whether a birth date falls within the requested age range', () => {
      expect(
        isBirthDateWithinAgeRange('2008-04-26', { minimumAge: 18, maximumAge: 20 }, new Date('2026-04-26T12:00:00.000Z'))
      ).toBe(true);
      expect(
        isBirthDateWithinAgeRange('2010-04-26', { minimumAge: 18, maximumAge: 20 }, new Date('2026-04-26T12:00:00.000Z'))
      ).toBe(false);
    });
  });
});
