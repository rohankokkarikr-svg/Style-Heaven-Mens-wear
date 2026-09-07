import 'package:flutter/material.dart';
import '../../models/cart_item_model.dart';
import '../../models/product_model.dart';
import '../core/services/api_service.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  String? _appliedCouponCode;
  int _discountPercent = 0;

  List<CartItem> get items => List.unmodifiable(_items);
  int get itemCount => _items.fold(0, (sum, it) => sum + it.quantity);
  String? get appliedCouponCode => _appliedCouponCode;
  int get discountPercent => _discountPercent;

  double get subtotal => _items.fold(0.0, (sum, it) => sum + it.totalPrice);
  double get discountAmount => (subtotal * _discountPercent) / 100;
  double get shippingFee => (subtotal > 1999 || _items.isEmpty) ? 0.0 : 150.0;
  double get taxAmount => ((subtotal - discountAmount) * 0.05).clamp(0, double.infinity);
  double get grandTotal => (subtotal - discountAmount + shippingFee + taxAmount).clamp(0, double.infinity);

  void addToCart(Product product, {String size = 'M', String color = 'Navy', int qty = 1}) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id && item.selectedSize == size && item.selectedColor == color,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += qty;
    } else {
      _items.add(
        CartItem(
          id: '${product.id}_${size}_$color',
          product: product,
          selectedSize: size,
          selectedColor: color,
          quantity: qty,
        ),
      );
    }
    notifyListeners();
  }

  void updateQuantity(String cartItemId, int newQty) {
    final index = _items.indexWhere((it) => it.id == cartItemId);
    if (index >= 0) {
      if (newQty <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = newQty;
      }
      notifyListeners();
    }
  }

  void removeFromCart(String cartItemId) {
    _items.removeWhere((it) => it.id == cartItemId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _appliedCouponCode = null;
    _discountPercent = 0;
    notifyListeners();
  }

  Future<Map<String, dynamic>> applyCoupon(String code) async {
    final res = await ApiService().validateCoupon(code);
    if (res['valid'] == true) {
      _appliedCouponCode = res['code'];
      _discountPercent = res['discountPercent'];
      notifyListeners();
      return {'success': true, 'message': 'Coupon $code applied: $_discountPercent% OFF'};
    } else {
      return {'success': false, 'message': res['message'] ?? 'Invalid coupon'};
    }
  }

  void removeCoupon() {
    _appliedCouponCode = null;
    _discountPercent = 0;
    notifyListeners();
  }
}
