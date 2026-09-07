import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/responsive.dart';
import '../../providers/wishlist_provider.dart';
import '../../widgets/product_card.dart';

class WishlistScreen extends StatelessWidget {
  final ValueChanged<int>? onNavigate;

  const WishlistScreen({super.key, this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final wishlistProvider = context.watch<WishlistProvider>();
    final isDesktop = Responsive.isDesktop(context);
    final columns = Responsive.getGridColumnCount(context);

    if (wishlistProvider.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.favorite_border, size: 56, color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),
              const Text('Your Wishlist is Empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
              const SizedBox(height: 6),
              const Text('Save items you love to revisit or purchase later.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  if (onNavigate != null) onNavigate!(1); // Catalog
                },
                child: const Text('Discover Products'),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(
        horizontal: isDesktop ? 24 : 16,
        vertical: 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'My Wishlist (${wishlistProvider.itemCount} items)',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
              TextButton(
                onPressed: () => wishlistProvider.clearWishlist(),
                child: const Text('Clear Wishlist', style: TextStyle(color: AppColors.error, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 16),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              childAspectRatio: isDesktop ? 0.72 : 0.65,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: wishlistProvider.items.length,
            itemBuilder: (ctx, idx) {
              return ProductCard(product: wishlistProvider.items[idx]);
            },
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}
