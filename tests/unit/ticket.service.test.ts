import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/modules/tickets/ticket.repository.js', () => ({
  createTicket: vi.fn(),
  findTicketById: vi.fn(),
  listTickets: vi.fn(),
  updateTicket: vi.fn(),
  updateStatus: vi.fn(),
  assignTicket: vi.fn(),
  deleteTicket: vi.fn(),
  findAssignableUser: vi.fn(),
}));

import * as repository from '../../src/modules/tickets/ticket.repository.js';
import * as service from '../../src/modules/tickets/ticket.service.js';

const customer = { id: 'customer-id', role: 'CUSTOMER' as const };
const agent = { id: 'agent-id', role: 'AGENT' as const };

describe('ticket service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires a description for urgent tickets', async () => {
    await expect(
      service.createTicket({ title: 'Outage', subject: 'API', priority: 'URGENT' }, customer),
    ).rejects.toMatchObject({ statusCode: 400, code: 'URGENT_DESCRIPTION_REQUIRED' });
    expect(repository.createTicket).not.toHaveBeenCalled();
  });

  it('hides tickets belonging to another customer', async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({
      id: 'ticket-id',
      requesterId: 'someone-else',
      status: 'NEW',
    } as never);

    await expect(service.getTicket('ticket-id', customer)).rejects.toMatchObject({
      statusCode: 404,
      code: 'TICKET_NOT_FOUND',
    });
  });

  it('allows an agent to follow a valid status transition', async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({
      id: 'ticket-id',
      requesterId: 'customer-id',
      status: 'NEW',
    } as never);
    vi.mocked(repository.updateStatus).mockResolvedValue({
      id: 'ticket-id',
      status: 'IN_PROGRESS',
    } as never);

    await expect(service.changeStatus('ticket-id', 'IN_PROGRESS', agent)).resolves.toMatchObject({
      status: 'IN_PROGRESS',
    });
  });

  it('rejects an invalid status transition', async () => {
    vi.mocked(repository.findTicketById).mockResolvedValue({
      id: 'ticket-id',
      requesterId: 'customer-id',
      status: 'NEW',
    } as never);

    await expect(
      service.changeStatus('ticket-id', 'RESOLVED', agent),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'INVALID_STATUS_TRANSITION',
    });
  });

  it('scopes customer listings to their own tickets', async () => {
    vi.mocked(repository.listTickets).mockResolvedValue({ items: [], total: 0 });
    await service.listTickets(
      { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
      customer,
    );
    expect(repository.listTickets).toHaveBeenCalledWith(
      { requesterId: customer.id },
      expect.any(Object),
    );
  });
});
