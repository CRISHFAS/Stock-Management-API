import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import {
  User,
  UserRole,
  UserStatus,
} from '../shared/interfaces/user.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ValidationUtil } from '../shared/utils/validation.util';

@Injectable()
export class AuthService {
  private users: User[] = [
    {
      id: 'admin-001',
      email: 'admin@stockmanagement.com',
      password: bcrypt.hashSync('Admin123!', 10),
      firstName: 'Sistema',
      lastName: 'Administrador',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'user-demo-001',
      email: 'demo@stockmanagement.com',
      password: bcrypt.hashSync('Demo123!', 10),
      firstName: 'Usuario',
      lastName: 'Demo',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validaciones de negocio
    if (!ValidationUtil.isValidEmail(registerDto.email)) {
      throw new UnauthorizedException('Formato de email inválido');
    }

    // Verificar si el usuario ya existe
    const existingUser = this.users.find(
      (u) => u.email.toLowerCase() === registerDto.email.toLowerCase(),
    );

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Sanitizar datos
    const sanitizedFirstName = ValidationUtil.sanitizeString(
      registerDto.firstName,
    );
    const sanitizedLastName = ValidationUtil.sanitizeString(
      registerDto.lastName,
    );

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Crear nuevo usuario
    const newUser: User = {
      id: uuid(),
      email: registerDto.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Guardar usuario
    this.users.push(newUser);

    // Generar respuesta con token
    return this.generateAuthResponse(newUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Buscar usuario por email
    const user = this.users.find(
      (u) => u.email.toLowerCase() === loginDto.email.toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar estado del usuario
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Usuario inactivo. Contacta al administrador',
      );
    }

    // Actualizar último acceso
    user.updatedAt = new Date();

    return this.generateAuthResponse(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    return user || null;
  }

  getAllUsers(): User[] {
    return this.users.map((user) => {
      const { ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  getUsersCount(): number {
    return this.users.length;
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    // Payload del JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generar token
    const token = this.jwtService.sign(payload);

    // Calcular expiración
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '1d');
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1); // +1 día por defecto

    // Preparar datos del usuario sin contraseña
    const { ...userWithoutPassword } = user;

    return {
      token,
      user: {
        ...userWithoutPassword,
        hasMLConnection: !!user.mlToken && user.mlToken.isActive,
      },
      expiresAt: expirationDate.toISOString(),
    };
  }
}
