import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MeliService } from './meli.service';

@Controller('meli')
export class MeliController {
  constructor(private readonly meli: MeliService) {}

  @Get('oauth/start')
  start(@Res() res: Response) {
    const { url } = this.meli.startAuth();
    return res.redirect(url);
  }

  @Get('oauth/callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.meli.handleCallback({ code, state });
    const frontend = process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000';
    return res.redirect(`${frontend}/connected`);
  }
}
