import { describe, expect, it } from 'vitest';
import access from './access';

describe('refund access', () => {
  it('allows an explicitly flagged super administrator', () => {
    expect(
      access({
        currentUser: { name: 'Super administrator', is_super_admin: true },
      }).canRefund,
    ).toBe(true);
  });
  it('keeps records visible but blocks ordinary administrators from refunds', () => {
    const permissions = access({
      currentUser: { name: 'Administrator', is_super_admin: false },
    });
    expect(permissions.canAdmin).toBe(true);
    expect(permissions.canSuperAdmin).toBe(false);
    expect(permissions.canRefund).toBe(false);
  });
  it('does not infer refund authority from the legacy admin access string', () => {
    expect(
      access({ currentUser: { name: 'Administrator', access: 'admin' } })
        .canRefund,
    ).toBe(false);
  });
  it('blocks an absent administrator', () => {
    expect(access(undefined).canRefund).toBe(false);
    expect(access({}).canRefund).toBe(false);
  });

  it('uses the explicit super administrator flag for account management', () => {
    expect(
      access({ currentUser: { is_super_admin: true } }).canSuperAdmin,
    ).toBe(true);
    expect(access(undefined).canSuperAdmin).toBe(false);
  });
});
