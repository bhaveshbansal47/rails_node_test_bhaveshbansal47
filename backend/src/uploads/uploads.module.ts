import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Upload } from './upload.entity';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { BullModule } from '@nestjs/bull';
import { UploadsProcessor } from './uploads.processor';
import { Product } from '../products/product.entity';
import { ProductPrice } from '../products/product-price.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Upload, Product, ProductPrice]),
        ConfigModule,
        BullModule.registerQueue({
            name: 'uploads',
        }),
    ],
    providers: [
        UploadsService,
        ...(process.env.APP_MODE === 'api' ? [] : [UploadsProcessor]),
    ],
    controllers: [UploadsController],
    exports: [TypeOrmModule],
})
export class UploadsModule { }
