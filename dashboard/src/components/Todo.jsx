import React, { useState, useEffect, useMemo } from "react";
import Header from "./Header";
import { 
  CheckSquare, Plus, Trash2, Calendar, AlertCircle, Circle, 
  CheckCircle2, Flame, RefreshCw, BarChart2, CheckCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

const Todo = () => {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("admin_todos");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 1,
        title: "Review daily sales logs",
        description: "Verify today's revenue calculations match Stripe payment gateway reports.",
        priority: "High",
        dueDate: new Date().toISOString().split("T")[0],
        completed: false
      },
      {
        id: 2,
        title: "Resolve customer refund ticket #INV-2933",
        description: "Re-run the refund pipeline check on postgres database schema for pending orders.",
        priority: "Medium",
        dueDate: new Date().toISOString().split("T")[0],
        completed: true
      },
      {
        id: 3,
        title: "Restock limited inventory nodes",
        description: "Update the catalog inventory quantity sliders for items with stock counts less than 5 units.",
        priority: "High",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        completed: false
      }
    ];
  });

  // Compose / Input states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [filter, setFilter] = useState("All");

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("admin_todos", JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please specify a task title.");
      return;
    }

    const newTodoItem = {
      id: Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      dueDate: newDueDate || new Date().toISOString().split("T")[0],
      completed: false
    };

    setTodos(prev => [newTodoItem, ...prev]);
    toast.success("Task added to workflow ledger!");
    
    // Reset fields
    setNewTitle("");
    setNewDesc("");
    setNewPriority("Medium");
    setNewDueDate("");
  };

  const handleToggleComplete = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    toast.success("Task deleted.");
  };

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (filter === "Active") return !t.completed;
      if (filter === "Completed") return t.completed;
      if (filter === "High Priority") return t.priority === "High";
      return true;
    });
  }, [todos, filter]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, percent };
  }, [todos]);

  return (
    <main className="min-h-screen bg-[#090d16] font-sans text-slate-200 pb-20 transition-all duration-500 w-full antialiased p-[10px] pl-[10px] md:pl-[17rem] box-border relative overflow-x-hidden">
      
      {/* BACKGROUND VECTOR */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="flex-1 md:p-6 space-y-8 relative z-10 w-full box-border">
        <Header />

        {/* 🌌 HERO HEADER */}
        <div className="bg-slate-900/40 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group w-full box-border">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
          
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-xl shadow-inner w-max">
              <CheckSquare size={11} className="text-indigo-400 animate-pulse" /> Operator Workstation
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-3">
              Todo Management Console<span className="text-indigo-500 font-serif font-light text-2xl">/</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-2xl">
              Track operational tasks, schedule database audits, and prioritize catalog supply reviews.
            </p>
          </div>

          {/* DYNAMIC PROGRESS ACCUMULATOR */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl w-full sm:w-64 space-y-3 shadow-inner">
            <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1"><BarChart2 size={13} className="text-indigo-400"/> Completion Meter</span>
              <span className="text-white font-mono text-sm">{stats.percent}%</span>
            </div>
            
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${stats.percent}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>{stats.completed} Done</span>
              <span>{stats.active} Pending</span>
            </div>
          </div>
        </div>

        {/* 🛠️ TASK MANAGEMENT WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full box-border">
          
          {/* LEFT: COMPOSE TASK (5 Columns) */}
          <div className="lg:col-span-5 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-5">
              <Plus size={15} className="text-indigo-400"/> Add Task Node
            </h3>

            <form onSubmit={handleAddTodo} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Heading</label>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority Rating</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Timestamp</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                <textarea
                  placeholder="Task details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-850 focus:border-indigo-650 rounded-xl outline-none font-bold text-xs text-slate-200 transition h-24 resize-none placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg border border-indigo-500/20 active:scale-95 transition mt-2"
              >
                <Plus size={14}/> Add To Workflow
              </button>
            </form>
          </div>

          {/* RIGHT: TASK INDEX (7 Columns) */}
          <div className="lg:col-span-7 bg-slate-900/30 backdrop-blur-3xl p-5 sm:p-6 rounded-[2.5rem] border border-slate-800/60 shadow-xl flex flex-col gap-4 max-h-[600px] overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-400"/> Task Directory
              </h3>

              {/* FILTERS */}
              <div className="flex flex-wrap items-center gap-1.5">
                {["All", "Active", "Completed", "High Priority"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                      filter === f
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* TASK LIST SCROLL */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3.5">
              {filteredTodos.length > 0 ? (
                filteredTodos.map((todo) => {
                  const isHigh = todo.priority === "High";
                  const isMedium = todo.priority === "Medium";

                  return (
                    <div
                      key={todo.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                        todo.completed
                          ? "bg-slate-950/20 border-slate-900 opacity-60"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80"
                      }`}
                    >
                      {/* TOGGLE BUTTON */}
                      <button 
                        onClick={() => handleToggleComplete(todo.id)}
                        className="p-1 text-slate-500 hover:text-indigo-400 transition mt-0.5 shrink-0"
                      >
                        {todo.completed ? (
                          <CheckCircle2 size={18} className="text-indigo-400 fill-indigo-900/10" />
                        ) : (
                          <Circle size={18} className="text-slate-600" />
                        )}
                      </button>

                      {/* TASK INFO */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2 flex-wrap sm:flex-nowrap">
                          <h4 className={`text-xs font-black truncate max-w-[280px] ${
                            todo.completed ? "line-through text-slate-500" : "text-white"
                          }`}>
                            {todo.title}
                          </h4>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-black text-[8px] uppercase tracking-wider shrink-0 ${
                            isHigh ? "bg-rose-950/60 border-rose-800/50 text-rose-400" :
                            isMedium ? "bg-amber-950/60 border-amber-800/50 text-amber-400" :
                            "bg-emerald-950/60 border-emerald-800/50 text-emerald-400"
                          }`}>
                            {todo.priority}
                          </span>
                        </div>

                        {todo.description && (
                          <p className={`text-[10px] leading-relaxed font-semibold ${
                            todo.completed ? "text-slate-600" : "text-slate-400"
                          }`}>
                            {todo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 pt-1">
                          <Calendar size={11} /> Due: {todo.dueDate}
                        </div>
                      </div>

                      {/* DELETE */}
                      <button 
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-2 bg-slate-900/60 hover:bg-rose-950/30 hover:border-rose-800/40 border border-slate-850 hover:text-rose-400 text-slate-500 rounded-xl transition shrink-0 self-center"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <CheckCircle className="text-slate-700" size={32} />
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider">No tasks matching category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Todo;
