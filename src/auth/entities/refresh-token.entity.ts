import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../modules/user/entities/user.entity';

@Entity()
class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    token: string;

    @Column()
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ default: false })
    isRevoked: boolean;
}

export { RefreshToken };