import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { UserRepository } from "../../domain/repositories/user.repository";
import { UserEntity } from "../../domain/entities/user.entity";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserEntity | null> {
    const u = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!u) return null;

    return new UserEntity(
      u.userId,
      u.email,
      u.username,
      u.passwordHash,
      u.registeredAt,
      u.updatedAt,
      u.isActive,
    );
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const u = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!u) return null;

    return new UserEntity(
      u.userId,
      u.email,
      u.username,
      u.passwordHash,
      u.registeredAt,
      u.updatedAt,
      u.isActive,
    );
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const u = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!u) return null;

    return new UserEntity(
      u.userId,
      u.email,
      u.username,
      u.passwordHash,
      u.registeredAt,
      u.updatedAt,
      u.isActive,
    );
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const u = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });

    return new UserEntity(
      u.userId,
      u.email,
      u.username,
      u.passwordHash,
      u.registeredAt,
      u.updatedAt,
      u.isActive,
    );
  }
}
