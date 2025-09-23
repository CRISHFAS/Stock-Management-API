import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica que la API esté funcionando correctamente',
  })
  @ApiResponse({
    status: 200,
    description: 'API funcionando correctamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Stock Management API funcionando!',
        },
        timestamp: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
        uptime: { type: 'string', example: '00:05:30' },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Detailed Health Check',
    description: 'Información detallada del estado de la aplicación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado detallado de la aplicación',
  })
  getHealth() {
    return this.appService.getHealthStatus();
  }
}
