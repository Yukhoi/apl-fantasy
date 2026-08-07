import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PasswordHasher } from "../../domain/interfaces/password-hasher.interface";

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
