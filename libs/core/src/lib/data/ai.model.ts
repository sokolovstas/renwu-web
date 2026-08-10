export type AIJobState =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';
/** @deprecated delivery mode is on AIWorkflowStep.delivery */
export type AISkillKind = 'grooming' | 'flow_delivery';

export interface AIOpenCodeModel {
  id: string;
  label: string;
  provider_id?: string;
  model_id?: string;
}

export interface AIProviderInfo {
  id: string;
  label: string;
  description?: string;
  needs_base_url?: boolean;
  needs_web_url?: boolean;
}

export interface AISettings {
  enabled?: boolean;
  /** Agent harness id (default: opencode). */
  agent_provider?: string;
  agent_base_url?: string;
  agent_web_base_url?: string;
  /** @deprecated Prefer agent_base_url; kept for backward compatibility. */
  opencode_base_url?: string;
  /** @deprecated Prefer agent_web_base_url; kept for backward compatibility. */
  opencode_web_base_url?: string;
  actor_user_id?: string;
  max_concurrent_jobs?: number;
  default_model?: string;
  /** Global gate mode: shadow (advisory) | enforce. */
  gates_mode?: 'shadow' | 'enforce';
  max_fix_iterations?: number;
  max_total_budget_usd?: number;
  lock_wait_timeout_sec?: number;
  gate_timeout_sec?: number;
}

export interface AIGate {
  name?: string;
  cmd?: string;
  cwd_strategy?: string;
  cleanup_cmd?: string;
  cleanup_timeout_sec?: number;
  lock_scope?: 'project' | 'workspace';
}

export interface AIProjectArchetype {
  name?: string;
  match?: string[];
  /** Fast cycle for {{verify_commands}} (not hermetic component). */
  dev_commands?: string;
  gate_names?: string[];
}

export interface AIWorkspace {
  id?: string;
  container_id?: string;
  name?: string;
  workdir?: string;
  default_branch?: string;
  verify_commands?: string;
  enabled?: boolean;
  /** Optional override; empty inherits tenant AI settings. */
  agent_provider?: string;
  agent_base_url?: string;
  agent_web_base_url?: string;
  project_boundary?: string;
  default_archetype?: string;
  lock_scope?: 'project' | 'workspace';
  gates?: AIGate[];
  archetypes?: AIProjectArchetype[];
}
export interface AISkill {
  id?: string;
  name?: string;
  slug?: string;
  kind?: AISkillKind;
  body?: string;
  model?: string;
  timeout_sec?: number;
  enabled?: boolean;
  /** JSON Schema for RENWU_RESULT; grooming should require affected_projects[]. */
  result_schema?: Record<string, unknown>;
  result_marker?: string;
  allowed_tools?: string[];
  permission_mode?: string;
  max_budget_usd?: number;
  max_turns?: number;
}
export interface AIWorkflowStep {
  id?: string;
  on_enter_status_id?: string;
  skill_id?: string;
  auto_transit?: boolean;
  on_success_status_id?: string;
  on_need_info_status_id?: string;
  on_failure_status_id?: string;
  retrigger?: boolean;
  /** Worktree + delivery result parsing + delivery prompt fallbacks. */
  delivery?: boolean;
  /** First-turn prompt for this step (required at runtime). */
  prompt_template?: string;
  /** Continue-session prompt. Empty → reuse prompt_template. */
  followup_template?: string;
  /** Delivery: ask agent which git repo under workspace. */
  resolve_repository_template?: string;
  run_gates_after?: boolean;
  /**
   * Under gates_mode=enforce: omit/true → block on red gates;
   * explicit false → advisory opt-out for this step.
   */
  require_gates_pass?: boolean;
  max_retrigger?: number;
  on_retrigger_exhausted_status_id?: string;
  on_blocking_status_id?: string;
}
export interface AIWorkflow {
  id?: string;
  container_id?: string;
  workspace_id?: string;
  name?: string;
  enabled?: boolean;
  steps?: AIWorkflowStep[];
}
/** Portable dump of tenant AI config (no jobs/sessions). */
export interface AIConfigBundle {
  kind?: string;
  version?: number;
  settings?: AISettings;
  workspaces?: AIWorkspace[];
  skills?: AISkill[];
  workflows?: AIWorkflow[];
}

/** Result of chat `/refresh` (POST /issues/:id/session/refresh). */
export interface AISessionRefreshResult {
  alive?: boolean;
  busy?: boolean;
  extended?: boolean;
  job_id?: string;
  session_id?: string;
  message?: string;
}

export interface AIResolveMismatch {
  mismatched?: boolean;
  promised?: string[];
  actual?: string[];
  detail?: string;
}

export interface AIJob {
  id?: string;
  issue_id?: string;
  workflow_id?: string;
  step_id?: string;
  skill_id?: string;
  state?: AIJobState;
  summary?: string;
  opencode_session?: string;
  repository_path?: string;
  branch_name?: string;
  worktree_path?: string;
  worktree_state?: string;
  merge_request_url?: string;
  review_verdict?: string;
  error?: string;
  created_at?: string;
  updated_at?: string;
  /** Shadow / gate telemetry. */
  agent_claim?: string;
  gate_outcome?: 'green' | 'red' | 'skipped' | 'unavailable' | string;
  failure_class?: 'test_failure' | 'infra_failure' | string;
  resolve_mismatch?: AIResolveMismatch;
}
