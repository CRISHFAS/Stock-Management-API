import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import type { User } from '../shared/interfaces/user.interface';
import { UserRole } from '../shared/interfaces/user.interface';
import { ResponseUtil } from '../shared/utils/response.util';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo producto',
    description:
      'Crear un nuevo producto en el inventario del usuario autenticado',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Producto creado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o SKU duplicado',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT inválido',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
  ) {
    const product = await this.productsService.create(
      createProductDto,
      user.id,
    );
    return ResponseUtil.success(
      { ...product, isLowStock: product.stock <= product.minStock },
      'Producto creado exitosamente',
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar productos',
    description:
      'Obtener lista paginada de productos del usuario con filtros opcionales',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items por página (máx: 50)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar en nombre o SKU',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    description: 'Solo productos con stock bajo',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo para ordenar',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Dirección del ordenamiento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de productos obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '15 productos encontrados' },
        data: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductResponseDto' },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 15 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 2 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  async findAll(@Query() query: ProductsQueryDto, @CurrentUser() user: User) {
    const result = await this.productsService.findAll(query, user.id);

    // Agregar computed property isLowStock
    const productsWithLowStock = result.products.map((product) => ({
      ...product,
      isLowStock: product.stock <= product.minStock,
    }));

    return ResponseUtil.success(
      {
        products: productsWithLowStock,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      },
      `${result.total} productos encontrados`,
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Estadísticas de productos',
    description: 'Obtener estadísticas generales de los productos del usuario',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 25 },
            active: { type: 'number', example: 20 },
            inactive: { type: 'number', example: 3 },
            discontinued: { type: 'number', example: 2 },
            lowStock: { type: 'number', example: 5 },
            totalInventoryValue: { type: 'number', example: 15750.5 },
          },
        },
      },
    },
  })
  async getStats(@CurrentUser() user: User) {
    const stats = await this.productsService.getUserProductsStats(user.id);
    return ResponseUtil.success(stats, 'Estadísticas obtenidas exitosamente');
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'Productos con stock bajo',
    description:
      'Obtener productos que tienen stock menor o igual al mínimo configurado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Productos con stock bajo obtenidos exitosamente',
  })
  async getLowStockProducts(@CurrentUser() user: User) {
    const products = await this.productsService.getLowStockProducts(user.id);
    const productsWithLowStock = products.map((product) => ({
      ...product,
      isLowStock: true,
    }));

    return ResponseUtil.success(
      productsWithLowStock,
      `${products.length} productos con stock bajo`,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Obtener detalles de un producto específico del usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto (UUID)',
    example: 'uuid-1234-5678-9abc-def0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Producto encontrado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes acceso a este producto',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const product = await this.productsService.findOne(id, user.id);
    return ResponseUtil.success(
      { ...product, isLowStock: product.stock <= product.minStock },
      'Producto encontrado exitosamente',
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar producto',
    description: 'Actualizar información de un producto existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Producto actualizado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes acceso a este producto',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      user.id,
    );
    return ResponseUtil.success(
      { ...product, isLowStock: product.stock <= product.minStock },
      'Producto actualizado exitosamente',
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar producto',
    description: 'Eliminar un producto del inventario (acción irreversible)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto (UUID)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Producto eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes acceso a este producto',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.productsService.remove(id, user.id);
    return ResponseUtil.success(null, 'Producto eliminado exitosamente');
  }

  // Endpoints para administradores
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Ver todos los productos (Solo Admin)',
    description:
      'Obtener lista de productos de todos los usuarios. Requiere rol de administrador.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todos los productos obtenidos exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  async findAllForAdmin(@Query() query: ProductsQueryDto): Promise<any> {
    const allProducts = await this.productsService.findAllAdmin(query);
    return ResponseUtil.success(allProducts, 'Todos los productos obtenidos');
  }
}
