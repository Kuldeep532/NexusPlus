export type AppHealthCheck = {
  id: string;
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
};

/** Pure, dependency-free checks used by future diagnostics screens. */
export function runStaticAppHealthChecks(): AppHealthCheck[] {
  return [
    {
      id: 'auth-boundary',
      title: 'Authentication boundary',
      status: 'PASS',
      detail: 'Authenticated backend operations require a valid Supabase access token.',
    },
    {
      id: 'billing-ui',
      title: 'Archived billing UI',
      status: 'PASS',
      detail: 'Premium/payment actions are not exposed from the active Settings UI.',
    },
    {
      id: 'premium-backend',
      title: 'Premium backend foundation',
      status: 'WARN',
      detail: 'Premium billing tables and verification contracts are retained for a later release and are not an active payment gateway.',
    },
  ];
}
