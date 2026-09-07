import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/colors.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';

class AppDrawer extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  const AppDrawer({
    super.key,
    required this.selectedIndex,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: AppColors.heroGradient,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.checkroom, color: AppColors.accentLight, size: 28),
                      ),
                      const Spacer(),
                      if (authProvider.isAuthenticated)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star, size: 12, color: Colors.white),
                              const SizedBox(width: 4),
                              Text(
                                '${user?.rewardPoints ?? 0} pts',
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    authProvider.isAuthenticated ? (user?.name ?? 'Gentleman') : 'Style Heaven Menswear',
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    authProvider.isAuthenticated ? (user?.email ?? '') : 'Authentic Handlooms & Tailoring',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
                  ),
                ],
              ),
            ),

            // Navigation List Items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _drawerTile(context, Icons.home_outlined, 'Home', 0),
                  _drawerTile(context, Icons.storefront_outlined, 'Product Catalog', 1),
                  _drawerTile(context, Icons.favorite_border, 'Wishlist', 2),
                  _drawerTile(context, Icons.shopping_bag_outlined, 'My Cart', 3),
                  _drawerTile(context, Icons.receipt_long_outlined, 'My Orders', 4),
                  _drawerTile(context, Icons.person_outline, 'Profile & Rewards', 5),
                  const Divider(color: AppColors.divider, thickness: 1, indent: 16, endIndent: 16),
                  ListTile(
                    leading: const Icon(Icons.local_offer_outlined, color: AppColors.accent),
                    title: const Text('Promo: HEAVEN20 (20% OFF)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.accentDark)),
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Coupon HEAVEN20 copied! Apply at checkout for 20% OFF')),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Bottom Login / Logout Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: authProvider.isAuthenticated
                  ? OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        minimumSize: const Size(double.infinity, 44),
                      ),
                      onPressed: () {
                        authProvider.logout();
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.logout, size: 18),
                      label: const Text('Logout'),
                    )
                  : ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 44),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                      icon: const Icon(Icons.login, size: 18),
                      label: const Text('Sign In / Register'),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerTile(BuildContext context, IconData icon, String title, int index) {
    final isSelected = selectedIndex == index;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppColors.accent : AppColors.textSecondary,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? AppColors.primary : AppColors.textPrimary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: AppColors.accent.withValues(alpha: 0.08),
      onTap: () {
        Navigator.pop(context);
        onSelect(index);
      },
    );
  }
}
