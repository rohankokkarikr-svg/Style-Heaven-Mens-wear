import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/responsive.dart';
import '../../providers/product_provider.dart';
import '../../widgets/hero_banner.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/product_card.dart';

class HomeScreen extends StatelessWidget {
  final ValueChanged<int> onNavigate;

  const HomeScreen({super.key, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final productProvider = context.watch<ProductProvider>();
    final isDesktop = Responsive.isDesktop(context);
    final columns = Responsive.getGridColumnCount(context);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Hero Promotional Banner
          HeroBanner(
            onExplore: () => onNavigate(1), // Catalog tab
          ),

          // 2. Category Selector Carousel
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isDesktop ? 24 : 16,
              vertical: 8,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Curated Collections',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                    TextButton(
                      onPressed: () => onNavigate(1),
                      child: const Text('View All', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 48,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: productProvider.categories.length,
                    separatorBuilder: (_, index) => const SizedBox(width: 8),
                    itemBuilder: (ctx, idx) {
                      final cat = productProvider.categories[idx];
                      return CategoryChip(
                        category: cat,
                        isSelected: productProvider.selectedCategory == cat.id,
                        onSelected: () {
                          productProvider.selectCategory(cat.id);
                          onNavigate(1); // Go to catalog
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 3. Featured & Trending Section
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isDesktop ? 24 : 16),
            child: Row(
              children: [
                const Icon(Icons.flash_on, color: AppColors.accent, size: 22),
                const SizedBox(width: 6),
                const Text(
                  'Trending Menswear',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
                const Spacer(),
                Text(
                  '${productProvider.products.length} Items Available',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Product Grid
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isDesktop ? 24 : 16),
            child: productProvider.isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  )
                : GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      childAspectRatio: isDesktop ? 0.72 : 0.65,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: productProvider.products.length,
                    itemBuilder: (ctx, idx) {
                      return ProductCard(product: productProvider.products[idx]);
                    },
                  ),
          ),

          const SizedBox(height: 40),

          // 4. Artisan & Craftsmanship Highlight
          Container(
            width: double.infinity,
            margin: EdgeInsets.symmetric(horizontal: isDesktop ? 24 : 16),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                const Icon(Icons.verified, color: AppColors.accent, size: 36),
                const SizedBox(height: 12),
                const Text(
                  'Direct From Master Artisans',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
                const SizedBox(height: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 600),
                  child: const Text(
                    'Every shirt, suit, and kurta is woven by master craftspersons using centuries-old techniques. We empower regional weaver collectives across India with fair trade prices and global appreciation.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
                  ),
                ),
                const SizedBox(height: 24),
                Wrap(
                  spacing: 24,
                  runSpacing: 16,
                  alignment: WrapAlignment.center,
                  children: [
                    _trustItem(Icons.nature_people, 'Organic Fabrics'),
                    _trustItem(Icons.local_shipping_outlined, 'Express Delivery'),
                    _trustItem(Icons.security, '100% Safe Payments'),
                    _trustItem(Icons.replay, '10-Day Easy Returns'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _trustItem(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppColors.accent),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textPrimary)),
      ],
    );
  }
}
