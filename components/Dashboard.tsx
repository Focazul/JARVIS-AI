import React from 'react';
import { Alarm, Task } from '../types';
import { Clock, CheckSquare, Trash2, Check, Bell } from 'lucide-react';

interface DashboardProps {
  alarms: Alarm[];
  tasks: Task[];
  onDeleteAlarm: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  alarms,
  tasks,
  onDeleteAlarm,
  onDeleteTask,
  onToggleTask,
}) => {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      
      {/* Alarms Section */}
      <section>
        <h2 className="text-cyan-400 font-tech text-lg mb-3 flex items-center gap-2">
          <Clock size={20} /> ALARMES ATIVOS
        </h2>
        {alarms.length === 0 ? (
          <p className="text-slate-500 text-sm italic">Nenhum alarme configurado.</p>
        ) : (
          <div className="space-y-2">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-tech text-white">{alarm.time}</div>
                  <div className="text-xs text-slate-400">{alarm.description}</div>
                </div>
                <button
                  onClick={() => onDeleteAlarm(alarm.id)}
                  className="p-2 hover:bg-red-900/30 rounded-full text-slate-500 hover:text-red-400 transition-colors"
                  title="Excluir alarme"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasks Section */}
      <section>
        <h2 className="text-blue-400 font-tech text-lg mb-3 flex items-center gap-2">
          <CheckSquare size={20} /> TAREFAS
        </h2>
        {tasks.length === 0 ? (
          <p className="text-slate-500 text-sm italic">Nenhuma tarefa pendente.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-slate-800/50 border ${
                  task.completed ? 'border-green-900/50 bg-green-900/10' : 'border-slate-700'
                } rounded-lg p-3 flex items-start gap-3 group transition-all`}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-500 hover:border-blue-400'
                  }`}
                >
                  {task.completed && <Check size={12} />}
                </button>
                <div className="flex-1">
                  <div className={`text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex gap-2">
                    {task.date && <span>📅 {task.date}</span>}
                    {task.time && <span>⏰ {task.time}</span>}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Decorative Elements */}
      <div className="pt-8 flex justify-center opacity-30">
        <div className="border-t border-cyan-500 w-16"></div>
      </div>
      <div className="text-center text-xs text-cyan-900 font-tech">
        J.A.R.V.I.S SYSTEMS ONLINE
      </div>
    </div>
  );
};
