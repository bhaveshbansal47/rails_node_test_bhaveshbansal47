import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductPrice } from './product-price.entity';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
    imports: [TypeOrmModule.forFeature([Product, ProductPrice])],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [TypeOrmModule],
})
export class ProductsModule { }
