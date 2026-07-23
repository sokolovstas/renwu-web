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
  /** Jira Epic Link custom field id, e.g. customfield_15500. Empty disables linking. */
  epic_link_field?: string;
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
