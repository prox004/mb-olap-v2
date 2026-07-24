"use client";
import { Task } from "@/components/task/task-list/types/Task";
import TaskLane from "@/components/task/task-list/TaskLane";
import TaskHeader from "@/components/task/TaskHeader";
import React, { useState } from "react";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Finish user onboarding",
    isChecked: false,
    dueDate: "Tomorrow",
    commentCount: 1,
    category: "Marketing",
    userAvatar: "/images/user/user-01.jpg",
    status: "todo",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "2",
    title: "Solve the Dribble prioritization issue with the team",
    isChecked: false,
    dueDate: "Tomorrow",
    commentCount: 2,
    category: "Marketing",
    userAvatar: "/images/user/user-02.jpg",
    status: "todo",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "3",
    title: "Finish user onboarding",
    isChecked: true,
    dueDate: "Feb 12, 2024",
    commentCount: 1,
    category: "Marketing",
    userAvatar: "/images/user/user-03.jpg",
    status: "todo",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "4",
    title: "Work in Progress (WIP) Dashboard",
    isChecked: false,
    dueDate: "Jan 8, 2027",
    commentCount: 2,
    category: "Template",
    userAvatar: "/images/user/user-04.jpg",
    status: "in-progress",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "5",
    title: "Product Update - Q4 2024",
    isChecked: false,
    dueDate: "Jan 8, 2027",
    commentCount: 2,
    userAvatar: "/images/user/user-05.jpg",
    status: "in-progress",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "6",
    title: "Kanban Flow Manager",
    isChecked: true,
    dueDate: "Jan 8, 2027",
    commentCount: 2,
    userAvatar: "/images/user/user-06.jpg",
    status: "in-progress",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "7",
    title: "Make internal feedback",
    isChecked: false,
    dueDate: "Jan 8, 2027",
    commentCount: 2,
    userAvatar: "/images/user/user-07.jpg",
    status: "in-progress",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "8",
    title: "Do some projects on React Native with Flutter",
    isChecked: false,
    dueDate: "Feb 12, 2027",
    commentCount: 1,
    category: "Marketing",
    userAvatar: "/images/user/user-08.jpg",
    status: "completed",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "9",
    title: "Design marketing assets",
    isChecked: false,
    dueDate: "Feb 12, 2027",
    commentCount: 1,
    category: "Marketing",
    userAvatar: "/images/user/user-09.jpg",
    status: "completed",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "10",
    title: "Kanban Flow Manager",
    isChecked: false,
    dueDate: "Feb 12, 2027",
    commentCount: 1,
    category: "Marketing",
    userAvatar: "/images/user/user-10.jpg",
    status: "completed",
    toggleChecked: () => {}, // This will be replaced
  },
  {
    id: "11",
    title: "Change license and remove products",
    isChecked: false,
    dueDate: "Feb 12, 2027",
    commentCount: 1,
    category: "Marketing",
    userAvatar: "/images/user/user-11.jpg",
    status: "completed",
    toggleChecked: () => {}, // This will be replaced
  },
];

const lanes = ["todo", "in-progress", "completed"];

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(
    initialTasks.map((task) => ({
      ...task,
      toggleChecked: () => toggleChecked(task.id),
    }))
  );
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string
  ) => {
    setDragging(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (dragging === null) return;

    const updatedTasks = tasks.map((task) =>
      task.id === dragging ? { ...task, status } : task
    );

    // Sort tasks within the same status
    const statusTasks = updatedTasks.filter((task) => task.status === status);
    const otherTasks = updatedTasks.filter((task) => task.status !== status);

    const dropY = e.clientY;
    const droppedIndex = statusTasks.findIndex((task) => {
      const taskElement = document.getElementById(`task-${task.id}`);
      if (!taskElement) return false;
      const rect = taskElement.getBoundingClientRect();
      const taskMiddleY = rect.top + rect.height / 2;
      return dropY < taskMiddleY;
    });

    if (droppedIndex !== -1) {
      const draggedTask = statusTasks.find((task) => task.id === dragging);
      if (draggedTask) {
        statusTasks.splice(statusTasks.indexOf(draggedTask), 1);
        statusTasks.splice(droppedIndex, 0, draggedTask);
      }
    }

    setTasks([...otherTasks, ...statusTasks]);
    setDragging(null);
  };

  const toggleChecked = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isChecked: !task.isChecked } : task
      )
    );
  };
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <TaskHeader />

        <div className="p-4 space-y-8 border-t border-gray-200 mt-7 dark:border-gray-800 sm:mt-0 xl:p-6">
          {lanes.map((lane) => (
            <TaskLane
              key={lane}
              lane={lane}
              tasks={tasks.filter((task) => task.status === lane)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane)}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
