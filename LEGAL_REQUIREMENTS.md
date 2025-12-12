# Legal Requirements Analysis

## GDPR (General Data Protection Regulation) - EU
- **Lawful Basis**: Consent (for profile data) and Contract (for service provision).
- **Age Verification**: Ensure users meet the minimum age requirement (13+ or 16+ depending on country). Current implementation collects age but may need stricter verification.
- **Data Minimization**: Only collect what is necessary for matching.
- **International Transfers**: Supabase servers location should be considered (Standard Contractual Clauses if outside EU).

## CCPA/CPRA (California Consumer Privacy Act) - US
- **Right to Know**: Users can request what data is collected.
- **Right to Delete**: Implemented.
- **"Do Not Sell My Personal Information"**: If data is sold or shared for advertising, a link is required. (Currently not applicable if no data selling).

## COPPA (Children's Online Privacy Protection Act) - US
- **Under 13**: Strict requirements if targeting children under 13.
- **Recommendation**: Explicitly state the service is for users 13+ (or 18+) in Terms of Service.

## Required Documents
1.  **Terms of Service (ToS)**: Define rules of conduct, liability limitations, and dispute resolution.
2.  **Privacy Policy**: Explain data collection, usage, and user rights.
3.  **Cookie Policy**: Detail cookies used (Session, Auth).

## Action Items
- [ ] Create `Terms of Service` page.
- [ ] Create `Privacy Policy` page.
- [ ] Add "I agree to Terms and Privacy Policy" checkbox on Sign Up.
- [ ] Verify Supabase region compliance.
