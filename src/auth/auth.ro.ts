import { UserResponse } from 'src/users/user.ro';

export class AuthResponse {
  token: string;
  user: UserResponse;
}
