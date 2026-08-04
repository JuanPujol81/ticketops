import { TicketPriority, TicketStatus } from '@prisma/client';
import { z } from 'zod';

export const ticketIdSchema = z.string().uuid();

export const createTicketSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000).optional(),
  priority: z.enum(TicketPriority).default('MEDIUM'),
});

export const updateTicketSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    subject: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    priority: z.enum(TicketPriority).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export const updateStatusSchema = z.object({ status: z.enum(TicketStatus) });
export const assignTicketSchema = z.object({ assigneeId: z.string().uuid().nullable() });

export const listTicketsQuerySchema = z.object({
  status: z.enum(TicketStatus).optional(),
  priority: z.enum(TicketPriority).optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
