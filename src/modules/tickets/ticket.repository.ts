import type { Prisma, TicketEventType, TicketStatus } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import type { CreateTicketData, TicketFilters, UpdateTicketData } from './ticket.types.js';

const include = {
  requester: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TicketInclude;

export const createTicket = (data: CreateTicketData, requesterId: string) =>
  prisma.$transaction(async (transaction) => {
    const ticket = await transaction.ticket.create({ data: { ...data, requesterId }, include });
    await transaction.ticketEvent.create({
      data: { type: 'CREATED', ticketId: ticket.id, actorId: requesterId },
    });
    return ticket;
  });

export const findTicketById = (id: string) =>
  prisma.ticket.findUnique({
    where: { id },
    include: {
      ...include,
      events: {
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

export const listTickets = async (where: Prisma.TicketWhereInput, filters: TicketFilters) => {
  const [items, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include,
      orderBy: { [filters.sortBy]: filters.sortOrder },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, total };
};

const updateWithEvent = (
  id: string,
  data: Prisma.TicketUpdateInput,
  actorId: string,
  type: TicketEventType,
  metadata?: Prisma.InputJsonValue,
) =>
  prisma.$transaction(async (transaction) => {
    const ticket = await transaction.ticket.update({ where: { id }, data, include });
    await transaction.ticketEvent.create({ data: { type, ticketId: id, actorId, metadata } });
    return ticket;
  });

export const updateTicket = (id: string, data: UpdateTicketData, actorId: string) =>
  updateWithEvent(id, data, actorId, 'UPDATED', data as Prisma.InputJsonValue);

export const updateStatus = (id: string, status: TicketStatus, actorId: string) =>
  updateWithEvent(id, { status }, actorId, 'STATUS_CHANGED', { status });

export const assignTicket = (id: string, assigneeId: string | null, actorId: string) =>
  updateWithEvent(
    id,
    { assignee: assigneeId ? { connect: { id: assigneeId } } : { disconnect: true } },
    actorId,
    'ASSIGNED',
    { assigneeId },
  );

export const deleteTicket = (id: string) => prisma.ticket.delete({ where: { id } });

export const findAssignableUser = (id: string) =>
  prisma.user.findFirst({ where: { id, role: { in: ['AGENT', 'ADMIN'] } }, select: { id: true } });
