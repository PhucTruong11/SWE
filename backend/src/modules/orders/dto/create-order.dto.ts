// DTO (Data Transfer Object): Khai báo cấu trúc dữ liệu Giỏ hàng mà Frontend gửi lên.

import {
    IsString,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsArray,
    Min,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsString()
    productId: string;  // ID sản phẩm

    @IsIn(['S', 'M', 'L'])
    size: 'S' | 'M' | 'L';  // Size

    @IsInt()
    @Min(1)
    qty: number;        // Số lượng ly

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    toppings?: string[]; // Tên các topping (snapshot tại thời điểm đặt)

    @IsNumber()
    @Min(0)
    lineTotal: number;  // Thành tiền dòng này (VND) - Backend sẽ kiểm tra lại
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];  // Danh sách các món trong giỏ

    @IsOptional()
    @IsString()
    promoCode?: string;           // Mã giảm giá (nếu có)
}
