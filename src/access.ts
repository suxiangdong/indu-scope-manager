/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState:
    | { currentUser?: API.CurrentUser & { is_super_admin?: boolean } }
    | undefined,
) {
  const { currentUser } = initialState ?? {};
  return {
    canAdmin: Boolean(currentUser),
    canSuperAdmin: currentUser?.is_super_admin === true,
    canRefund: currentUser?.is_super_admin === true,
  };
}
