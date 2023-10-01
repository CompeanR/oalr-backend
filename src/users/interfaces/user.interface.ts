export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  hashedPassword: string;
  isActive?: boolean;
  joinedDate?: Date;
  bio?: string;
}
