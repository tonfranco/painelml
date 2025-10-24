import { Controller, Get, Query, Res, Req } from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { MeliService } from './meli.service';
import { SyncService } from '../sync/sync.service';

@Controller('meli')
export class MeliController {
  constructor(
    private readonly meli: MeliService,
    private readonly sync: SyncService,
  ) {}

  @Get('oauth/start')
  start(@Res() res: Response) {
    const { url, state } = this.meli.startAuth();
    const isSecure = true; // using HTTPS tunnel
    res.cookie('meli_oauth_state', state, {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      maxAge: 5 * 60 * 1000,
      path: '/',
    });
    return res.redirect(url);
  }

  @Get('oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const cookieState = (req.signedCookies as any)?.['meli_oauth_state'];
    const result = await this.meli.handleCallback({ code, state }, cookieState);
    res.clearCookie('meli_oauth_state');
    
    // Iniciar sincronização automática em background
    setImmediate(() => {
      this.sync.start(result.accountId, 'all', 30);
    });
    
    const frontend = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000';
    // Passar accountId (UUID) para o frontend
    return res.redirect(`${frontend}/auth/callback?accountId=${result.accountId}`);
  }
}
