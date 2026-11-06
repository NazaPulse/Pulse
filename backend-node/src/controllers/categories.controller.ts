import { Body, Param } from '@nestjs/common';
import { UserId } from '../common/decorators/current-user.decorator';
import { CreateCategoryDto } from '../dto/categories/create-category.dto';
import { UpdateCategoryDto } from '../dto/categories/update-category.dto';
import { CategoriesService } from '../services/categories.service';
import { CategoriesRoutes } from './routes/categories.routes';

/** Categorías/sobres del usuario autenticado (rutas documentadas en {@link CategoriesRoutes}). */
@CategoriesRoutes.controller
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @CategoriesRoutes.list
  list(@UserId() userId: string) {
    return this.categories.findAllForUser(userId);
  }

  @CategoriesRoutes.create
  create(@UserId() userId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(userId, dto);
  }

  @CategoriesRoutes.findOne
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.categories.findOneForUser(userId, id);
  }

  @CategoriesRoutes.update
  update(@UserId() userId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(userId, id, dto);
  }

  @CategoriesRoutes.remove
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.categories.remove(userId, id);
  }
}
