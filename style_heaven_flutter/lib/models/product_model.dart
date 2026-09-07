class Product {
  final String id;
  final String name;
  final String description;
  final String shortDescription;
  final double price;
  final double originalPrice;
  final double rating;
  final int reviewCount;
  final String category;
  final String imageUrl;
  final List<String> images;
  final List<String> sizes;
  final List<String> colors;
  final bool isInStock;
  final int stockQuantity;
  final String artisanName;
  final String artisanLocation;
  final String material;
  final List<String> tags;

  Product({
    required this.id,
    required this.name,
    required this.description,
    this.shortDescription = '',
    required this.price,
    this.originalPrice = 0.0,
    this.rating = 4.5,
    this.reviewCount = 10,
    required this.category,
    required this.imageUrl,
    this.images = const [],
    this.sizes = const ['S', 'M', 'L', 'XL', 'XXL'],
    this.colors = const ['Navy', 'Charcoal', 'White', 'Black'],
    this.isInStock = true,
    this.stockQuantity = 20,
    this.artisanName = 'Style Heaven Craftsmen',
    this.artisanLocation = 'Jaipur, India',
    this.material = '100% Premium Cotton',
    this.tags = const [],
  });

  int get discountPercentage {
    if (originalPrice > price && originalPrice > 0) {
      return (((originalPrice - price) / originalPrice) * 100).round();
    }
    return 0;
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    // Determine image list
    List<String> parsedImages = [];
    if (json['images'] is List) {
      parsedImages = (json['images'] as List)
          .map<String>((img) => (img is Map ? (img['url'] ?? '') : img).toString())
          .where((img) => img.isNotEmpty)
          .toList();
    } else if (json['imageUrl'] != null) {
      parsedImages = [json['imageUrl'].toString()];
    } else if (json['image_url'] != null) {
      parsedImages = [json['image_url'].toString()];
    }

    final mainImage = parsedImages.isNotEmpty
        ? parsedImages.first
        : (json['image'] ??
            json['imageUrl'] ??
            json['image_url'] ??
            'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop')
            .toString();

    // Determine sizes
    List<String> parsedSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    if (json['sizes'] is List) {
      parsedSizes = (json['sizes'] as List).map((s) => s.toString()).toList();
    }

    return Product(
      id: (json['_id'] ?? json['id'] ?? UniqueKey().toString()).toString(),
      name: (json['name'] ?? json['title'] ?? 'Luxury Apparel').toString(),
      description: (json['description'] ?? '').toString(),
      shortDescription: (json['short_description'] ?? json['shortDescription'] ?? '').toString(),
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      originalPrice: (json['original_price'] is num || json['originalPrice'] is num)
          ? ((json['original_price'] ?? json['originalPrice']) as num).toDouble()
          : (double.tryParse(json['original_price']?.toString() ?? json['originalPrice']?.toString() ?? '0') ?? 0.0),
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : (double.tryParse(json['rating']?.toString() ?? '4.5') ?? 4.5),
      reviewCount: (json['review_count'] ?? json['reviewCount'] ?? json['numReviews'] ?? 12) as int? ?? 12,
      category: (json['category'] ?? 'Menswear').toString(),
      imageUrl: mainImage,
      images: parsedImages.isNotEmpty ? parsedImages : [mainImage],
      sizes: parsedSizes.isNotEmpty ? parsedSizes : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: json['colors'] is List
          ? (json['colors'] as List).map((c) => c.toString()).toList()
          : ['Navy', 'Charcoal', 'White', 'Black'],
      isInStock: json['is_in_stock'] ?? json['inStock'] ?? true,
      stockQuantity: (json['stock_quantity'] ?? json['stock'] ?? 25) as int? ?? 25,
      artisanName: (json['artisan_name'] ?? json['artisanName'] ?? 'Style Heaven Atelier').toString(),
      artisanLocation: (json['artisan_location'] ?? json['location'] ?? 'India').toString(),
      material: (json['material'] ?? 'Pure Egyptian Cotton').toString(),
      tags: json['tags'] is List ? (json['tags'] as List).map((t) => t.toString()).toList() : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'originalPrice': originalPrice,
      'rating': rating,
      'category': category,
      'imageUrl': imageUrl,
      'sizes': sizes,
      'colors': colors,
      'isInStock': isInStock,
      'stockQuantity': stockQuantity,
      'artisanName': artisanName,
      'material': material,
    };
  }
}

class UniqueKey {
  static int _idCounter = 0;
  @override
  String toString() => 'item_${++_idCounter}';
}
