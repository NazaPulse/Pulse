import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';

// `color`/`icon` son opcionales en CategoryCreateRequest pero requeridos y
// no-nulos en la respuesta `Category` (openapi.yaml): se aplican estos
// valores por defecto cuando el cliente no los envía.
const DEFAULT_COLOR = '#6B7280';
const DEFAULT_ICON = 'tag';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async findAllForUser(userId: string): Promise<CategoryResponseDto[]> {
    const rows = await this.categories.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => CategoryResponseDto.fromEntity(row));
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const entity = this.categories.create({
      userId,
      name: dto.name,
      targetAmount: dto.target_amount,
      color: dto.color ?? DEFAULT_COLOR,
      icon: dto.icon ?? DEFAULT_ICON,
    });
    const saved = await this.categories.save(entity);
    return CategoryResponseDto.fromEntity(saved);
  }

  async findOneForUser(userId: string, id: string): Promise<CategoryResponseDto> {
    const category = await this.findOwnedOrFail(userId, id);
    return CategoryResponseDto.fromEntity(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.findOwnedOrFail(userId, id);
    category.name = dto.name;
    category.targetAmount = dto.target_amount;
    category.color = dto.color;
    category.icon = dto.icon;
    const saved = await this.categories.save(category);
    return CategoryResponseDto.fromEntity(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.findOwnedOrFail(userId, id);
    await this.categories.remove(category);
  }

  /**
   * Aislamiento por usuario: cualquier operación por `id` filtra siempre por
   * `userId`. Un `id` de otro usuario (o inexistente, o con formato inválido)
   * responde `404` — nunca revela si el recurso existe para otro usuario.
   */
  private async findOwnedOrFail(userId: string, id: string): Promise<Category> {
    if (!isUUID(id)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const category = await this.categories.findOne({ where: { id, userId } });

    if (!category) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return category;
  }
}
