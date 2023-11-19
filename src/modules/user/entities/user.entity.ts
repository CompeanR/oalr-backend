import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    userName: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'text', nullable: true })
    hashedPassword: string | null;

    @Column({ default: false })
    isOauth: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    joinedDate: Date;

    @Column({ nullable: true })
    bio: string;
}

export { User };
