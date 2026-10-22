import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { validateTaskInput } from "../utils/taskUtils";

function valuesFromTask(task) {
  return {
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    dueDate: task?.dueDate ? String(task.dueDate).slice(0, 10) : "",
  };
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}

export default function TaskForm({
  isOpen,
  initialTask = null,
  isMutating = false,
  onCancel,
  onSubmit,
}) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const [values, setValues] = useState(valuesFromTask(initialTask));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setValues(valuesFromTask(initialTask));
    setErrors({});
    setSubmitError("");
  }, [isOpen, initialTask?._id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validateTaskInput(values);
    setErrors(result.errors);
    setSubmitError("");
    if (!result.isValid) return;

    try {
      await onSubmit(result.values);
      onCancel();
    } catch (cause) {
      setErrors(cause?.fieldErrors || {});
      setSubmitError(
        cause?.fieldErrors
          ? ""
          : cause?.message ||
              "The task could not be saved. Your changes are still here; try again.",
      );
    }
  }

  const isEditing = Boolean(initialTask);

  return (
    <dialog
      className="w-[min(100%-2rem,38rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-slate-950/40"
      ref={dialogRef}
      aria-labelledby="task-form-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isMutating) onCancel();
      }}
    >
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              {isEditing ? "Update task" : "New task"}
            </p>
            <h2 id="task-form-title" className="mt-1 text-xl font-semibold">
              {isEditing ? "Edit task" : "Create a task"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Capture the details so you know what to work on next.
            </p>
          </div>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink"
            type="button"
            aria-label="Close task form"
            onClick={onCancel}
            disabled={isMutating}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <form className="space-y-5 px-5 py-5 sm:px-6" onSubmit={handleSubmit} noValidate>
        {submitError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {submitError}
          </p>
        )}

        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="task-title">
            Title <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            autoFocus
            ref={titleRef}
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
            id="task-title"
            name="title"
            type="text"
            value={values.title}
            onChange={updateField}
            maxLength={120}
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "task-title-error" : undefined}
            placeholder="For example, review the project brief"
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <FieldError id="task-title-error">{errors.title}</FieldError>
            <span className="ml-auto shrink-0 text-xs text-muted">
              {values.title.length}/120
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="task-description">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-lg border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
            id="task-description"
            name="description"
            value={values.description}
            onChange={updateField}
            maxLength={2000}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "task-description-error" : undefined
            }
            placeholder="Add context or a reminder"
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <FieldError id="task-description-error">
              {errors.description}
            </FieldError>
            <span className="ml-auto shrink-0 text-xs text-muted">
              {values.description.length}/2,000
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-ink" htmlFor="task-status">
              Status
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
              id="task-status"
              name="status"
              value={values.status}
              onChange={updateField}
              aria-invalid={Boolean(errors.status)}
              aria-describedby={errors.status ? "task-status-error" : undefined}
            >
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <FieldError id="task-status-error">{errors.status}</FieldError>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink" htmlFor="task-priority">
              Priority
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100"
              id="task-priority"
              name="priority"
              value={values.priority}
              onChange={updateField}
              aria-invalid={Boolean(errors.priority)}
              aria-describedby={
                errors.priority ? "task-priority-error" : undefined
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <FieldError id="task-priority-error">{errors.priority}</FieldError>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="task-due-date">
            Due date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:max-w-xs"
            id="task-due-date"
            name="dueDate"
            type="date"
            value={values.dueDate}
            onChange={updateField}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={errors.dueDate ? "task-due-date-error" : undefined}
          />
          <FieldError id="task-due-date-error">{errors.dueDate}</FieldError>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onCancel}
            disabled={isMutating}
          >
            Cancel
          </button>
          <button
            className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isMutating}
          >
            {isMutating ? "Saving…" : isEditing ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
