import 'package:flutter/foundation.dart';

class ApiConstants {
  // Use localhost:5000 for Web and Desktop, or 10.0.2.2:5000 for Android Emulator
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    // Android emulator alias for host localhost
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  // Endpoints
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';
  static const String me = '/auth/me';
  static const String rewards = '/auth/rewards';

  static const String products = '/products';
  static const String featuredProducts = '/products/featured';

  static const String orders = '/orders';
  static const String myOrders = '/orders/my';

  static const String validateCoupon = '/coupons/validate';

  // Storage Keys
  static const String tokenKey = 'sh_flutter_token';
  static const String userKey = 'sh_flutter_user';
  static const String cartKey = 'sh_flutter_cart';
  static const String wishlistKey = 'sh_flutter_wishlist';
}
