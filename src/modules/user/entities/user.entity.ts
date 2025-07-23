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
    email: string;

    @Column({ type: 'text', nullable: true })
    hashedPassword: string | null;

    @Column({ default: false, nullable: true })
    isOauth: boolean;

    @Column({ default: true, nullable: true })
    isActive: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
    joinedDate: Date;

    @Column({ type: 'text', nullable: true })
    bio: string | null;
}

export { User };
