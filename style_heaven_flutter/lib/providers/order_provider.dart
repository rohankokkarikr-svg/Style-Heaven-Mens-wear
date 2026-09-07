import 'package:flutter/material.dart';
import '../../models/order_model.dart';
import '../../models/cart_item_model.dart';

class OrderProvider extends ChangeNotifier {
  final List<Order> _orders = [
    Order(
      id: 'SH-884920',
      items: [],
      totalAmount: 3299.0,
      status: 'Delivered',
      paymentMethod: 'UPI (Google Pay)',
      shippingAddress: '42 Heritage Enclave, Civil Lines, Jaipur 302006',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
    ),
  ];

  List<Order> get orders => List.unmodifiable(_orders);

  Order placeOrder({
    required List<CartItem> items,
    required double totalAmount,
    required String paymentMethod,
    required String shippingAddress,
  }) {
    final newOrder = Order(
      id: 'SH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      items: List.from(items),
      totalAmount: totalAmount,
      status: 'Confirmed',
      paymentMethod: paymentMethod,
      shippingAddress: shippingAddress,
      createdAt: DateTime.now(),
    );

    _orders.insert(0, newOrder);
    notifyListeners();
    return newOrder;
  }
}
