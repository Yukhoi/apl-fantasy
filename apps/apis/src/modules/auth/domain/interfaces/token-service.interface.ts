export const TOKEN_SERVICE = 'TOKEN_SERVICE'

export type JwtPayload = {
  sub: string
  email: string
  username: string
}

export interface TokenService {
  signAccessToken(payload: JwtPayload): Promise<string>
}
