/** Push mode for Renwu → Jira auto-export. */
export type JiraPushMode = 'manual' | 'auto_mapped' | 'auto_all';

/** Field sync direction: both, Jira→Renwu, Renwu→Jira. */
export type JiraFieldDirection = '<>' | '>' | '<';

export type JiraFieldConditionOp = 'eq' | 'in';

export interface JiraDictItem {
  id?: string;
  name?: string;
}

export interface JiraOurDictItem {
  id?: string;
  name?: string;
}

export interface JiraDictMatch {
  jira?: JiraDictItem[];
  our?: JiraOurDictItem[];
}

export interface JiraProjItem {
  id?: string;
  key?: string;
}

export interface JiraOurProjItem {
  id?: string;
  key?: string;
}

export interface JiraProjMatch {
  jira?: JiraProjItem[];
  our?: JiraOurProjItem[];
}

/** Raw Jira dictionaries for mapping search (from Update dictionaries). */
export interface JiraDictCatalog {
  status?: JiraDictItem[];
  priority?: JiraDictItem[];
  type?: JiraDictItem[];
  projects?: JiraProjItem[];
}

export interface JiraSyncField {
  source_field?: string;
  source_label?: string;
  source_script?: string;
  source_log?: string;
  target_field?: string;
  target_label?: string;
  target_script?: string;
  target_log?: string;
  direction?: JiraFieldDirection | string;
}

export interface JiraFieldCondition {
  field?: string;
  op?: JiraFieldConditionOp | string;
  value?: unknown;
}

export interface JiraSyncTemplate {
  id?: string;
  name?: string;
  when?: JiraFieldCondition[];
  fields?: JiraSyncField[];
}

/**
 * Org-level Jira connection + sync config.
 * Auth (PAT) is per Renwu user — see JiraUserCredentials.
 */
/** Jira REST auth: Basic (user+password/token) or PAT (Bearer). */
export type JiraAuthMode = 'basic' | 'pat';

/** Personal Jira REST credentials for the current Renwu user. */
export interface JiraUserCredentials {
  auth_mode?: JiraAuthMode | string;
  rest_api_user?: string;
  /** Only sent on save; never returned by GET. */
  rest_api_password?: string;
  /** Corp login/email in Jira; used for assignee mapping on sync. */
  jira_email?: string;
  configured?: boolean;
}

/** Portable dump of org Jira settings (no secrets / issue mappings). */
export interface JiraConfigBundle {
  kind?: string;
  version?: number;
  settings?: JiraSettings;
}

export interface JiraSettings {
  jql?: string;
  oql?: string;
  rest_api_url?: string;
  public_url?: string;
  /** @deprecated Org-level auth removed; use personal credentials. */
  auth_mode?: JiraAuthMode | string;
  /** @deprecated */
  rest_api_user?: string;
  /** @deprecated */
  rest_api_password?: string;
  hook_address?: string;
  export_post_script?: string;
  import_post_script?: string;
  /** Preferred push mode; default treated as manual when missing. */
  push_mode?: JiraPushMode | string;
  /** Auto pull from Jira by JQL on an interval (separate from push_mode). */
  import_auto_enabled?: boolean;
  /** Minutes between auto imports: 5 | 15 | 30 | 60 | 180 | 360 | 720 | 1440. */
  import_auto_interval_minutes?: number;
  /** Renwu user whose personal PAT is used for background import. */
  import_auto_user_id?: string;
  /** Unix seconds of last claimed auto-import run. */
  import_auto_last_run_at?: number;
  /** @deprecated Migrated into sync templates (JIRA_ISSUE_KEY → key). */
  sync_issue_keys?: boolean;
  /** @deprecated Migrated into sync templates (PARENT_EPIC_JIRA_KEY). */
  epic_link_field?: string;
  /** Renwu type ids treated as Epic for parent Epic Link resolution (Mongo). */
  epic_our_type_ids?: string[];
  /** @deprecated Migrated into sync templates (STORY_POINTS_TO_ESTIMATE). */
  story_points_field?: string;
  templates?: JiraSyncTemplate[];
  /** Legacy flat field list; migrated into a default template when templates are empty. */
  fields?: JiraSyncField[];
  status_mapping?: JiraDictMatch[];
  priority_mapping?: JiraDictMatch[];
  type_mapping?: JiraDictMatch[];
  project_mapping?: JiraProjMatch[];
  jira_catalog?: JiraDictCatalog;
  source_log?: string;
  target_log?: string;
}

export interface JiraDiffField {
  field?: string;
  direction?: string;
  renwu?: unknown;
  jira?: unknown;
  proposed?: unknown;
  changed?: boolean;
}

export interface JiraIssueDiff {
  issue_id?: string;
  issue_key?: string;
  title?: string;
  jira_key?: string;
  jira_id?: string;
  mapped?: boolean;
  would_create?: boolean;
  would_import?: boolean;
  error?: string;
  fields?: JiraDiffField[];
}

export interface JiraDiffRequest {
  issue_ids?: string[];
  oql?: string;
}

export type JiraSyncBatchDirection = 'import' | 'export';

export interface JiraSyncBatchRequest {
  issue_ids?: string[];
  jira_keys?: string[];
  direction: JiraSyncBatchDirection;
  create_if_missing?: boolean;
}

/** Manual Renwu ↔ Jira binding by issue key. */
export interface JiraIssueLink {
  jira_key?: string;
  jira_id?: string;
  jira_url?: string;
}

/** Result of creating/refreshing a Renwu issue from a Jira key. */
export interface JiraImportByKeyResult {
  id?: string;
  key?: string;
  jira_key?: string;
  jira_id?: string;
  created?: boolean;
}

/** Admin-editable Jira assignee mapping for a Renwu user. */
export interface JiraUserEmail {
  user_id?: string;
  jira_email?: string;
}
