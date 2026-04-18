import {
  adminCopy,
  componentCopy,
  dashboardCopy,
  onboardingCopy,
  staticPageCopy,
} from '../src/lib/app-copy';

describe('app copy helpers', () => {
  it('formats dashboard and onboarding progress helpers', () => {
    expect(dashboardCopy.sharedPassions()).toBe('0 shared passions');
    expect(dashboardCopy.sharedPassions(3)).toBe('3 shared passions');
    expect(onboardingCopy.progressComplete(2, 5)).toBe('40% complete');
    expect(onboardingCopy.stepCounter(2, 5)).toBe('Step 2 of 5');
  });

  it('formats notification, footer, and static page helper copy', () => {
    expect(componentCopy.notificationCenter.newNotificationFrom('Alice')).toBe(
      'You have a new notification from Alice.'
    );
    expect(componentCopy.footer.allRightsReserved(2026)).toBe(
      '© 2026 Skillogue, Inc. All rights reserved.'
    );
    expect(staticPageCopy.common.lastUpdated('April 26, 2026')).toBe(
      'Last updated: April 26, 2026'
    );
    expect(staticPageCopy.contact.validation.messageMax(280)).toBe(
      'Message must be at most 280 characters'
    );
  });

  it('formats admin confirmation prompts', () => {
    expect(adminCopy.dashboard.confirmations.clearFollowUp('Alice')).toBe(
      'Clear Alice from the follow-up list?'
    );
    expect(adminCopy.dashboard.confirmations.markFollowUp('Alice')).toBe(
      'Mark Alice for admin follow-up?'
    );
    expect(adminCopy.dashboard.confirmations.markVerified('Alice')).toBe(
      'Mark Alice as verified?'
    );
    expect(adminCopy.dashboard.confirmations.removeVerified('Alice')).toBe(
      'Remove the verified badge from Alice?'
    );
    expect(adminCopy.dashboard.confirmations.sendNotification('Alice')).toBe(
      'Send an admin notification to Alice?'
    );
  });
});