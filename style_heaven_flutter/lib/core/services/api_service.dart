import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../../models/product_model.dart';
import '../../models/user_model.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  Map<String, String> _headers([String? token]) {
    final headers = {'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  Future<List<Product>> getProducts({String? category, String? search}) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.products}').replace(
        queryParameters: {
          if (category != null && category != 'all') 'category': category,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data is List) ? data : (data['products'] ?? data['data'] ?? []);
        if (list is List && list.isNotEmpty) {
          return list.map((item) => Product.fromJson(item)).toList();
        }
      }
    } catch (_) {
      // Backend not running or timeout - fallback to curated menswear catalog
    }

    // Curated Menswear Mock Dataset
    return _filterMockProducts(category: category, search: search);
  }

  Future<Product?> getProductById(String id) async {
    try {
      final response = await http
          .get(Uri.parse('${ApiConstants.baseUrl}${ApiConstants.products}/$id'))
          .timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Product.fromJson(data);
      }
    } catch (_) {}

    // Fallback search in mock dataset
    try {
      return _mockProducts.firstWhere((p) => p.id == id);
    } catch (_) {
      return _mockProducts.isNotEmpty ? _mockProducts.first : null;
    }
  }

  // -------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConstants.baseUrl}${ApiConstants.login}'),
            headers: _headers(),
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final token = data['token'] ?? data['accessToken'] ?? 'demo_token_123';
        final user = User.fromJson(data['user'] ?? data);
        await StorageService.saveToken(token);
        await StorageService.saveUser(user);
        return {'success': true, 'user': user, 'token': token};
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'message': error['message'] ?? 'Login failed'};
      }
    } catch (_) {
      // Demo login fallback if backend isn't online
      final demoUser = User(
        id: 'usr_demo_789',
        name: email.split('@').first.toUpperCase(),
        email: email,
        role: 'customer',
        rewardPoints: 350,
      );
      await StorageService.saveToken('demo_jwt_token_style_heaven');
      await StorageService.saveUser(demoUser);
      return {'success': true, 'user': demoUser, 'token': 'demo_jwt_token_style_heaven'};
    }
  }

  Future<Map<String, dynamic>> signup(String name, String email, String password) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConstants.baseUrl}${ApiConstants.signup}'),
            headers: _headers(),
            body: jsonEncode({'name': name, 'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final token = data['token'] ?? data['accessToken'] ?? 'demo_token_123';
        final user = User.fromJson(data['user'] ?? data);
        await StorageService.saveToken(token);
        await StorageService.saveUser(user);
        return {'success': true, 'user': user, 'token': token};
      } else {
        final error = jsonDecode(response.body);
        return {'success': false, 'message': error['message'] ?? 'Signup failed'};
      }
    } catch (_) {
      final newUser = User(
        id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
        name: name,
        email: email,
        rewardPoints: 500, // Welcome bonus
      );
      await StorageService.saveToken('demo_jwt_token_style_heaven');
      await StorageService.saveUser(newUser);
      return {'success': true, 'user': newUser, 'token': 'demo_jwt_token_style_heaven'};
    }
  }

  // -------------------------------------------------------------
  // ORDERS & COUPONS
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> validateCoupon(String code) async {
    final cleanCode = code.trim().toUpperCase();
    if (cleanCode == 'HEAVEN20' || cleanCode == 'STYLE20') {
      return {'valid': true, 'discountPercent': 20, 'code': cleanCode};
    } else if (cleanCode == 'ROYAL10' || cleanCode == 'FIRST10') {
      return {'valid': true, 'discountPercent': 10, 'code': cleanCode};
    } else if (cleanCode == 'VIP50') {
      return {'valid': true, 'discountPercent': 50, 'code': cleanCode};
    }
    return {'valid': false, 'message': 'Invalid promo code. Try HEAVEN20'};
  }

  // Fallback curated menswear products
  List<Product> _filterMockProducts({String? category, String? search}) {
    List<Product> list = List.from(_mockProducts);
    if (category != null && category.isNotEmpty && category != 'all') {
      list = list.where((p) => p.category.toLowerCase().contains(category.toLowerCase())).toList();
    }
    if (search != null && search.trim().isNotEmpty) {
      final q = search.trim().toLowerCase();
      list = list.where((p) => p.name.toLowerCase().contains(q) || p.description.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  static final List<Product> _mockProducts = [
    Product(
      id: 'sh_prod_1',
      name: 'Royal Heritage Chikankari Silk Kurta',
      description: 'Masterfully hand-embroidered 32-stitch Chikankari kurta with intricate thread detailing on fine modal cotton-silk blend. Designed for regal evenings and festive ceremonies.',
      shortDescription: 'Handcrafted Awadhi Chikankari silk blend kurta in royal ivory.',
      price: 3299.0,
      originalPrice: 4999.0,
      rating: 4.9,
      reviewCount: 142,
      category: 'Ethnic Kurtas',
      imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Ivory Gold', 'Midnight Black', 'Royal Blue'],
      artisanName: 'Shamim Begum Collective',
      artisanLocation: 'Old Lucknow, India',
      material: 'Fine Modal Cotton-Silk',
    ),
    Product(
      id: 'sh_prod_2',
      name: 'Tailored Italian Wool Double-Breasted Suit',
      description: 'Bespoke two-piece tailored suit woven with Super 130s Merino Italian wool. Features peaked lapels, surgeon cuffs, and bespoke horsehair canvas structure.',
      shortDescription: 'Executive Super 130s Italian Merino Wool Double-Breasted Suit in Charcoal.',
      price: 14999.0,
      originalPrice: 21999.0,
      rating: 4.9,
      reviewCount: 88,
      category: 'Suits & Blazers',
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop',
      ],
      sizes: ['38R', '40R', '42R', '44R'],
      colors: ['Charcoal Slate', 'Navy Pinstripe', 'Jet Black'],
      artisanName: 'Savile Master Tailors',
      artisanLocation: 'Milan / Mumbai Atelier',
      material: '100% Super 130s Merino Wool',
    ),
    Product(
      id: 'sh_prod_3',
      name: 'Pure Handloom Organic Linen Casual Shirt',
      description: 'Ultra-breathable French flax organic linen shirt, garment washed for an exquisitely soft touch. Finished with mother-of-pearl buttons and tailored spread collar.',
      shortDescription: 'Breathable pure organic flax linen shirt for effortless elegance.',
      price: 2499.0,
      originalPrice: 3499.0,
      rating: 4.8,
      reviewCount: 96,
      category: 'Handloom & Textiles',
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Sage Green', 'Pure White', 'Sky Blue', 'Terracotta'],
      artisanName: 'Bengal Handloom Guild',
      artisanLocation: 'Kolkata, India',
      material: '100% Organic French Flax Linen',
    ),
    Product(
      id: 'sh_prod_4',
      name: 'Classic Slim-Fit Stretch Chino Trousers',
      description: 'Crafted with combed long-staple cotton and 3% elastane for unrestricted all-day mobility. Tailored silhouette, angled coin pocket, and crease-resistant finish.',
      shortDescription: 'Premium stretch cotton chinos tailored for modern gentlemen.',
      price: 2199.0,
      originalPrice: 2999.0,
      rating: 4.7,
      reviewCount: 110,
      category: 'Trousers & Chinos',
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1000&auto=format&fit=crop',
      ],
      sizes: ['30', '32', '34', '36', '38'],
      colors: ['Khaki Stone', 'Olive', 'Navy Blue', 'Slate Grey'],
      artisanName: 'Style Heaven Tailoring Unit',
      artisanLocation: 'Jaipur, India',
      material: '97% Combed Cotton, 3% Elastane',
    ),
    Product(
      id: 'sh_prod_5',
      name: 'Handcrafted Goodyear-Welted Oxford Shoes',
      description: 'Full-grain calfskin leather dress shoes featuring Goodyear-welted double leather soles, burnished toe cap, and memory foam cork insole cushioning.',
      shortDescription: 'Full-grain calfskin Goodyear-welted leather Oxford shoes.',
      price: 7499.0,
      originalPrice: 10999.0,
      rating: 4.95,
      reviewCount: 74,
      category: 'Footwear & Accessories',
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1000&auto=format&fit=crop',
      ],
      sizes: ['7 UK', '8 UK', '9 UK', '10 UK', '11 UK'],
      colors: ['Cognac Tan', 'Deep Espresso', 'Classic Black'],
      artisanName: 'Agra Cordwainers Guild',
      artisanLocation: 'Agra, India',
      material: '100% Full-Grain Calfskin Leather',
    ),
    Product(
      id: 'sh_prod_6',
      name: 'Banarasi Brocade Nehru Bandi Jacket',
      description: 'Handwoven pure silk Banarasi brocade sleeveless jacket featuring antique gold Zari floral motifs and antique brass buttons.',
      shortDescription: 'Pure handloom Banarasi silk brocade Nehru jacket with gold Zari.',
      price: 4599.0,
      originalPrice: 6599.0,
      rating: 4.85,
      reviewCount: 53,
      category: 'Ethnic Kurtas',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Royal Emerald', 'Burgundy Wine', 'Midnight Navy'],
      artisanName: 'Varanasi Silk Weavers',
      artisanLocation: 'Varanasi, India',
      material: 'Handwoven Banarasi Silk & Zari',
    ),
  ];
}
