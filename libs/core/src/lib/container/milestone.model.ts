import { Issue } from '../issue/issue.model';
import { ContainerD } from './container.model';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  key: string;
  sort?: number;
  labels?: string[];

  issues?: Issue[];

  date?: string;
  date_calc?: string;

  container?: ContainerD;

  archived?: boolean;
  childs_total?: number;
  childs_resolved?: number;
  childs_estimated_total?: number;
  childs_estimated_resolved?: number;
}
export interface MilestoneD {
  id?: string;
  title?: string;
  key?: string;
  labels?: string[];
  archived?: boolean;
  sort?: number;
}
