import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../interfaces/user.interface';
import { APP_CONSTANTS } from '../constants/app.constants';

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(APP_CONSTANTS.ROLES_KEY, roles);
