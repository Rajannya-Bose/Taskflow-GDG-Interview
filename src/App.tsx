import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ClipboardList,
  ExternalLink,
  Filter,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import '@/index.css';

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
type Priority = 'low' | 'medium' | 'high';
type SortKey = 'title' | 'status' | 'assignee' | 'priority' | 'due_date' | 'progress';

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  priority: Priority;
  due_date: string;
  progress: number;
};

const people: Record<string, { initials: string; color: string }> = {
  Maya: { initials: 'MA', color: '#dceeff' },
  Alex: { initials: 'AL', color: '#e0f5ea' },
  Jordan: { initials: 'JO', color: '#f9e7d6' },
  Fatima: { initials: 'FA', color: '#eee4ff' },
  Ken: { initials: 'KE', color: '#fff0c8' },
  Ben: { initials: 'BE', color: '#dff4f1' },
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  );

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('due_date');
  const [sortAscending, setSortAscending] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      const { data, error } = await supabase
        .from('taskflow_tasks')
        .select('id, title, status, assignee, priority, due_date, progress')
        .order('due_date', { ascending: true });

      if (error) {
        setLoadError('We could not load your tasks. Please refresh and try again.');
      } else {
        setTasks((data ?? []) as Task[]);
      }
      setIsLoading(false);
    };

    void loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...tasks]
      .filter((task) => {
        const matchesSearch = !normalizedSearch || `${task.title} ${task.assignee}`.toLowerCase().includes(normalizedSearch);
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const first = String(a[sortKey]);
        const second = String(b[sortKey]);
        return first.localeCompare(second, undefined, { numeric: true }) * (sortAscending ? 1 : -1);
      });
  }, [search, sortAscending, sortKey, statusFilter, tasks]);

  const totals = useMemo(() => ({
    done: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    blocked: tasks.filter((task) => task.status === 'blocked').length,
  }), [tasks]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAscending((value) => !value);
    else {
      setSortKey(key);
      setSortAscending(true);
    }
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    const progress = status === 'done' ? 100 : status === 'todo' ? 0 : task.progress;
    const { error } = await supabase.from('taskflow_tasks').update({ status, progress, updated_at: new Date().toISOString() }).eq('id', task.id);
    if (!error) setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status, progress } : item));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('taskflow_tasks').delete().eq('id', id);
    if (!error) setTasks((current) => current.filter((task) => task.id !== id));
  };

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newTask = {
      title: String(form.get('title') ?? '').trim(),
      assignee: String(form.get('assignee') ?? 'Maya'),
      priority: String(form.get('priority') ?? 'medium') as Priority,
      due_date: String(form.get('due_date') ?? ''),
      status: 'todo' as TaskStatus,
      progress: 0,
    };
    if (!newTask.title || !newTask.due_date) return;
    const { data, error } = await supabase.from('taskflow_tasks').insert(newTask).select('id, title, status, assignee, priority, due_date, progress').maybeSingle();
    if (!error && data) {
      setTasks((current) => [...current, data as Task]);
      setShowAddTask(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><span>TaskFlow</span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">ST</div><div><strong>Study team</strong><span>Academic year 2026</span></div><ChevronDown size={15} /></div>
        <nav className="main-nav" aria-label="Primary navigation">
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
          <NavItem icon={<ClipboardList size={18} />} label="My tasks" badge="8" />
          <NavItem icon={<CalendarDays size={18} />} label="Calendar" />
          <NavItem icon={<BookOpen size={18} />} label="Classes" />
          <NavItem icon={<Users size={18} />} label="Study group" />
        </nav>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="main-nav">
          <NavItem icon={<TrendingUp size={18} />} label="Progress" />
          <NavItem icon={<Target size={18} />} label="Goals" />
          <NavItem icon={<Settings size={18} />} label="Settings" />
        </nav>
        <div className="sidebar-footer"><div className="help-card"><CircleHelp size={17} /><div><strong>Need a hand?</strong><span>View productivity tips</span></div><ExternalLink size={14} /></div><div className="user-row"><div className="avatar avatar-user">SJ</div><div><strong>Sarah Johnson</strong><span>Student account</span></div><MoreHorizontal size={18} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Overview</strong></div><div className="topbar-actions"><div className="global-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" /></div><button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button><div className="top-user"><div className="avatar avatar-user">SJ</div><span>Sarah J.</span><ChevronDown size={15} /></div></div></header>

        <div className="page-content">
          <section className="page-heading"><div><div className="eyebrow"><span className="status-dot" /> Tuesday, June 10, 2026</div><h1>Good morning, Sarah</h1><p>Here’s what’s happening with your study plan this week.</p></div><div className="heading-actions"><button className="secondary-button"><CalendarDays size={16} /> Jun 8 – Jun 14 <ChevronDown size={15} /></button><button className="primary-button" onClick={() => setShowAddTask(true)}><Plus size={17} /> Add task</button></div></section>

          {loadError && <div className="error-banner">{loadError}</div>}
          <section className="stat-grid" aria-label="Productivity summary"><StatCard label="Tasks completed" value={`${totals.done + 12}`} detail="+18% from last week" positive icon={<Check size={18} />} accent="blue" /><StatCard label="Current streak" value="12 days" detail="Personal best: 19 days" icon={<Sparkles size={18} />} accent="orange" /><StatCard label="Focus time" value="14h 40m" detail="+2h 10m from last week" positive icon={<Target size={18} />} accent="green" /><StatCard label="Weekly completion" value="78%" detail="Above your 70% goal" positive icon={<TrendingUp size={18} />} accent="purple" /></section>

          <section className="charts-grid"><div className="panel burndown-panel"><PanelHeader title="Weekly progress" subtitle="Tasks completed over the last 7 days" action="Last 7 days" /><div className="line-chart"><div className="chart-y-labels"><span>12</span><span>8</span><span>4</span><span>0</span></div><svg viewBox="0 0 620 210" role="img" aria-label="Line chart showing tasks completed rising through the week"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2d78c8" stopOpacity=".18" /><stop offset="100%" stopColor="#2d78c8" stopOpacity="0" /></linearGradient></defs><line className="grid-line" x1="22" y1="20" x2="600" y2="20" /><line className="grid-line" x1="22" y1="76" x2="600" y2="76" /><line className="grid-line" x1="22" y1="132" x2="600" y2="132" /><line className="grid-line" x1="22" y1="188" x2="600" y2="188" /><path d="M22 168 C68 157 91 146 118 151 S169 127 204 136 S253 110 286 116 S332 95 368 103 S419 72 450 80 S496 52 526 61 S566 25 600 35 L600 188 L22 188 Z" fill="url(#areaFill)" /><path className="chart-path" d="M22 168 C68 157 91 146 118 151 S169 127 204 136 S253 110 286 116 S332 95 368 103 S419 72 450 80 S496 52 526 61 S566 25 600 35" /><circle className="chart-point" cx="600" cy="35" r="5" /></svg><div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div><div className="chart-caption"><span><i className="legend-line" /> Completed tasks</span><strong>+24% <small>vs. last week</small></strong></div></div><div className="panel status-panel"><PanelHeader title="Task status" subtitle="Your current workload" action="This week" /><div className="donut-wrap"><div className="donut" style={{ '--done': `${Math.max(8, totals.done * 10)}deg`, '--progress': `${Math.max(50, totals.inProgress * 14)}deg` } as React.CSSProperties}><div><strong>{tasks.length}</strong><span>Total tasks</span></div></div><div className="status-legend"><LegendRow color="green" label="Completed" value={totals.done + 12} /><LegendRow color="blue" label="In progress" value={totals.inProgress + 4} /><LegendRow color="yellow" label="To do" value={tasks.filter((task) => task.status === 'todo').length + 3} /><LegendRow color="red" label="Blocked" value={totals.blocked} /></div></div><div className="status-foot"><span><span className="mini-spark">↗</span> 6 tasks due this week</span><button onClick={() => setStatusFilter('all')}>View breakdown <ExternalLink size={13} /></button></div></div></section>

          <section className="panel task-panel"><div className="task-panel-header"><div><div className="section-kicker">Your workload</div><h2>My tasks <span>{filteredTasks.length}</span></h2></div><div className="task-controls"><button className={`filter-button ${showFilters ? 'selected' : ''}`} onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={16} /> Filters {statusFilter !== 'all' && <b>1</b>}</button><button className="more-button" aria-label="More task options"><MoreHorizontal size={19} /></button></div></div>{showFilters && <div className="filter-row"><Filter size={16} /><span>Status</span>{(['all', 'todo', 'in_progress', 'done', 'blocked'] as const).map((status) => <button key={status} className={statusFilter === status ? 'filter-chip active' : 'filter-chip'} onClick={() => setStatusFilter(status)}>{status === 'all' ? 'All tasks' : statusLabels[status]}</button>)}</div>}<div className="table-wrap"><table><thead><tr><SortableHeader label="Task" sortKey="title" current={sortKey} ascending={sortAscending} onSort={handleSort} /><SortableHeader label="Status" sortKey="status" current={sortKey} ascending={sortAscending} onSort={handleSort} /><SortableHeader label="Assigned to" sortKey="assignee" current={sortKey} ascending={sortAscending} onSort={handleSort} /><SortableHeader label="Priority" sortKey="priority" current={sortKey} ascending={sortAscending} onSort={handleSort} /><SortableHeader label="Due date" sortKey="due_date" current={sortKey} ascending={sortAscending} onSort={handleSort} /><SortableHeader label="Progress" sortKey="progress" current={sortKey} ascending={sortAscending} onSort={handleSort} /><th aria-label="Actions" /></tr></thead><tbody>{isLoading ? <tr><td colSpan={7} className="empty-state">Loading your tasks…</td></tr> : filteredTasks.length === 0 ? <tr><td colSpan={7} className="empty-state">No tasks match your search.</td></tr> : filteredTasks.map((task) => <TaskRow key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={handleDelete} />)}</tbody></table></div><div className="table-footer"><span>Showing {filteredTasks.length} of {tasks.length} tasks</span><button onClick={() => setShowAddTask(true)}><Plus size={15} /> Add a task</button></div></section>
        </div>
      </main>
      {showAddTask && <div className="modal-backdrop" onMouseDown={() => setShowAddTask(false)}><form className="modal" onSubmit={handleAddTask} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><div className="section-kicker">New item</div><h2>Add a task</h2></div><button type="button" className="close-button" onClick={() => setShowAddTask(false)}><X size={19} /></button></div><label>Task name<input name="title" autoFocus placeholder="e.g. Prepare exam notes" required /></label><div className="form-grid"><label>Assigned to<select name="assignee" defaultValue="Maya">{Object.keys(people).map((person) => <option key={person}>{person}</option>)}</select></label><label>Priority<select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div><label>Due date<input type="date" name="due_date" defaultValue="2026-06-16" required /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowAddTask(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} /> Create task</button></div></form></div>}
    </div>
  );
}

function NavItem({ icon, label, active = false, badge }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string }) {
  return <a className={`nav-item ${active ? 'active' : ''}`} href="#"><span>{icon}</span>{label}{badge && <em>{badge}</em>}</a>;
}

function StatCard({ label, value, detail, positive, icon, accent }: { label: string; value: string; detail: string; positive?: boolean; icon: React.ReactNode; accent: string }) {
  return <article className="stat-card"><div className={`stat-icon ${accent}`}>{icon}</div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className={positive ? 'positive' : ''}>{positive && <TrendingUp size={12} />}{detail}</small></div><MoreHorizontal size={18} className="stat-more" /></article>;
}

function PanelHeader({ title, subtitle, action }: { title: string; subtitle: string; action: string }) {
  return <div className="panel-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="panel-action">{action}<ChevronDown size={14} /></button></div>;
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return <div className="legend-row"><i className={`legend-dot ${color}`} /><span>{label}</span><strong>{value}</strong></div>;
}

function SortableHeader({ label, sortKey, current, ascending, onSort }: { label: string; sortKey: SortKey; current: SortKey; ascending: boolean; onSort: (key: SortKey) => void }) {
  const isCurrent = current === sortKey;
  return <th><button className="sort-button" onClick={() => onSort(sortKey)}>{label}{isCurrent ? ascending ? <ChevronUp size={14} /> : <ChevronDown size={14} /> : <ChevronDown size={14} className="sort-muted" />}</button></th>;
}

function TaskRow({ task, onStatusChange, onDelete }: { task: Task; onStatusChange: (task: Task, status: TaskStatus) => void; onDelete: (id: string) => void }) {
  const person = people[task.assignee] ?? { initials: task.assignee.slice(0, 2).toUpperCase(), color: '#e9eef5' };
  return <tr><td><div className="task-title-cell"><button className="task-check" aria-label={`Mark ${task.title} done`} onClick={() => onStatusChange(task, task.status === 'done' ? 'todo' : 'done')}>{task.status === 'done' && <Check size={13} />}</button><span>{task.title}</span></div></td><td><select className={`status-pill ${task.status}`} value={task.status} onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)} aria-label={`Status for ${task.title}`}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td><div className="assignee"><span className="avatar" style={{ backgroundColor: person.color }}>{person.initials}</span>{task.assignee}</div></td><td><span className={`priority-pill ${task.priority}`}>{task.priority}</span></td><td className="date-cell">{formatDate(task.due_date)}</td><td><div className="progress-cell"><span>{task.progress}%</span><div className="progress-track"><div className={`progress-fill ${task.status}`} style={{ width: `${task.progress}%` }} /></div></div></td><td><button className="row-delete" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button></td></tr>;
}

export default App;
