// DTO (Data Transfer Object): Khai báo cấu trúc dữ liệu Giỏ hàng mà Frontend gửi lên.
// class-validator sẽ tự động kiểm tra, nếu sai format → trả về HTTP 400 ngay tại cửa.

import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
    ArrayMinSize,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsUUID()           // Phải đúng định dạng UUID
    @IsNotEmpty()
    productId: string;

    @IsEnum(['S', 'M', 'L'], { message: 'size phải là S, M hoặc L' })
    size: 'S' | 'M' | 'L';

    @IsInt()            // Phải là số nguyên (không phải 1.5)
    @Min(1, { message: 'Số lượng phải ít nhất là 1' })
    qty: number;

    @IsOptional()       // Không bắt buộc
    @IsArray()
    @IsString({ each: true }) // Từng phần tử trong mảng phải là string
    toppings?: string[];

    @IsNumber()
    @Min(0)
    lineTotal: number;  // Frontend gửi lên để tham khảo, Backend tự tính lại
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Giỏ hàng không được rỗng' })
    @ValidateNested({ each: true }) // Validate từng phần tử bên trong mảng
    @Type(() => CreateOrderItemDto) // class-transformer cần biết kiểu để validate nested
    items: CreateOrderItemDto[];

    @IsOptional()
    @IsString()
    promoCode?: string;
}
