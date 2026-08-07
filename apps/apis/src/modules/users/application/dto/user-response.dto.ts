export class UserResponseDto {
  userId!: string;
  email!: string;
  username!: string;
  registeredAt!: string;
  updatedAt!: string;
  isActive!: boolean;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
