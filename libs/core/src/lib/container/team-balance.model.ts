export class TeamBalanceEntry {
  container: {
    id: string;
    key: string;
    title: string;
  };
  default_occupation: number;
  is_worker: boolean;
  reserve_shared: boolean;
  periods: TeamBalanceSlot[];
}
export class TeamBalanceSlot {
  period_start: string;
  occupation: number;
  default: boolean;
  title: string;
}

export type TeamBalance = TeamBalanceEntry[];
