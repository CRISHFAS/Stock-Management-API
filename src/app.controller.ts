import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { Response } from 'express';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Redirige al Swagger
  @Get()
  redirectToDocs(@Res() res: Response) {
    return res.redirect('/api/docs');
  }

  @Get('health')
  @ApiOperation({
    summary: 'Detailed Health Check',
    description: 'Información detallada del estado de la aplicación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado detallado de la aplicación',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Stock Management API funcionando!',
        },
        timestamp: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'production' },
        uptime: { type: 'string', example: '00:05:30' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealthStatus();
  }
}
