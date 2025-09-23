import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../shared/interfaces/user.interface';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      APP_CONSTANTS.ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Si no se especifican roles, permite acceso
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de estos roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
