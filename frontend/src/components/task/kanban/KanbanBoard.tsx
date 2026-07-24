"use client";
import React, { useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Column from "./Column";
import { Task } from "./types/types";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Finish user onboarding",
    dueDate: "Tomorrow",
    comments: 1,
    assignee: "/images/user/user-01.jpg",
    status: "todo",
    category: { name: "Development", color: "orange" },
  },
  {
    id: "2",
    title: "Solve the dribble prioritization issue with the team",
    dueDate: "Jan 08, 2027",
    comments: 1,
    assignee: "/images/user/user-01.jpg",
    status: "todo",
    category: { name: "Marketing", color: "brand" },
  },
  {
    id: "3",
    title: "Change license and remove products",
    dueDate: "Jan 8, 2027",
    assignee: "/images/user/user-07.jpg",
    status: "todo",
    category: { name: "Dev", color: "default" },
  },
  {
    id: "4",
    title: "Work in progress(WIP) Dashboard",
    dueDate: "Today",
    comments: 1,
    assignee: "/images/user/user-09.jpg",
    status: "inProgress",
    category: { name: "Development", color: "default" },
  },
  {
    id: "5",
    title: "Kanban  manager",
    dueDate: "Jan 08, 2027",
    comments: 8,
    assignee: "/images/user/user-10.jpg",
    status: "inProgress",
    category: { name: "Template", color: "success" },
    links: 2,
  },
  {
    id: "6",
    title: "Product Update - Q4 (2024)",
    projectDesc:
      "Dedicated from a category of users that will perform actions.",
    projectImg: "/images/task/task.png",
    dueDate: "Today",
    comments: 1,
    assignee: "/images/user/user-09.jpg",
    status: "inProgress",
    category: { name: "Development", color: "default" },
  },
  {
    id: "7",
    title: "Make figbot send comment when ticket is auto-moved back to inbox",
    dueDate: "Mar 08, 2027",
    comments: 1,
    assignee: "/images/user/user-12.jpg",
    status: "inProgress",
    category: { name: "Dev", color: "default" },
  },
  {
    id: "8",
    title: "Manage internal feedback",
    dueDate: "Tomorrow",
    comments: 1,
    assignee: "/images/user/user-13.jpg",
    status: "completed",
    category: { name: "Dev", color: "default" },
  },
  {
    id: "9",
    title: "Do some projects on React Native with Flutter",
    dueDate: "Jan 8, 2027",
    comments: 1,
    assignee: "/images/user/user-14.jpg",
    status: "completed",
    category: { name: "Development", color: "orange" },
  },
  {
    id: "10",
    title: "Design marketing assets",
    dueDate: "Jan 08, 2027",
    comments: 2,
    assignee: "/images/user/user-10.jpg",
    status: "completed",
    category: { name: "Marketing", color: "brand" },
    links: 1,
  },
  {
    id: "11",
    title: "Kanban flow manager",
    dueDate: "Jan 08, 2027",
    comments: 8,
    assignee: "/images/user/user-10.jpg",
    status: "completed",
    category: { name: "Template", color: "success" },
    links: 2,
  },
  // Add more initial tasks here...
];

const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const moveTask = useCallback(
    (dragIndex: number, hoverIndex: number, status: string) => {
      setTasks((prevTasks) => {
        const statusTasks = prevTasks.filter((task) => task.status === status);
        const otherTasks = prevTasks.filter((task) => task.status !== status);

        const draggedTask = statusTasks[dragIndex];
        statusTasks.splice(dragIndex, 1);
        statusTasks.splice(hoverIndex, 0, draggedTask);

        return [...otherTasks, ...statusTasks];
      });
    },
    []
  );

  const changeTaskStatus = useCallback((taskId: string, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 border-t border-gray-200 divide-x divide-gray-200 dark:divide-white/[0.05] mt-7 dark:border-white/[0.05] sm:mt-0 sm:grid-cols-2 xl:grid-cols-3">
        <Column
          title="To Do"
          tasks={tasks.filter((task) => task.status === "todo")}
          status="todo"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
        <Column
          title="In Progress"
          tasks={tasks.filter((task) => task.status === "inProgress")}
          status="inProgress"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
        <Column
          title="Completed"
          tasks={tasks.filter((task) => task.status === "completed")}
          status="completed"
          moveTask={moveTask}
          changeTaskStatus={changeTaskStatus}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoard;
