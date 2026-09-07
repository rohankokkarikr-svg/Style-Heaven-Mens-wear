class CategoryItem {
  final String id;
  final String name;
  final String icon;
  final String imageUrl;

  const CategoryItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.imageUrl,
  });

  static const List<CategoryItem> defaultCategories = [
    CategoryItem(
      id: 'all',
      name: 'All Collections',
      icon: '✨',
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop',
    ),
    CategoryItem(
      id: 'Handloom & Textiles',
      name: 'Shirts & Handlooms',
      icon: '👔',
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop',
    ),
    CategoryItem(
      id: 'Suits & Blazers',
      name: 'Suits & Blazers',
      icon: '🎩',
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop',
    ),
    CategoryItem(
      id: 'Ethnic Kurtas',
      name: 'Royal Kurtas',
      icon: '🧵',
      imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&auto=format&fit=crop',
    ),
    CategoryItem(
      id: 'Trousers & Chinos',
      name: 'Trousers & Chinos',
      icon: '👖',
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop',
    ),
    CategoryItem(
      id: 'Footwear & Accessories',
      name: 'Shoes & Accessories',
      icon: '👞',
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop',
    ),
  ];
}
