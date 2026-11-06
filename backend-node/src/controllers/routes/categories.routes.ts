import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { CategoryResponseDto } from '../../dto/categories/category-response.dto';

/**
 * Rutas de Categorías/Sobres presupuestarios (Issue #8). Reproduce
 * `/api/categories` y `/api/categories/{id}` de openapi.yaml. Todas las
 * rutas requieren JWT (`bearerAuth`) y filtran obligatoriamente por el
 * usuario autenticado.
 */
export const CategoriesRoutes = {
  controller: ApiResource('Categories', 'api/categories'),
  list: ApiRoute('get', undefined, {
    operationId: 'listCategories',
    summary: 'Listar las categorías/sobres del usuario autenticado',
    returns: {
      status: 'ok',
      type: CategoryResponseDto,
      isArray: true,
      description: 'Listado de categorías/sobres del usuario.',
    },
  }),
  create: ApiRoute('post', undefined, {
    operationId: 'createCategory',
    summary: 'Crear una nueva categoría/sobre',
    returns: { status: 'created', type: CategoryResponseDto, description: 'Categoría/sobre creado correctamente.' },
    badRequest: true,
  }),
  findOne: ApiRoute('get', ':id', {
    operationId: 'getCategoryById',
    summary: 'Obtener una categoría/sobre por id',
    returns: { status: 'ok', type: CategoryResponseDto, description: 'Categoría/sobre encontrado.' },
    notFound: true,
  }),
  update: ApiRoute('put', ':id', {
    operationId: 'updateCategory',
    summary: 'Actualizar una categoría/sobre existente',
    returns: { status: 'ok', type: CategoryResponseDto, description: 'Categoría/sobre actualizado correctamente.' },
    badRequest: true,
    notFound: true,
  }),
  remove: ApiRoute('delete', ':id', {
    operationId: 'deleteCategory',
    summary: 'Eliminar una categoría/sobre',
    returns: { status: 'noContent', description: 'Categoría/sobre eliminado correctamente. No retorna contenido.' },
    notFound: true,
  }),
};
