import { Issue } from '../issue/issue.model';

export interface BoardGroupsConfigServer {
  id: string;
  title: string;
  groups: {
    field: string;
    view: string;
    fixed: string[];
    group_only: boolean;
    show_empty: boolean;
    status_columns?: {
      id: string;
      title: string;
      query?: string;
      target_status: string;
      collapsed?: boolean;
      wip_limit?: number;
    }[];
  }[];
  view: string;
  type: string;
  shared: boolean;
  author_id: string;
  show_logs: boolean;
  hide_parents: boolean;
  collapse_empty: boolean;
  card_density?: string;
  color_mode?: string;
}

export interface BoardBucketColumnRequest {
  id: string;
  query: string;
}

export interface BoardBucketsRequest {
  query?: string;
  query_hash?: string;
  columns: BoardBucketColumnRequest[];
  page_size?: number;
}

export interface BoardBucketResponseColumn {
  id: string;
  issue_ids?: string[];
  issueIds?: string[];
  count: number;
}

export interface BoardBucketsResponse {
  columns: BoardBucketResponseColumn[];
  issues: Issue[];
}
