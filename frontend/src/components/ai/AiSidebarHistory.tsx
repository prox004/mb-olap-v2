import { useState, useEffect } from "react";

interface ChatItem {
  id: string;
  title: string;
}

interface AiSidebarHistoryProps {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function AiSidebarHistory({
  isSidebarOpen,
  onCloseSidebar,
}: AiSidebarHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const todayChats: ChatItem[] = [
    { id: "1", title: "Write a follow-up email to a client" },
    { id: "2", title: "Generate responsive login form layout" },
    { id: "3", title: "Create a warning state modal" },
    { id: "4", title: "Suggest color palette for dark theme" },
  ];

  const yesterdayChats: ChatItem[] = [
    { id: "5", title: "Improve login page accessibility" },
    { id: "6", title: "Create a warning state modal with animation" },
    { id: "7", title: "Add password visibility toggle" },
    { id: "8", title: "Write validation logic for login form..." },
    { id: "9", title: "Fix mobile responsiveness of login UI..." },
  ];

  const lastWeekChats: ChatItem[] = [
    { id: "10", title: "Improve login page accessi..." },
    { id: "11", title: "Improve login page accessi..." },
  ];

  const handleDropdownToggle = (itemId: string) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };

  const handleRename = (itemId: string) => {
    // Handle rename logic here
    console.log("Rename item:", itemId);
    handleDropdownClose();
  };

  const handleDelete = (itemId: string) => {
    // Handle delete logic here
    console.log("Delete item:", itemId);
    handleDropdownClose();
  };

  return (
    <div className="relative">
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[99999] bg-black/50 xl:hidden dark:bg-black/80 transition-opacity"
          onClick={onCloseSidebar}
        >
          <div className="absolute top-4 right-[300px]">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 transition hover:bg-gray-100 dark:bg-gray-800 dark:text-white/90 dark:hover:bg-white/3 hover:dark:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onCloseSidebar();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6.75104 17.249L17.249 6.75111M6.75104 6.75098L17.249 17.2489"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-[280px] flex-col  h-full border-l border-gray-200 bg-white p-6 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
          isSidebarOpen
            ? "flex fixed xl:static top-0 z-999999 right-0 h-screen bg-white dark:bg-gray-900"
            : "hidden xl:flex"
        }`}
      >
        {/* New Chat Button */}
        <button className="bg-brand-500 hover:bg-brand-600 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 10.0002H15.0006M10.0002 5V15.0006"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New Chat
        </button>

        {/* Search */}
        <div className="mt-5">
          <form>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
                <svg
                  className="fill-gray-500 dark:fill-gray-400"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z"
                    fill=""
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-3.5 pl-[42px] text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
          </form>
        </div>
        {/* Chat Items */}
        <div className="custom-scrollbar mt-6 h-full flex-1 space-y-3 overflow-y-auto text-sm">
          {/* Today Section */}
          <div>
            <p className="mb-3 pl-3 text-xs text-gray-400 uppercase">Today</p>
            <ul className="space-y-1">
              {todayChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isOpen={openDropdown === chat.id}
                  onToggleDropdown={() => handleDropdownToggle(chat.id)}
                  onRename={() => handleRename(chat.id)}
                  onDelete={() => handleDelete(chat.id)}
                />
              ))}
            </ul>
          </div>

          {/* Yesterday Section */}
          <div className="relative">
            <p className="mb-3 pl-3 text-xs text-gray-400 uppercase">
              Yesterday
            </p>
            <ul className="space-y-1">
              {yesterdayChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isOpen={openDropdown === chat.id}
                  onToggleDropdown={() => handleDropdownToggle(chat.id)}
                  onRename={() => handleRename(chat.id)}
                  onDelete={() => handleDelete(chat.id)}
                />
              ))}
            </ul>
            {!showMore && (
              <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-8 w-full bg-gradient-to-t from-white to-transparent dark:from-gray-900" />
            )}
          </div>

          {/* Show More Content */}
          {showMore && (
            <div className="pl-3">
              <div className="relative">
                <p className="mb-3 text-xs text-gray-400 uppercase">
                  Last Week
                </p>
                <ul className="space-y-1">
                  {lastWeekChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isOpen={openDropdown === chat.id}
                      onToggleDropdown={() => handleDropdownToggle(chat.id)}
                      onRename={() => handleRename(chat.id)}
                      onDelete={() => handleDelete(chat.id)}
                    />
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Show more toggle */}
          <div className="mt-4 pl-3">
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-primary-500 flex w-full items-center justify-between text-xs font-medium text-gray-400"
            >
              <span>{showMore ? "Show less..." : "Show more..."}</span>
              <svg
                className={`ml-2 transition-transform ${
                  showMore ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3.83331 6.41669L7.99998 10.5834L12.1666 6.41669"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Chat Item Component
interface ChatItemProps {
  chat: ChatItem;
  isOpen: boolean;
  onToggleDropdown: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ChatItem({
  chat,
  isOpen,
  onToggleDropdown,
  onRename,
  onDelete,
}: ChatItemProps) {
  return (
    <li className="group relative rounded-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-950">
      <div className="flex cursor-pointer items-center justify-between">
        <a
          href="#"
          className="block truncate text-sm text-gray-700 dark:text-gray-400"
        >
          {chat.title}
        </a>

        {/* 3-dot menu button */}
        <button
          onClick={onToggleDropdown}
          className="invisible ml-2 rounded-full p-1 text-gray-700 group-hover:visible hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M4.5 9.00384L4.5 8.99634M13.5 9.00384V8.99634M9 9.00384V8.99634"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <ul className="text-sm text-gray-700 dark:text-gray-400">
            <li>
              <button
                onClick={onRename}
                className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white/90"
              >
                Rename
              </button>
            </li>
            <li>
              <button
                onClick={onDelete}
                className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white/90"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      )}
    </li>
  );
}
