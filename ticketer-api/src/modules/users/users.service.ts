import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(id: string, updateData: { name?: string; avatar_url?: string }): Promise<User> {
    const user = await this.findById(id);
    if (updateData.name !== undefined) user.name = updateData.name;
    if (updateData.avatar_url !== undefined) user.avatar_url = updateData.avatar_url;
    return this.usersRepository.save(user);
  }
}
