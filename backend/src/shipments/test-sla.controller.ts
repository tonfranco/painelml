import { Controller, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('test-sla')
export class TestSLAController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('populate')
  async populateTestData(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    // Buscar shipments pendentes
    const shipments = await this.prisma.shipment.findMany({
      where: {
        accountId,
        status: { in: ['pending', 'handling', 'ready_to_ship'] },
      },
      take: 5,
    });

    if (shipments.length === 0) {
      return { message: 'No pending shipments found' };
    }

    // Atualizar com dados de exemplo
    const updates = [];

    // Shipment 1: No prazo (2 dias)
    if (shipments[0]) {
      updates.push(
        this.prisma.shipment.update({
          where: { id: shipments[0].id },
          data: {
            slaStatus: 'on_time',
            slaService: 'standard',
            slaExpectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            handlingLimit: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            deliveryLimit: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            deliveryFinal: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }

    // Shipment 2: Urgente (6 horas)
    if (shipments[1]) {
      updates.push(
        this.prisma.shipment.update({
          where: { id: shipments[1].id },
          data: {
            slaStatus: 'on_time',
            slaService: 'xd_same_day',
            slaExpectedDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
            handlingLimit: new Date(Date.now() + 6 * 60 * 60 * 1000),
            deliveryLimit: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            deliveryFinal: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }

    // Shipment 3: Crítico (3 horas)
    if (shipments[2]) {
      updates.push(
        this.prisma.shipment.update({
          where: { id: shipments[2].id },
          data: {
            slaStatus: 'on_time',
            slaService: 'next_day',
            slaExpectedDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
            handlingLimit: new Date(Date.now() + 3 * 60 * 60 * 1000),
            deliveryLimit: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            deliveryFinal: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }

    // Shipment 4: Atrasado (-2 horas)
    if (shipments[3]) {
      updates.push(
        this.prisma.shipment.update({
          where: { id: shipments[3].id },
          data: {
            slaStatus: 'delayed',
            slaService: 'standard',
            slaExpectedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            handlingLimit: new Date(Date.now() - 2 * 60 * 60 * 1000),
            deliveryLimit: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            deliveryFinal: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }

    // Shipment 5: Urgente (20 horas)
    if (shipments[4]) {
      updates.push(
        this.prisma.shipment.update({
          where: { id: shipments[4].id },
          data: {
            slaStatus: 'on_time',
            slaService: 'standard',
            slaExpectedDate: new Date(Date.now() + 20 * 60 * 60 * 1000),
            handlingLimit: new Date(Date.now() + 20 * 60 * 60 * 1000),
            deliveryLimit: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            deliveryFinal: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }

    await Promise.all(updates);

    return {
      message: 'Test SLA data populated successfully',
      updatedCount: updates.length,
    };
  }
}
