import { TableSettings } from '@renwu/components';

export const DefaultColumnsSettings: TableSettings = {
  key: { width: '7em', priority: -1 },
  title: { width: '100%', style: { whiteSpace: 'normal' }, priority: -1 },
  status: { width: '9em', priority: 3 },
  completion: { width: '7em', style: { textAlign: 'center' }, priority: 6 },
  priority: { width: '6em', style: { textAlign: 'center' }, priority: 3.1 },
  type: { width: '4.5em', style: { textAlign: 'center' }, priority: 3.2 },
  resolution: { width: '6.5em', style: { textAlign: 'center' }, priority: 7 },
  assignes: { width: '20%', style: { textAlign: 'center' }, priority: 4 },
  reporter: {
    width: '20%',
    style: {
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
    },
    priority: 8,
  },
  skill: { width: '25%', priority: 9 },
  labels: { width: '25%', priority: 10 },
  milestones: { width: '20%', priority: 5 },
  affected_versions: { width: '20%', priority: 11 },
  date_created: { width: '10em', priority: 14 },
  date_status_changed: { width: '10em', priority: 12 },
  date_last_update: { width: '10em', priority: 13 },
  milestone_date: { width: '8em', priority: 5 },
  milestone_date_calc: { width: '8em', priority: 6 },
  estimated_time: { width: '8em', priority: 3.3 },

  news: { width: '3em', priority: 0 },
  hours: { width: '6em', priority: 0 },
  issues: { width: '6em', priority: 0 },
  date: { width: '10em', priority: 0 },
  deadline: { width: '8em', priority: 0 },
  editicon: { width: '2em', priority: 0 },

  symbol: { width: '6em', style: { textAlign: 'center' }, priority: 0 },
  checkbox: {
    width: '6em',
    styleHead: {
      display: 'initial',
    },
    style: {
      whiteSpace: 'normal',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
    },
    priority: -1,
  },
  order: { width: '5em', style: { textAlign: 'center' }, priority: 1 },
  label: { width: '50%', priority: 0 },
  color: { width: '6em', style: { textAlign: 'center' }, priority: 0 },
};
