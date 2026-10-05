import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // true cho port 465, false cho các port khác
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  /**
   * Gửi email mã xác minh OTP khi đăng ký hoặc gửi lại mã
   */
  async sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
    const mailOptions = {
      from: process.env.MAIL_FROM || `"BrewLite" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `[BrewLite] Mã xác minh tài khoản của bạn: ${otp}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #006241; margin: 0; font-size: 24px; font-weight: 800;">BrewLite Coffee</h1>
            <p style="color: #666666; font-size: 14px; margin-top: 4px;">Xác minh địa chỉ Email</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="color: #333333; font-size: 15px; line-height: 1.5;">Chào bạn,</p>
          <p style="color: #555555; font-size: 14px; line-height: 1.5;">
            Cảm ơn bạn đã đăng ký tài khoản tại <strong>BrewLite</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất xác minh email:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #f2f7f4; color: #006241; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 28px; border-radius: 12px; border: 1px dashed #006241;">
              ${otp}
            </span>
          </div>
          
          <p style="color: #777777; font-size: 13px; line-height: 1.5;">
            ⏰ Mã này có hiệu lực trong <strong>10 phút</strong>. Vì lý do bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.<br />
            &copy; ${new Date().getFullYear()} BrewLite. All rights reserved.
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email OTP đã được gửi thành công tới ${toEmail} | MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Lỗi gửi email tới ${toEmail}:`, error);
      // In ra terminal để vẫn debug được nếu gửi mail thất bại
      this.logger.warn(`[FALLBACK OTP LOG] Mã OTP cho ${toEmail} là: ${otp}`);
      return false;
    }
  }
}