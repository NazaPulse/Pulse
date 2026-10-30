import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { findOwnedOrFail } from '../common/owned-records';
import { Category } from '../models/category.entity';
import { CategoryResponseDto } from '../dto/categories/category-response.dto';
import { CreateCategoryDto } from '../dto/categories/create-category.dto';
import { UpdateCategoryDto } from '../dto/categories/update-category.dto';

// `color`/`icon` son opcionales en CategoryCreateRequest pero requeridos y
// no-nulos en la respuesta `Category` (openapi.yaml): se aplican estos
// valores por defecto cuando el cliente no los envía.
const DEFAULT_COLOR = '#6B7280';
const DEFAULT_ICON = 'tag';

const toResponse = (row: Category) => CategoryResponseDto.fromEntity(row);
const oldestFirst = { createdAt: 'ASC' } as const;

function newCategory(userId: string, dto: CreateCategoryDto) {
  return {
    userId,
    name: dto.name,
    targetAmount: dto.target_amount,
    color: dto.color ?? DEFAULT_COLOR,
    icon: dto.icon ?? DEFAULT_ICON,
  };
}

/** Categorías/sobres presupuestarios del usuario (borrado físico). */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async findAllForUser(userId: string) {
    const rows = await this.categories.find({ where: { userId }, order: oldestFirst });
    return rows.map(toResponse);
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const entity = this.categories.create(newCategory(userId, dto));
    return toResponse(await this.categories.save(entity));
  }

  async findOneForUser(userId: string, id: string) {
    return toResponse(await findOwnedOrFail(this.categories, userId, id));
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await findOwnedOrFail(this.categories, userId, id);
    category.name = dto.name;
    category.targetAmount = dto.target_amount;
    category.color = dto.color;
    category.icon = dto.icon;
    return toResponse(await this.categories.save(category));
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await findOwnedOrFail(this.categories, userId, id);
    await this.categories.remove(category);
  }
}
