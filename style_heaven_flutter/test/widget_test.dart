import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:style_heaven_flutter/main.dart';
import 'package:style_heaven_flutter/providers/auth_provider.dart';
import 'package:style_heaven_flutter/providers/product_provider.dart';
import 'package:style_heaven_flutter/providers/cart_provider.dart';
import 'package:style_heaven_flutter/providers/wishlist_provider.dart';
import 'package:style_heaven_flutter/providers/order_provider.dart';

void main() {
  testWidgets('StyleHeavenApp builds smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => ProductProvider()),
          ChangeNotifierProvider(create: (_) => CartProvider()),
          ChangeNotifierProvider(create: (_) => WishlistProvider()),
          ChangeNotifierProvider(create: (_) => OrderProvider()),
        ],
        child: const StyleHeavenApp(),
      ),
    );

    // Verify brand header appears
    expect(find.textContaining('STYLE HEAVEN'), findsWidgets);
  });
}
