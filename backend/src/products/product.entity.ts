import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Upload } from '../uploads/upload.entity';
import { ProductPrice } from './product-price.entity';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    name: string;

    @OneToMany(() => ProductPrice, (productPrice) => productPrice.product, { cascade: true })
    prices: ProductPrice[];

    @Index()
    @Column({ type: 'date', nullable: true })
    expiration: Date;

    @Index()
    @Column({ nullable: true })
    uploadId: string;

    @ManyToOne(() => Upload, (upload) => upload.products)
    @JoinColumn({ name: 'uploadId' })
    upload: Upload;
}
