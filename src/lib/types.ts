export type StatusCategory = "backlog" | "active" | "review" | "done" | "cancelled";

export type RequestStatus = {
  id: string;
  name: string;
  category: StatusCategory;
  position: number;
  color: string;
  wip_limit: number | null;
  is_active: boolean;
};
