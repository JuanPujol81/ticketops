import type { Prisma, TicketPriority, TicketStatus } from '@prisma/client';
import type { AuthUser } from '../../shared/http/auth.js';

export type Actor = AuthUser;
export type CreateTicketData = {
  title: string;
  subject: string;
  description?: string;
  priority: TicketPriority;
};
export type UpdateTicketData = {
  title?: string;
  subject?: string;
  description?: string | null;
  priority?: TicketPriority;
};
export type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder: Prisma.SortOrder;
};
