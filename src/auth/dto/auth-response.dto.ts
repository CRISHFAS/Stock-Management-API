import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../shared/interfaces/user.interface';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token para autenticación',
  })
  token: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid-1234-5678' },
      email: { type: 'string', example: 'juan.perez@email.com' },
      firstName: { type: 'string', example: 'Juan' },
      lastName: { type: 'string', example: 'Pérez' },
      role: { type: 'string', example: 'user', enum: Object.values(UserRole) },
      status: {
        type: 'string',
        example: 'active',
        enum: Object.values(UserStatus),
      },
      hasMLConnection: { type: 'boolean', example: false },
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    hasMLConnection: boolean;
  };

  @ApiProperty({
    example: '2024-01-01T12:00:00Z',
    description: 'Fecha de expiración del token',
  })
  expiresAt: string;
}
