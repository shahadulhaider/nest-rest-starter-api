import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { MailerService } from '@nestjs-modules/mailer';
import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/user.entity';
import { AuthPayload } from './auth.payload';
import { AuthResponse } from './auth.ro';
import { LoginUserDto } from './login-user.dto';
import { RegisterUserDto } from './register-user.dto';
import { ResetPasswordDto } from './reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRedis() private redis: Redis,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  private VERIFY_EMAIL_PREFIX = 'verify-email: ';
  private FORGOT_PASSWORD_PREFIX = 'forgot-password: ';

  async register(data: RegisterUserDto): Promise<AuthResponse> {
    try {
      const user = this.usersRepo.create(data);
      await user.save();

      // genrate jwt token
      const token = this.jwtService.sign({
        username: user.username,
      } as AuthPayload);

      // set redis token
      const uuid = uuidv4();
      const key = this.VERIFY_EMAIL_PREFIX + uuid;

      await this.redis.set(key, user.id, 'ex', 1000 * 60 * 60 * 24 * 3);

      // send verification email
      const url = `http://localhost:8000/api/auth/verify?token=${uuid}`;

      const info = await this.mailerService.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>',
        to: user.email,
        subject: `Welcome to Starter App! Please Verify Your Email Address`,
        template: 'confirmation',
        context: {
          user,
          url,
        },
      });

      console.log('Message sent: %s', info.messageId);

      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      return this.buildResponse(token, user);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Email or username already taken.');
      }
      throw err;
    }
  }

  async login(data: LoginUserDto): Promise<AuthResponse> {
    try {
      const { password, username, email } = data;
      const found = await this.usersRepo.findOne({
        where: [{ username: username }, { email: email }],
      });

      if (!found) {
        throw new NotFoundException('No user found with given credentials');
      }

      const match = await found.verifyPassword(password);

      if (!match) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({
        username: found.username,
      } as AuthPayload);

      return this.buildResponse(token, found);
    } catch (err) {
      throw err;
    }
  }

  async whoami(username: string): Promise<AuthResponse> {
    const me = await this.usersRepo.findOne({ username });

    const token = this.jwtService.sign({
      username: me.username,
    } as AuthPayload);

    return this.buildResponse(token, me);
  }

  async verifyEmail(token: string): Promise<boolean> {
    console.log(token);

    try {
      const key = this.VERIFY_EMAIL_PREFIX + token;
      const userId = await this.redis.get(key);

      const user = await this.usersRepo.findOne(userId);

      if (!user) {
        throw new UnauthorizedException();
      }

      user.verified = true;

      await user.save();

      // remove one time verification key
      await this.redis.del(key);

      return true;
    } catch (err) {
      throw err;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const user = await this.usersRepo.findOne({ email });

      if (!user) {
        return false;
      }

      // set redis token
      const token = uuidv4();
      const key = this.FORGOT_PASSWORD_PREFIX + token;

      await this.redis.set(key, user.id, 'ex', 1000 * 60 * 60 * 24 * 3);

      // send verification email
      const url = `http://localhost:8000/api/auth/reset-password?token=${token}`;

      const info = await this.mailerService.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>',
        to: email,
        subject: 'Reset password',
        template: 'reset-password',
        context: {
          user,
          url,
        },
      });

      console.log('Message sent: %s', info.messageId);

      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      return true;
    } catch (err) {
      throw err;
    }
  }

  async resetPassword(token: string, password: string): Promise<boolean> {
    try {
      const key = this.FORGOT_PASSWORD_PREFIX + token;
      const userId = await this.redis.get(key);

      if (!userId) {
        throw new HttpException('Token expired', 400);
      }

      const user = await this.usersRepo.findOne(userId);

      if (!user) {
        throw new UnauthorizedException();
      }

      console.log(password);

      user.password = await argon2.hash(password);

      await user.save();

      // remove one time verification key
      await this.redis.del(key);

      const info = await this.mailerService.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>',
        to: user.email,
        subject: 'Reset password success',
        template: 'reset-password-success',
        context: {
          user,
        },
      });

      console.log('Message sent: %s', info.messageId);

      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      return true;
    } catch (err) {
      throw err;
    }
  }

  private buildResponse(token: string, user: User): AuthResponse {
    return {
      token: `Bearer ${token}`,
      user: user.buildUserResponse(),
    };
  }
}
