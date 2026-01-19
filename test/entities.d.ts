import 'reflect-metadata';
export declare class User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  password?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  suspendedAt?: Date;
  subscriptionTier?: string;
  createdAt?: Date;
  posts?: Post[];
}
export declare class Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  author?: User;
  authorId?: string;
  comments?: Comment[];
}
export declare class Comment {
  id: string;
  text: string;
  post?: Post;
  postId?: string;
  author?: User;
}
