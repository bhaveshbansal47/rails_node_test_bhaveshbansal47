import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './product.entity';
import { ProductPrice } from './product-price.entity';

export interface FindAllProductsOptions {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'expiration';
    sortOrder?: 'ASC' | 'DESC';
    currency: string;
    name?: string;
    minExpiration?: string;
    maxExpiration?: string;
    minPrice?: number;
    maxPrice?: number;
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async findAll(options: FindAllProductsOptions) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'name',
            sortOrder = 'ASC',
            currency,
            name,
            minExpiration,
            maxExpiration,
            minPrice,
            maxPrice,
        } = options;

        const query = this.productRepository.createQueryBuilder('product');

        query.leftJoinAndSelect(
            'product.prices',
            'price',
            'price.currency = :currency',
            { currency },
        );

        if (name) {
            query.andWhere('product.name ILIKE :name', { name: `%${name}%` });
        }

        if (minExpiration) {
            query.andWhere('DATE(product.expiration) >= :minExpiration', { minExpiration });
        }

        if (maxExpiration) {
            query.andWhere('DATE(product.expiration) <= :maxExpiration', { maxExpiration });
        }

        if (minPrice !== undefined) {
            query.andWhere('price.amount >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
            query.andWhere('price.amount <= :maxPrice', { maxPrice });
        }

        if (sortBy === 'price') {
            query.orderBy('price.amount', sortOrder);
        } else if (sortBy === 'expiration') {
            query.orderBy('product.expiration', sortOrder);
        } else {
            query.orderBy('product.name', sortOrder);
        }

        query.skip((page - 1) * limit);
        query.take(limit);

        const [items, total] = await query.getManyAndCount();

        const mappedItems = items.map(product => {
            const price = product.prices && product.prices.length > 0 ? product.prices[0] : null;
            const { prices, ...productWithoutPrices } = product;
            return {
                ...productWithoutPrices,
                price: price?.amount
            };
        });

        return {
            items: mappedItems,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
