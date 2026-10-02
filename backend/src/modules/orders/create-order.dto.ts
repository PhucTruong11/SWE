import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductSize } from '@prisma/client';

export class CreateOrderItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsEnum(ProductSize) size: ProductSize;
  @IsArray() @IsString({ each: true }) toppings: string[];
  @IsInt() @Min(1) qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
  @IsOptional() @IsString() promoCode?: string;
}
