import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Product } from './product.entity';

@Entity()
@Index(['currency', 'amount'])
export class ProductPrice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 20 })
    currency: string;

    @Column({ type: 'decimal' })
    amount: number;

    @Index()
    @Column()
    productId: number;

    @ManyToOne(() => Product, (product) => product.prices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;
}
