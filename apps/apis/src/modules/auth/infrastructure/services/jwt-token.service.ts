import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  TokenService,
  JwtPayload,
} from "../../domain/interfaces/token-service.interface";

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
