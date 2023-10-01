import { Injectable, NotFoundException } from '@nestjs/common';
import * as pgPromise from 'pg-promise';
import SQL from 'sql-template-strings';
import { User } from './interfaces/user.interface';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

const pgp = pgPromise();

@Injectable()
export class UsersService {
  private readonly db: pgPromise.IDatabase<any>;

  constructor() {
    this.db = pgp('postgres://username:password@host:port/database'); // Replace with your connection string
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.any(SQL`SELECT * FROM users`);
  }

  async getUser(userId: number): Promise<User> {
    const user = await this.db.oneOrNone(
      SQL`SELECT * FROM users WHERE id = ${userId}`,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(userInput: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(userInput.password, 10);
    const query = SQL`
      INSERT INTO users (name, username, email, hashed_password, is_active, joined_date, bio)
      VALUES (${userInput.name}, ${userInput.username}, ${userInput.email}, ${hashedPassword}, ${userInput.isActive}, ${userInput.joinedDate}, ${userInput.bio})
      RETURNING id, name, username, email, is_active, joined_date, bio
    `;
    return await this.db.one(query);
  }

  async updateUser(userId: number, userUpdate: UpdateUserDto): Promise<User> {
    const existingUser = await this.getUser(userId);
    const updatedUser = { ...existingUser, ...userUpdate };
    const query = SQL`
      UPDATE users 
      SET name = ${updatedUser.name}, email = ${updatedUser.email} 
      WHERE id = ${userId}
      RETURNING *
    `;
    return await this.db.one(query);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.db.none(SQL`DELETE FROM users WHERE id = ${userId}`);
  }
}
