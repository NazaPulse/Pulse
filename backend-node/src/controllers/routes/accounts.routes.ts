import { ApiResource, ApiRoute } from '../../common/decorators/api-endpoint.decorator';
import { AccountResponseDto } from '../../dto/accounts/account-response.dto';

/**
 * Rutas de Cuentas financieras (Issue #8). Reproduce `/api/accounts` y
 * `/api/accounts/{id}` de openapi.yaml. Todas las rutas requieren JWT
 * (`bearerAuth`) y filtran obligatoriamente por el usuario autenticado.
 */
export const AccountsRoutes = {
  controller: ApiResource('Accounts', 'api/accounts'),
  list: ApiRoute('get', undefined, {
    operationId: 'listAccounts',
    summary: 'Listar las cuentas financieras del usuario autenticado',
    returns: { status: 'ok', type: AccountResponseDto, isArray: true, description: 'Listado de cuentas del usuario.' },
  }),
  create: ApiRoute('post', undefined, {
    operationId: 'createAccount',
    summary: 'Crear una nueva cuenta financiera',
    returns: { status: 'created', type: AccountResponseDto, description: 'Cuenta creada correctamente.' },
    badRequest: true,
  }),
  findOne: ApiRoute('get', ':id', {
    operationId: 'getAccountById',
    summary: 'Obtener una cuenta financiera por id',
    returns: { status: 'ok', type: AccountResponseDto, description: 'Cuenta encontrada.' },
    notFound: true,
  }),
  update: ApiRoute('put', ':id', {
    operationId: 'updateAccount',
    summary: 'Actualizar una cuenta financiera existente',
    returns: { status: 'ok', type: AccountResponseDto, description: 'Cuenta actualizada correctamente.' },
    badRequest: true,
    notFound: true,
  }),
  remove: ApiRoute('delete', ':id', {
    operationId: 'deleteAccount',
    summary: 'Eliminar una cuenta financiera',
    returns: { status: 'noContent', description: 'Cuenta eliminada correctamente. No retorna contenido.' },
    notFound: true,
  }),
};
