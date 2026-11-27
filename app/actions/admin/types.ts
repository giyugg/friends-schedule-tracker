export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export interface RunActionOptions {
  suppressErrorBanner?: boolean;
}

export type RunAdminAction = (
  fn: () => Promise<ActionResult>,
  options?: RunActionOptions
) => void;

