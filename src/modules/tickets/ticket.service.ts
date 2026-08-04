import type { Prisma, TicketStatus } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import * as repository from './ticket.repository.js';
import type { Actor, CreateTicketData, TicketFilters, UpdateTicketData } from './ticket.types.js';

const transitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'NEW'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['NEW'],
};

const canAccess = (ticket: { requesterId: string }, actor: Actor) =>
  actor.role !== 'CUSTOMER' || ticket.requesterId === actor.id;

const requireTicket = async (id: string, actor: Actor) => {
  const ticket = await repository.findTicketById(id);
  if (!ticket || !canAccess(ticket, actor))
    throw new HttpError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  return ticket;
};

export const createTicket = async (data: CreateTicketData, actor: Actor) => {
  if (data.priority === 'URGENT' && !data.description) {
    throw new HttpError(400, 'Urgent tickets require a description', 'URGENT_DESCRIPTION_REQUIRED');
  }
  return repository.createTicket(data, actor.id);
};

export const listTickets = async (filters: TicketFilters, actor: Actor) => {
  const where: Prisma.TicketWhereInput = {
    ...(actor.role === 'CUSTOMER' ? { requesterId: actor.id } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.search
      ? {
          OR: ['title', 'subject', 'description'].map((field) => ({
            [field]: { contains: filters.search, mode: 'insensitive' },
          })),
        }
      : {}),
  };
  const { items, total } = await repository.listTickets(where, filters);
  return {
    items,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit),
    },
  };
};

export const getTicket = (id: string, actor: Actor) => requireTicket(id, actor);

export const updateTicket = async (id: string, data: UpdateTicketData, actor: Actor) => {
  const ticket = await requireTicket(id, actor);
  if (ticket.status === 'CLOSED')
    throw new HttpError(409, 'Closed tickets cannot be edited', 'TICKET_CLOSED');
  if (actor.role === 'CUSTOMER' && data.priority) {
    throw new HttpError(403, 'Customers cannot change priority', 'FORBIDDEN');
  }
  return repository.updateTicket(id, data, actor.id);
};

export const changeStatus = async (id: string, status: TicketStatus, actor: Actor) => {
  const ticket = await requireTicket(id, actor);
  if (actor.role === 'CUSTOMER' && status !== 'CLOSED') {
    throw new HttpError(403, 'Customers can only close tickets', 'FORBIDDEN');
  }
  if (ticket.status === status || !transitions[ticket.status].includes(status)) {
    throw new HttpError(
      409,
      `Cannot transition ticket from ${ticket.status} to ${status}`,
      'INVALID_STATUS_TRANSITION',
    );
  }
  return repository.updateStatus(id, status, actor.id);
};

export const assignTicket = async (id: string, assigneeId: string | null, actor: Actor) => {
  await requireTicket(id, actor);
  if (assigneeId && !(await repository.findAssignableUser(assigneeId))) {
    throw new HttpError(400, 'Assignee must be an agent or administrator', 'INVALID_ASSIGNEE');
  }
  return repository.assignTicket(id, assigneeId, actor.id);
};

export const deleteTicket = async (id: string, actor: Actor) => {
  await requireTicket(id, actor);
  await repository.deleteTicket(id);
};
