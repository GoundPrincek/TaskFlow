import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { calculateDashboardStats } from "../utils/taskUtils";
import { dataMode, taskService } from "../services/taskService";

const emptyStats = {
  totalTasks: 0,
  todoTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  completionPercentage: 0,
};

const initialState = {
  tasks: [],
  stats: emptyStats,
  isLoading: true,
  isMutating: false,
  error: null,
  hasLoaded: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "load-start":
      return { ...state, isLoading: true, error: null };
    case "load-success":
      return {
        ...state,
        tasks: action.tasks,
        stats: action.stats,
        isLoading: false,
        error: null,
        hasLoaded: true,
      };
    case "load-error":
      return {
        ...state,
        isLoading: false,
        error: action.message,
        hasLoaded: true,
      };
    case "mutation-start":
      return { ...state, isMutating: true };
    case "mutation-end":
      return { ...state, isMutating: false };
    case "task-created": {
      const tasks = [action.task, ...state.tasks];
      return { ...state, tasks, stats: calculateDashboardStats(tasks) };
    }
    case "task-updated": {
      const tasks = state.tasks.map((task) =>
        task._id === action.task._id ? action.task : task,
      );
      return { ...state, tasks, stats: calculateDashboardStats(tasks) };
    }
    case "task-deleted": {
      const tasks = state.tasks.filter((task) => task._id !== action.id);
      return { ...state, tasks, stats: calculateDashboardStats(tasks) };
    }
    default:
      return state;
  }
}

const TasksContext = createContext(null);

export function TasksProvider({
  children,
  service = taskService,
  mode = dataMode,
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(async () => {
    dispatch({ type: "load-start" });
    try {
      const [tasks, stats] = await Promise.all([
        service.listTasks(),
        service.getStats(),
      ]);
      dispatch({ type: "load-success", tasks, stats });
      return { tasks, stats };
    } catch (error) {
      dispatch({
        type: "load-error",
        message:
          error?.message ||
          "TaskFlow could not load your tasks. Please try again.",
      });
      throw error;
    }
  }, [service]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const createTask = useCallback(
    async (input) => {
      dispatch({ type: "mutation-start" });
      try {
        const task = await service.createTask(input);
        dispatch({ type: "task-created", task });
        return task;
      } finally {
        dispatch({ type: "mutation-end" });
      }
    },
    [service],
  );

  const updateTask = useCallback(
    async (id, input) => {
      dispatch({ type: "mutation-start" });
      try {
        const task = await service.updateTask(id, input);
        dispatch({ type: "task-updated", task });
        return task;
      } finally {
        dispatch({ type: "mutation-end" });
      }
    },
    [service],
  );

  const deleteTask = useCallback(
    async (id) => {
      dispatch({ type: "mutation-start" });
      try {
        await service.deleteTask(id);
        dispatch({ type: "task-deleted", id });
      } finally {
        dispatch({ type: "mutation-end" });
      }
    },
    [service],
  );

  const value = useMemo(
    () => ({
      ...state,
      mode,
      refresh,
      createTask,
      updateTask,
      deleteTask,
    }),
    [state, mode, refresh, createTask, updateTask, deleteTask],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used inside a TasksProvider.");
  }
  return context;
}
