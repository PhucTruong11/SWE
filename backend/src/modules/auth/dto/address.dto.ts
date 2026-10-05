import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  recipientName: string;

  @IsNotEmpty({ message: 'Số điện thoại nhận hàng không được để trống' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  @IsString()
  detailAddress: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}