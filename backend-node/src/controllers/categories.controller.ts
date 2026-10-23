import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiEndpoint, ApiProtected } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard';
import { CategoryResponseDto } from '../dto/categories/category-response.dto';
import { CreateCategoryDto } from '../dto/categories/create-category.dto';
import { UpdateCategoryDto } from '../dto/categories/update-category.dto';
import { CategoriesService } from '../services/categories.service';

/**
 * Rutas de Categorías/Sobres presupuestarios (Issue #8). Reproduce
 * `/api/categories` y `/api/categories/{id}` de openapi.yaml. Todas las
 * rutas requieren JWT (`bearerAuth`) y filtran obligatoriamente por el
 * usuario autenticado.
 */
@ApiProtected('Categories')
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiEndpoint({
    operationId: 'listCategories',
    summary: 'Listar las categorías/sobres del usuario autenticado',
    returns: {
      status: 'ok',
      type: CategoryResponseDto,
      isArray: true,
      description: 'Listado de categorías/sobres del usuario.',
    },
  })
  list(@CurrentUser() user: AuthenticatedUser): Promise<CategoryResponseDto[]> {
    return this.categories.findAllForUser(user.id);
  }

  @Post()
  @ApiEndpoint({
    operationId: 'createCategory',
    summary: 'Crear una nueva categoría/sobre',
    returns: { status: 'created', type: CategoryResponseDto, description: 'Categoría/sobre creado correctamente.' },
    badRequest: true,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categories.create(user.id, dto);
  }

  @Get(':id')
  @ApiEndpoint({
    operationId: 'getCategoryById',
    summary: 'Obtener una categoría/sobre por id',
    returns: { status: 'ok', type: CategoryResponseDto, description: 'Categoría/sobre encontrado.' },
    notFound: true,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categories.findOneForUser(user.id, id);
  }

  @Put(':id')
  @ApiEndpoint({
    operationId: 'updateCategory',
    summary: 'Actualizar una categoría/sobre existente',
    returns: { status: 'ok', type: CategoryResponseDto, description: 'Categoría/sobre actualizado correctamente.' },
    badRequest: true,
    notFound: true,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categories.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiEndpoint({
    operationId: 'deleteCategory',
    summary: 'Eliminar una categoría/sobre',
    returns: { status: 'noContent', description: 'Categoría/sobre eliminado correctamente. No retorna contenido.' },
    notFound: true,
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.categories.remove(user.id, id);
  }
}
