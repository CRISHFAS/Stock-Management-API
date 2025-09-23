import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'juan.perez@email.com',
    description: 'Email del usuario registrado',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'MiPassword123!',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
