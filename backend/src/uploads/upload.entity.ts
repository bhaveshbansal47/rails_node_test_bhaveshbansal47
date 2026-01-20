import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Product } from '../products/product.entity';

export enum UploadStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity()
export class Upload {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({
        type: 'enum',
        enum: UploadStatus,
        default: UploadStatus.PENDING,
    })
    status: UploadStatus;

    @Column({ type: 'int', default: 0 })
    total_rows: number;

    @Column({ type: 'int', default: 0 })
    processed_rows: number;

    @Column({ nullable: true })
    failed_reason: string;

    @Column()
    s3_key: string;

    @Column({ type: 'jsonb', nullable: true })
    exchange_rates_snapshot: any;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Product, (product) => product.upload)
    products: Product[];
}
