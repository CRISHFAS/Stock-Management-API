// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { Public } from '../shared/decorators/public.decorator';
import type { User } from '../shared/interfaces/user.interface';
import { UserRole } from '../shared/interfaces/user.interface';
import { ResponseUtil } from '../shared/utils/response.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crear una nueva cuenta de usuario en el sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email ya registrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ResponseUtil.success(result, 'Usuario registrado exitosamente');
  }

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autenticar usuario y obtener token JWT',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ResponseUtil.success(result, 'Login exitoso');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Información del usuario autenticado actual',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil del usuario',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Perfil obtenido exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
            hasMLConnection: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido o expirado',
  })
  getProfile(@CurrentUser() user: User) {
    const { ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      hasMLConnection: !!user.mlToken && user.mlToken.isActive,
    };
    return ResponseUtil.success(userData, 'Perfil obtenido exitosamente');
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar todos los usuarios (Solo Admin)',
    description:
      'Obtener lista de todos los usuarios registrados. Requiere rol de administrador.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuarios obtenida exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  getAllUsers() {
    const users = this.authService.getAllUsers();
    const count = this.authService.getUsersCount();

    return ResponseUtil.success(
      { users, count },
      `${count} usuarios encontrados`,
    );
  }
}
