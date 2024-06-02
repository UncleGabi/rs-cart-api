import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../entity/cart.entity';
import { CartItem } from '../../entity/cartItem.entity';
// import { v4 } from 'uuid';

@Injectable()
export class CartService {
  @InjectRepository(Cart)
  private readonly cartRepository: Repository<Cart>;
  @InjectRepository(CartItem)
  private readonly cartItemRepository: Repository<CartItem>;

  async findByUserId(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user_id: userId },
    });

    return cart;
  }

  async createByUserId(userId: string) {
    const userCart = await this.cartRepository.create({
      user_id: userId,
      items: [],
    });
    return this.cartRepository.save(userCart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    // Find the cart for the given user
    const cart = await this.cartRepository.findOne({
      where: { user_id: userId },
    });

    if (!cart) {
      throw new Error(`Cart not found for user id ${userId}`);
    }

    // Remove existing cart items
    await this.cartItemRepository.delete({ cart: { id: cart.id } });

    // Add new cart items
    cart.cartItems = items.map((item) => {
      const cartItem = new CartItem();
      cartItem.product_id = item.product_id;
      cartItem.count = item.count;
      cartItem.cart = cart;
      return cartItem;
    });

    // Save the updated cart
    await this.cartRepository.save(cart);

    return cart;
  }

  async removeByUserId(userId: string): Promise<void> {
    await this.cartRepository.delete({ user_id: userId });
  }
}
