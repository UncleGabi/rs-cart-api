import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Entity({ name: 'cart_items' })
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'int', nullable: false })
  product_id: number;

  @Column({ type: 'int', nullable: false })
  count: number;
}
