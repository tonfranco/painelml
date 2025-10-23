import { Controller, Get, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async list() {
    const accounts = await this.accountsService.listAccounts();
    return { items: accounts };
  }

  @Get(':sellerId/status')
  async status(@Param('sellerId') sellerId: string) {
    const tokens = await this.accountsService.getTokensForSeller(sellerId);
    const expiringSoon = await this.accountsService.isTokenExpiringSoon(sellerId);
    
    return {
      hasTokens: !!tokens,
      expiringSoon,
      tokenType: tokens?.tokenType,
      scope: tokens?.scope,
    };
  }
}
