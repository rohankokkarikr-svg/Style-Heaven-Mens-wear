import 'cart_item_model.dart';

class Order {
  final String id;
  final List<CartItem> items;
  final double totalAmount;
  final String status; // Pending, Processing, Shipped, Delivered, Cancelled
  final String paymentMethod;
  final String shippingAddress;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.items,
    required this.totalAmount,
    this.status = 'Processing',
    required this.paymentMethod,
    required this.shippingAddress,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Order.fromJson(Map<String, dynamic> json) {
    List<CartItem> parsedItems = [];
    if (json['items'] is List) {
      parsedItems = (json['items'] as List).map((it) {
        if (it is Map<String, dynamic>) {
          return CartItem.fromJson(it);
        }
        return null;
      }).whereType<CartItem>().toList();
    }

    return Order(
      id: (json['_id'] ?? json['id'] ?? 'ORD-${DateTime.now().millisecondsSinceEpoch}').toString(),
      items: parsedItems,
      totalAmount: (json['totalAmount'] ?? json['total_amount'] ?? 0.0).toDouble(),
      status: (json['status'] ?? 'Processing').toString(),
      paymentMethod: (json['paymentMethod'] ?? json['payment_method'] ?? 'UPI / Card').toString(),
      shippingAddress: (json['shippingAddress'] is Map
              ? json['shippingAddress']['address'] ?? ''
              : json['shippingAddress'] ?? '')
          .toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
