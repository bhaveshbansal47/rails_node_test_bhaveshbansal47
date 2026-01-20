import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('sort_by') sortBy: 'name' | 'price' | 'expiration' = 'name',
        @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'ASC',
        @Query('currency') currency: string,
        @Query('name') name?: string,
        @Query('min_expiration') minExpiration?: string,
        @Query('max_expiration') maxExpiration?: string,
        @Query('min_price') minPrice?: number,
        @Query('max_price') maxPrice?: number,
    ) {
        if (!currency) {
            throw new BadRequestException('Currency is required.');
        }

        return this.productsService.findAll({
            page: Number(page),
            limit: Number(limit),
            sortBy,
            sortOrder,
            currency,
            name,
            minExpiration,
            maxExpiration,
            minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
            maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
        });
    }
}
