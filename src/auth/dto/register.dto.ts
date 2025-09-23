import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'juan.perez@email.com',
    description: 'Email válido del usuario',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'MiPassword123!',
    description:
      'Contraseña mínimo 6 caracteres, debe contener al menos una mayúscula, una minúscula y un número',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(50, {
    message: 'La contraseña no puede tener más de 50 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(30, { message: 'El nombre no puede tener más de 30 caracteres' })
  firstName: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del usuario',
  })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(30, { message: 'El apellido no puede tener más de 30 caracteres' })
  lastName: string;
}
