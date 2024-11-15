import { Priority, Status, Type } from '../settings/dictionary.model';
import { UserD } from '../user/user.model';

export interface Team {
  user?: UserD;
  date_start?: string;
  date_end?: string;
  occupation_slots?: OccupationSlot[];
  reserve_shared?: boolean;
  worker?: boolean;
  assignee_rules?: {
    skills: string[];
    labels: string[];
    statuses: Status[];
    types: Type[];
    priorities: Priority[];
  };
}

export interface OccupationSlot {
  slot_start?: string;
  slot_end?: string;
  title?: string;
  slot_occupation?: number;
}
