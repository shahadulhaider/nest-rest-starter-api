import { Controller, Get, Param } from '@nestjs/common';
import { UserResponse } from './user.ro';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getallUsers(): Promise<UserResponse[]> {
    return await this.usersService.getAllUsers();
  }

  @Get('/:id')
  async getUserById(@Param() id: string): Promise<UserResponse> {
    return await this.usersService.getUserById(id);
  }

  @Get('/user/:user')
  async getUser(@Param('user') user: string): Promise<UserResponse> {
    return await this.usersService.getUser(user);
  }
}
