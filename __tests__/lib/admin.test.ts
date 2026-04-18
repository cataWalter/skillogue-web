import { adminEmails, isAdminEmail } from '../../src/lib/admin';

describe('admin helpers', () => {
  it('matches allowlisted emails after trimming and normalizing case', () => {
    expect(adminEmails).toContain('cata.walter@gmail.com');
    expect(isAdminEmail('  CATA.WALTER@GMAIL.COM  ')).toBe(true);
  });

  it('rejects unknown or missing email values', () => {
    expect(isAdminEmail('someone@example.com')).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});