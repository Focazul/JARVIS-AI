export interface Alarm {
  id: string;
  time: string; // ISO string or HH:mm format
  description: string;
  active: boolean;
}

export interface Task {
  id: string;
  title: string;
  date?: string; // ISO string or 'Sem data'
  time?: string;
  completed: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export enum ToolName {
  ADD_ALARM = 'addAlarm',
  LIST_ALARMS = 'listAlarms',
  DELETE_ALARM = 'deleteAlarm',
  ADD_TASK = 'addTask',
  LIST_TASKS = 'listTasks',
  COMPLETE_TASK = 'completeTask',
  DELETE_TASK = 'deleteTask'
}
