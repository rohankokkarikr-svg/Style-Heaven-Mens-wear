import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/responsive.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late String _selectedImage;
  late String _selectedSize;
  late String _selectedColor;
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    _selectedImage = widget.product.imageUrl;
    _selectedSize = widget.product.sizes.isNotEmpty ? widget.product.sizes.first : 'M';
    _selectedColor = widget.product.colors.isNotEmpty ? widget.product.colors.first : 'Navy';
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = Responsive.isDesktop(context);
    final wishlistProvider = context.watch<WishlistProvider>();
    final isWishlisted = wishlistProvider.isInWishlist(widget.product.id);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: Icon(
              isWishlisted ? Icons.favorite : Icons.favorite_border,
              color: isWishlisted ? AppColors.error : AppColors.primary,
            ),
            onPressed: () {
              wishlistProvider.toggleWishlist(widget.product);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isDesktop ? 32 : 16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: isDesktop ? _buildDesktopLayout() : _buildMobileLayout(),
          ),
        ),
      ),
      bottomNavigationBar: isDesktop ? null : _buildMobileBottomBar(),
    );
  }

  Widget _buildDesktopLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Left Column: Images
        Expanded(
          flex: 5,
          child: _buildImageSection(),
        ),
        const SizedBox(width: 40),

        // Right Column: Details & Order
        Expanded(
          flex: 6,
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProductInfo(),
                const Divider(height: 32, color: AppColors.divider),
                _buildSelectors(),
                const SizedBox(height: 24),
                _buildActionButtons(),
                const Divider(height: 32, color: AppColors.divider),
                _buildArtisanAndDetails(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildImageSection(),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildProductInfo(),
              const Divider(height: 28, color: AppColors.divider),
              _buildSelectors(),
              const SizedBox(height: 20),
              _buildArtisanAndDetails(),
            ],
          ),
        ),
        const SizedBox(height: 80), // Padding for mobile bottom bar
      ],
    );
  }

  Widget _buildImageSection() {
    return Column(
      children: [
        // Main Active Image
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Container(
            height: 420,
            width: double.infinity,
            color: const Color(0xFFF1F5F9),
            child: Image.network(
              _selectedImage,
              fit: BoxFit.cover,
              errorBuilder: (ctx, err, stack) => const Center(
                child: Icon(Icons.image_not_supported_outlined, size: 60, color: AppColors.textMuted),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Thumbnails
        if (widget.product.images.length > 1)
          SizedBox(
            height: 70,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: widget.product.images.length,
              separatorBuilder: (_, index) => const SizedBox(width: 10),
              itemBuilder: (ctx, idx) {
                final img = widget.product.images[idx];
                final isCurrent = img == _selectedImage;
                return InkWell(
                  onTap: () => setState(() => _selectedImage = img),
                  child: Container(
                    width: 70,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isCurrent ? AppColors.accent : AppColors.border,
                        width: isCurrent ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(7),
                      child: Image.network(img, fit: BoxFit.cover),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildProductInfo() {
    final p = widget.product;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category and Stock Badge
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                p.category.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.accentDark,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: p.isInStock ? AppColors.success.withValues(alpha: 0.12) : AppColors.error.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Icon(
                    p.isInStock ? Icons.check_circle : Icons.cancel,
                    size: 12,
                    color: p.isInStock ? AppColors.success : AppColors.error,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    p.isInStock ? 'In Stock (${p.stockQuantity} Left)' : 'Out of Stock',
                    style: TextStyle(
                      color: p.isInStock ? AppColors.success : AppColors.error,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Product Title
        Text(
          p.name,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary, height: 1.2),
        ),
        const SizedBox(height: 8),

        // Rating & Reviews
        Row(
          children: [
            const Icon(Icons.star, size: 16, color: AppColors.warning),
            const SizedBox(width: 4),
            Text('${p.rating}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(width: 6),
            Text('(${p.reviewCount} customer reviews)', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 14),

        // Price Section
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              Formatters.formatCurrency(p.price),
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.primary),
            ),
            if (p.originalPrice > p.price) ...[
              const SizedBox(width: 10),
              Text(
                Formatters.formatCurrency(p.originalPrice),
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textMuted,
                  decoration: TextDecoration.lineThrough,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${p.discountPercentage}% OFF',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 10),
        const Text('Inclusive of all taxes. Free express shipping.', style: TextStyle(fontSize: 12, color: AppColors.success)),
      ],
    );
  }

  Widget _buildSelectors() {
    final p = widget.product;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Size Selector
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Select Size: $_selectedSize', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const Text('Size Guide', style: TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: p.sizes.map((sz) {
            final isSelected = _selectedSize == sz;
            return ChoiceChip(
              label: Text(sz),
              selected: isSelected,
              onSelected: (val) => setState(() => _selectedSize = sz),
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        // Color Selector
        Text('Select Shade: $_selectedColor', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: p.colors.map((col) {
            final isSelected = _selectedColor == col;
            return ChoiceChip(
              label: Text(col),
              selected: isSelected,
              onSelected: (val) => setState(() => _selectedColor = col),
              selectedColor: AppColors.accent,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        // Quantity Selector
        Row(
          children: [
            const Text('Quantity:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(width: 16),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  IconButton(
                    iconSize: 16,
                    padding: const EdgeInsets.all(6),
                    constraints: const BoxConstraints(),
                    icon: const Icon(Icons.remove),
                    onPressed: () {
                      if (_quantity > 1) setState(() => _quantity--);
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('$_quantity', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  IconButton(
                    iconSize: 16,
                    padding: const EdgeInsets.all(6),
                    constraints: const BoxConstraints(),
                    icon: const Icon(Icons.add),
                    onPressed: () {
                      if (_quantity < p.stockQuantity) setState(() => _quantity++);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            icon: const Icon(Icons.shopping_bag_outlined),
            label: const Text('Add to Cart', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: _handleAddToCart,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            icon: const Icon(Icons.bolt),
            label: const Text('Buy Now', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () {
              _handleAddToCart();
              Navigator.pop(context);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildArtisanAndDetails() {
    final p = widget.product;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Artisan Spotlight Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.accent,
                child: Icon(Icons.person, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.artisanName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary),
                    ),
                    Text(
                      'Master Artisan • ${p.artisanLocation}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.verified, size: 18, color: AppColors.accent),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Description
        const Text('Description', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary)),
        const SizedBox(height: 6),
        Text(
          p.description.isNotEmpty ? p.description : p.shortDescription,
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
        ),
        const SizedBox(height: 14),

        // Material specification
        Row(
          children: [
            const Text('Fabric Material: ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            Text(p.material, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      ],
    );
  }

  Widget _buildMobileBottomBar() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Total Price', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                Text(
                  Formatters.formatCurrency(widget.product.price * _quantity),
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _handleAddToCart,
                child: const Text('Add to Bag', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleAddToCart() {
    context.read<CartProvider>().addToCart(
          widget.product,
          size: _selectedSize,
          color: _selectedColor,
          qty: _quantity,
        );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added $_quantity x "${widget.product.name}" ($_selectedSize / $_selectedColor) to cart'),
        duration: const Duration(milliseconds: 1800),
      ),
    );
  }
}
