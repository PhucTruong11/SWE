import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: Sprint 2 - Task 7
  // POST /auth/register
  // POST /auth/login
  // POST /auth/logout
}
