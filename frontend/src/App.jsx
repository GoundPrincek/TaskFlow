import { useState } from "react";
import {
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { TasksProvider, useTasks } from "./hooks/useTasks";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import TaskForm from "./components/TaskForm";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import NotFound from "./pages/NotFound";
import { dataMode, taskService } from "./services/taskService";

function AppLayout({ mode }) {
  const { createTask, updateTask, deleteTask, isMutating } = useTasks();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  function openCreateTask() {
    setEditingTask(null);
    setIsFormOpen(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setIsFormOpen(true);
  }

  async function saveTask(values) {
    if (editingTask) {
      await updateTask(editingTask._id, values);
      setToastMessage("Task updated successfully.");
    } else {
      await createTask(values);
      setToastMessage("Task created successfully.");
    }
    setIsFormOpen(false);
    setEditingTask(null);
  }

  async function confirmDeleteTask() {
    if (!deletingTask) return;
    await deleteTask(deletingTask._id);
    setToastMessage("Task deleted successfully.");
    setDeletingTask(null);
  }

  function closeTaskForm() {
    if (isMutating) return;
    setIsFormOpen(false);
    setEditingTask(null);
  }

  const pageActions = {
    onCreateTask: openCreateTask,
    onEditTask: openEditTask,
    onDeleteTask: setDeletingTask,
  };

  return (
    <div className="min-h-screen">
      <a
        className="sr-only fixed left-3 top-3 z-[60] rounded-lg bg-white px-4 py-3 font-semibold text-brand shadow-card focus:not-sr-only"
        href="#main-content"
      >
        Skip to main content
      </a>
      <Navbar
        isMockMode={mode === "mock"}
        isNavigationOpen={isNavigationOpen}
        onCreateTask={openCreateTask}
        onToggleNavigation={() =>
          setIsNavigationOpen((current) => !current)
        }
      />
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar
          isOpen={isNavigationOpen}
          onNavigate={() => setIsNavigationOpen(false)}
        />
        {isNavigationOpen && (
          <button
            className="fixed inset-x-0 bottom-0 top-[72px] z-30 cursor-default bg-slate-950/25 lg:hidden"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsNavigationOpen(false)}
          />
        )}
        <main
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet context={pageActions} />
          </div>
        </main>
      </div>

      <TaskForm
        isOpen={isFormOpen}
        initialTask={editingTask}
        isMutating={isMutating}
        onCancel={closeTaskForm}
        onSubmit={saveTask}
      />
      <ConfirmDialog
        isOpen={Boolean(deletingTask)}
        title="Delete this task?"
        description={
          deletingTask
            ? "“" + deletingTask.title + "” will be permanently removed."
            : undefined
        }
        isPending={isMutating}
        onCancel={() => {
          if (!isMutating) setDeletingTask(null);
        }}
        onConfirm={confirmDeleteTask}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
}

export function TaskFlowRoutes({ mode = dataMode }) {
  return (
    <Routes>
      <Route element={<AppLayout mode={mode} />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App({
  service = taskService,
  mode = dataMode,
}) {
  return (
    <TasksProvider service={service} mode={mode}>
      <TaskFlowRoutes mode={mode} />
    </TasksProvider>
  );
}
