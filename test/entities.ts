import 'reflect-metadata';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  name: string;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  password?: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'datetime', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  suspendedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  subscriptionTier?: string;

  @Column({ type: 'datetime', nullable: true })
  createdAt?: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts?: Post[];
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @ManyToOne(() => User, (user) => user.posts)
  author?: User;

  @Column({ type: 'varchar', nullable: true })
  authorId?: string;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments?: Comment[];
}

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @ManyToOne(() => Post, (post) => post.comments)
  post?: Post;

  @Column({ type: 'varchar', nullable: true })
  postId?: string;

  @ManyToOne(() => User)
  author?: User;
}
