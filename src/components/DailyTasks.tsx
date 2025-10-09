import { useState, useEffect } from 'react';
import { CheckCircle, Gift, ExternalLink, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, DailyTask } from '../lib/supabase';

export function DailyTasks() {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [claimingTask, setClaimingTask] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);

    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('is_active', true)
      .order('reward_amount', { ascending: false });

    const today = new Date().toISOString().split('T')[0];
    const { data: completionsData } = await supabase
      .from('user_task_completions')
      .select('task_id')
      .eq('user_id', user!.id)
      .eq('completion_date', today);

    if (tasksData) setTasks(tasksData);
    if (completionsData) {
      setCompletedTaskIds(new Set(completionsData.map(c => c.task_id)));
    }

    setLoading(false);
  };

  const handleCompleteTask = async (task: DailyTask) => {
    if (!user) return;

    setClaimingTask(task.id);

    try {
      if (task.task_url) {
        window.open(task.task_url, '_blank');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase.from('user_task_completions').insert({
        user_id: user.id,
        task_id: task.id,
        completion_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      setCompletedTaskIds(prev => new Set([...prev, task.id]));
      await refreshProfile();
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setClaimingTask(null);
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'social_media':
        return <Gift className="text-blue-400" size={24} />;
      case 'video':
        return <Award className="text-red-400" size={24} />;
      default:
        return <Gift className="text-emerald-400" size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Daily Tasks</h2>
        <div className="text-center py-8 text-slate-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Daily Tasks</h2>
        <span className="text-sm text-slate-400">
          {completedTaskIds.size} / {tasks.length} completed
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isCompleted = completedTaskIds.has(task.id);
          const isClaiming = claimingTask === task.id;

          return (
            <div
              key={task.id}
              className={`bg-slate-700/50 rounded-lg p-4 border transition-all ${
                isCompleted
                  ? 'border-emerald-500/50 opacity-75'
                  : 'border-slate-600 hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="text-emerald-400" size={24} />
                  ) : (
                    getTaskIcon(task.task_type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1">{task.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{task.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">
                        +${task.reward_amount.toFixed(2)}
                      </span>
                      <span className="text-slate-400 text-xs">reward</span>
                    </div>

                    {isCompleted ? (
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        disabled={isClaiming}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isClaiming ? (
                          'Claiming...'
                        ) : (
                          <>
                            Complete Task
                            <ExternalLink size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Gift size={48} className="mx-auto mb-3 opacity-50" />
          <p>No tasks available right now</p>
          <p className="text-sm mt-1">Check back tomorrow for new tasks</p>
        </div>
      )}
    </div>
  );
}
