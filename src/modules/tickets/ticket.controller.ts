import type { Request, Response } from 'express';
import {
  assignTicketSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdSchema,
  updateStatusSchema,
  updateTicketSchema,
} from './ticket.schema.js';
import * as service from './ticket.service.js';

export const create = async (request: Request, response: Response) => {
  const ticket = await service.createTicket(createTicketSchema.parse(request.body), request.user!);
  response.status(201).json({ data: ticket });
};

export const list = async (request: Request, response: Response) => {
  const result = await service.listTickets(
    listTicketsQuerySchema.parse(request.query),
    request.user!,
  );
  response.json({ data: result.items, meta: result.meta });
};

export const getById = async (request: Request, response: Response) => {
  response.json({
    data: await service.getTicket(ticketIdSchema.parse(request.params.id), request.user!),
  });
};

export const update = async (request: Request, response: Response) => {
  response.json({
    data: await service.updateTicket(
      ticketIdSchema.parse(request.params.id),
      updateTicketSchema.parse(request.body),
      request.user!,
    ),
  });
};

export const changeStatus = async (request: Request, response: Response) => {
  const { status } = updateStatusSchema.parse(request.body);
  response.json({
    data: await service.changeStatus(
      ticketIdSchema.parse(request.params.id),
      status,
      request.user!,
    ),
  });
};

export const assign = async (request: Request, response: Response) => {
  const { assigneeId } = assignTicketSchema.parse(request.body);
  response.json({
    data: await service.assignTicket(
      ticketIdSchema.parse(request.params.id),
      assigneeId,
      request.user!,
    ),
  });
};

export const remove = async (request: Request, response: Response) => {
  await service.deleteTicket(ticketIdSchema.parse(request.params.id), request.user!);
  response.status(204).send();
};
