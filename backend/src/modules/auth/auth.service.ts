import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CreateAddressDto } from './dto/address.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  // Các trường trả về cho trang "Tài khoản của tôi"
  private readonly profileSelect = {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    loyaltyPoints: true,
    createdAt: true,
    addresses: {
      orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'desc' as const }],
    },
  };

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    const otp = this.generateOtp();
    const codeHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    if (this.emailService && typeof (this.emailService as any).sendOtpEmail === 'function') {
      await (this.emailService as any).sendOtpEmail(user.email, otp);
    }

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác minh.',
      email: user.email,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { emailVerification: true },
    });

    if (!user) {
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Tài khoản này đã được xác minh trước đó' };
    }

    const verification = user.emailVerification;
    if (!verification) {
      throw new BadRequestException('Không tìm thấy yêu cầu xác minh');
    }

    if (verification.attempts >= 5) {
      throw new BadRequestException('Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
    }

    const inputHash = this.hashOtp(dto.code);
    if (inputHash !== verification.codeHash) {
      await this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Mã OTP không chính xác');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerification.delete({
        where: { id: verification.id },
      }),
    ]);

    return { message: 'Xác minh email thành công! Bạn có thể đăng nhập ngay bây giờ.' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { emailVerification: true },
    });

    const genericResponse = {
      message: 'Nếu email tồn tại và chưa xác minh, mã OTP mới đã được gửi.',
    };

    if (!user || user.emailVerifiedAt) {
      return genericResponse;
    }

    const existingVerification = user.emailVerification;

    if (existingVerification) {
      const timeDiff = (Date.now() - existingVerification.lastSentAt.getTime()) / 1000;
      if (timeDiff < 60) {
        throw new BadRequestException(`Vui lòng chờ ${Math.ceil(60 - timeDiff)} giây trước khi gửi lại.`);
      }
    }

    const otp = this.generateOtp();
    const codeHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
      update: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
    });

    if (this.emailService && typeof (this.emailService as any).sendOtpEmail === 'function') {
      await (this.emailService as any).sendOtpEmail(user.email, otp);
    }

    return genericResponse;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Tài khoản chưa được xác minh email. Vui lòng xác minh OTP trước khi đăng nhập.',
        email: user.email,
      });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  // ==========================================
  // Hồ sơ cá nhân & sổ địa chỉ
  // ==========================================

  async getUserProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.profileSelect,
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      },
      select: this.profileSelect,
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = dto.isDefault === true || count === 0;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          recipientName: String(dto.recipientName || '').trim(),
          phone: String(dto.phone || '').trim(),
          detailAddress: String(dto.detailAddress || '').trim(),
          ward: dto.ward ? String(dto.ward).trim() : null,
          district: dto.district ? String(dto.district).trim() : null,
          city: dto.city ? String(dto.city).trim() : null,
          isDefault,
        },
      });
    });
  }

  private async findOwnedAddress(userId: string, addressId: string) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');
    return address;
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.findOwnedAddress(userId, addressId);

    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { message: 'Đã đặt làm địa chỉ mặc định' };
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.findOwnedAddress(userId, addressId);

    await this.prisma.address.delete({ where: { id: addressId } });

    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Đã xóa địa chỉ thành công' };
  }
}