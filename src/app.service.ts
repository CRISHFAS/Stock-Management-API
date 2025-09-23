import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello() {
    const startTime = process.hrtime();
    const uptimeSeconds = process.uptime();
    const uptime = this.formatUptime(uptimeSeconds);

    return {
      message: 'Stock Management API funcionando!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV') === 'development',
      uptime,
      responseTime: `${process.hrtime(startTime)[1] / 1000000}ms`,
    };
  }

  getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(uptimeSeconds),
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      environment: this.configService.get('NODE_ENV') === 'development',
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      features: {
        jwt: 'enabled',
        swagger: 'enabled',
        mercadolibre: 'pending',
        database: 'memory',
      },
    };
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
