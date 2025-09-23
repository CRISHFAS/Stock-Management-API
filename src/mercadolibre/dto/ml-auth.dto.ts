import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MLAuthCallbackDto {
  @ApiProperty({
    example: 'TG-507f1f77bcf86cd799439011',
    description: 'Código de autorización devuelto por MercadoLibre',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    example: 'random_state_string',
    description: 'Estado para validar la solicitud',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class MLAuthUrlDto {
  @ApiProperty({
    example:
      'https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=...',
    description: 'URL de autorización de MercadoLibre',
  })
  @IsUrl()
  authUrl: string;

  @ApiProperty({
    example: 'random_state_string',
    description: 'Estado único para validar el callback',
  })
  @IsString()
  state: string;
}
