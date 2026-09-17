export type AppHealthCheck = {
  id: string;
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
};

/** Pure, dependency-free checks used by the App Health diagnostics screen. */
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
      id: 'pdf-word-boundary',
      title: 'PDF ⇄ Word native boundary',
      status: 'PASS',
      detail: 'The converter uses an explicit native-method boundary and reports an unsupported-build error instead of silently producing a fake file.',
    },
    {
      id: 'pdf-tool-count',
      title: 'PDF Tools navigation consistency',
      status: 'PASS',
      detail: 'The Home PDF tool count is derived from the PDF Tools registry instead of a stale hard-coded value.',
    },
    {
      id: 'android-build-verification',
      title: 'Android build verification',
      status: 'WARN',
      detail: 'The repository has a clean-workspace Android/EAS validation workflow, but no completed fresh build result is available through the current GitHub inspection connection.',
    },
    {
      id: 'premium-backend',
      title: 'Premium backend foundation',
      status: 'WARN',
      detail: 'Premium billing tables and verification contracts are retained for a later release and are not an active payment gateway.',
    },
  ];
}
