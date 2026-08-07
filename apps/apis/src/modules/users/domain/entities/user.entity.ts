export class UserEntity {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly registeredAt: Date,
    public readonly updatedAt: Date,
    public readonly isActive: boolean,
  ) {}
}
