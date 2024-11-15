export interface BoardGroupsConfigServer {
  id: string;
  title: string;
  groups: {
    field: string;
    view: string;
    fixed: string[];
    group_only: boolean;
    show_empty: boolean;
  }[];
  view: string;
  type: string;
  shared: boolean;
  author_id: string;
  show_logs: boolean;
  hide_parents: boolean;
  collapse_empty: boolean;
}
