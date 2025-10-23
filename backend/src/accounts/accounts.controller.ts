import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const accounts = await this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, sellerId: true, nickname: true, siteId: true, createdAt: true, updatedAt: true },
    });
    return { items: accounts };
  }

  @Get(':id/tokens')
  async tokens(@Param('id') id: string) {
    const tokens = await this.prisma.accountToken.findMany({
      where: { accountId: id },
      orderBy: { obtainedAt: 'desc' },
      select: { id: true, tokenType: true, scope: true, expiresIn: true, obtainedAt: true },
      take: 5,
    });
    return { items: tokens };
  }
}
