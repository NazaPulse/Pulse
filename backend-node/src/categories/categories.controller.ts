import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Rutas de Categorías/Sobres presupuestarios (Issue #8). Reproduce
 * `/api/categories` y `/api/categories/{id}` de openapi.yaml. Todas las
 * rutas requieren JWT (`bearerAuth`) y filtran obligatoriamente por el
 * usuario autenticado.
 */
@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ operationId: 'listCategories', summary: 'Listar las categorías/sobres del usuario autenticado' })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true, description: 'Listado de categorías/sobres del usuario.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<CategoryResponseDto[]> {
    return this.categories.findAllForUser(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createCategory', summary: 'Crear una nueva categoría/sobre' })
  @ApiCreatedResponse({ type: CategoryResponseDto, description: 'Categoría/sobre creado correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categories.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getCategoryById', summary: 'Obtener una categoría/sobre por id' })
  @ApiOkResponse({ type: CategoryResponseDto, description: 'Categoría/sobre encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CategoryResponseDto> {
    return this.categories.findOneForUser(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ operationId: 'updateCategory', summary: 'Actualizar una categoría/sobre existente' })
  @ApiOkResponse({ type: CategoryResponseDto, description: 'Categoría/sobre actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Fallo de validación de campos del payload.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categories.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'deleteCategory', summary: 'Eliminar una categoría/sobre' })
  @ApiNoContentResponse({ description: 'Categoría/sobre eliminado correctamente. No retorna contenido.' })
  @ApiUnauthorizedResponse({ description: 'No se proporcionó un token válido o el token expiró.' })
  @ApiNotFoundResponse({ description: 'El recurso solicitado no existe o no pertenece al usuario autenticado.' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.categories.remove(user.id, id);
  }
}
