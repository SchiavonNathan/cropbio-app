import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { username, password } = body;
    const user = await this.authService.validateUser(username, password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    
    return this.authService.login(user);
  }
}
