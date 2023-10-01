import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService], // Register UserService as a provider
  controllers: [UsersController], // Register UserController
})
export class UsersModule {}
