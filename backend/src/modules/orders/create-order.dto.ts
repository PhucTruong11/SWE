import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ProductSize } from '@prisma/client';

export class CreateOrderItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsEnum(ProductSize) size: ProductSize;
  @IsArray() @IsString({ each: true }) toppings: string[];
  @IsInt() @Min(1) qty: number;
}

export class CreateOrderDto {
  @IsArray() @IsNotEmpty() items: CreateOrderItemDto[];
  @IsOptional() @IsString() promoCode?: string;
}
