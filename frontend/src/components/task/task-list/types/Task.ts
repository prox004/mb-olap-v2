export interface Task {
  id: string;
  title: string;
  isChecked: boolean;
  dueDate: string;
  commentCount: number;
  category?: string;
  userAvatar: string;
  status: string;
  toggleChecked: () => void;
}
