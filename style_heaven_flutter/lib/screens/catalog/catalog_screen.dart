import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/responsive.dart';
import '../../providers/product_provider.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/product_card.dart';

class CatalogScreen extends StatelessWidget {
  const CatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final productProvider = context.watch<ProductProvider>();
    final isDesktop = Responsive.isDesktop(context);
    final columns = Responsive.getGridColumnCount(context);

    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(
        horizontal: isDesktop ? 24 : 16,
        vertical: 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & Sort Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Men\'s Apparel & Handicrafts',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                    Text(
                      'Showing ${productProvider.products.length} refined items',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),

              // Sort Dropdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: productProvider.sortBy,
                    icon: const Icon(Icons.sort, size: 18, color: AppColors.primary),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary),
                    onChanged: (val) {
                      if (val != null) productProvider.setSortBy(val);
                    },
                    items: const [
                      DropdownMenuItem(value: 'featured', child: Text('Featured')),
                      DropdownMenuItem(value: 'price_asc', child: Text('Price: Low to High')),
                      DropdownMenuItem(value: 'price_desc', child: Text('Price: High to Low')),
                      DropdownMenuItem(value: 'rating', child: Text('Top Rated')),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Search Field
          TextField(
            onChanged: (val) => productProvider.setSearchQuery(val),
            decoration: InputDecoration(
              hintText: 'Search by keyword (e.g. Kurta, Suit, Linen, Chino)...',
              prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
              suffixIcon: productProvider.searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () => productProvider.setSearchQuery(''),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 14),

          // Categories Filter Row
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: productProvider.categories.length,
              separatorBuilder: (_, index) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                final cat = productProvider.categories[idx];
                return CategoryChip(
                  category: cat,
                  isSelected: productProvider.selectedCategory == cat.id,
                  onSelected: () => productProvider.selectCategory(cat.id),
                );
              },
            ),
          ),
          const SizedBox(height: 20),

          // Product Grid or Empty State
          if (productProvider.isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(50),
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            )
          else if (productProvider.products.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    const Icon(Icons.inventory_2_outlined, size: 60, color: AppColors.textMuted),
                    const SizedBox(height: 12),
                    const Text(
                      'No products matched your search',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Try adjusting your search query or category filters.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () {
                        productProvider.selectCategory('all');
                        productProvider.setSearchQuery('');
                      },
                      child: const Text('Reset All Filters'),
                    ),
                  ],
                ),
              ),
            )
          else
            GridView.builder(
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

          const SizedBox(height: 30),
        ],
      ),
    );
  }
}
