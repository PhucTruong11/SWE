import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CreateAddressDto } from './dto/address.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Lấy id user an toàn từ payload JWT (tránh undefined gây lỗi 500 Prisma)
  private uid(user: any): string {
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }
    const id = user.id ?? user.userId ?? user.sub;
    if (!id) {
      throw new UnauthorizedException('Không xác định được mã người dùng');
    }
    return id;
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  // Lấy thông tin user hiện tại (kèm họ tên, SĐT, danh sách địa chỉ)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return this.authService.getUserProfile(this.uid(user));
  }

  // Cập nhật họ tên & số điện thoại
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(this.uid(user), dto);
  }

  // Thêm địa chỉ giao hàng mới
  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  addAddress(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.authService.addAddress(this.uid(user), dto);
  }

  // Đặt địa chỉ làm mặc định
  @Patch('addresses/:id/default')
  @UseGuards(JwtAuthGuard)
  setDefaultAddress(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.authService.setDefaultAddress(this.uid(user), id);
  }

  // Xóa địa chỉ
  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  deleteAddress(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.authService.deleteAddress(this.uid(user), id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Đăng xuất thành công' };
  }
}