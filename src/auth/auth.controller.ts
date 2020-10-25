import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User as UserEntity } from '../users/user.entity';
import { AuthResponse } from './auth.ro';
import { AuthService } from './auth.service';
import { LoginUserDto } from './login-user.dto';
import { RegisterUserDto } from './register-user.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { User } from './user-decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() data: RegisterUserDto): Promise<AuthResponse> {
    return await this.authService.register(data);
  }

  @Post('/login')
  async login(@Body() data: LoginUserDto): Promise<AuthResponse> {
    return await this.authService.login(data);
  }

  @Get('/me')
  @UseGuards(AuthGuard())
  async findCureentUser(
    @User() { username }: UserEntity,
  ): Promise<AuthResponse> {
    return await this.authService.whoami(username);
  }

  @Patch('/verify')
  @UseGuards(AuthGuard())
  async verifyEmail(
    @Query('token') token: string,
    @User() { username }: UserEntity,
  ): Promise<boolean> {
    return this.authService.verifyEmail(token, username);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<boolean> {
    return this.authService.forgotPassword(email);
  }

  @Patch('/reset-password')
  @UseGuards(AuthGuard())
  async resetPassword(
    @Query('token') token: string,
    @Body() { password }: ResetPasswordDto,
    @User() { username }: UserEntity,
  ): Promise<boolean> {
    return this.authService.resetPassword(token, password, username);
  }
}
