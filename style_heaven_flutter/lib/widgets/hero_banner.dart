import 'package:flutter/material.dart';
import '../core/constants/colors.dart';
import '../core/utils/responsive.dart';

class HeroBanner extends StatelessWidget {
  final VoidCallback onExplore;

  const HeroBanner({super.key, required this.onExplore});

  @override
  Widget build(BuildContext context) {
    final isDesktop = Responsive.isDesktop(context);

    return Container(
      width: double.infinity,
      margin: EdgeInsets.symmetric(
        horizontal: isDesktop ? 24 : 16,
        vertical: 16,
      ),
      padding: EdgeInsets.all(isDesktop ? 40 : 24),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          // Content
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.2),
                    border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.workspace_premium, size: 14, color: AppColors.accentLight),
                      SizedBox(width: 6),
                      Text(
                        'ROYAL HERITAGE FESTIVE \'26',
                        style: TextStyle(
                          color: AppColors.accentLight,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Title
                Text(
                  isDesktop
                      ? 'The Art of Tailored\nGentlemen\'s Elegance'
                      : 'Artisanal Menswear\nRedefined',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isDesktop ? 36 : 24,
                    fontWeight: FontWeight.bold,
                    height: 1.15,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 12),

                // Subtitle
                Text(
                  'Authentic Indian handlooms, bespoke suits, and fine Chikankari kurtas directly from master artisans to your wardrobe.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: isDesktop ? 15 : 13,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 24),

                // Action Buttons
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      ),
                      onPressed: onExplore,
                      icon: const Icon(Icons.arrow_forward, size: 18),
                      label: const Text('Explore Catalog', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white38),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Use promo code HEAVEN20 for 20% OFF!')),
                        );
                      },
                      child: const Text('Use Code: HEAVEN20'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Side Decorative Visual on desktop
          if (isDesktop) ...[
            const SizedBox(width: 40),
            Expanded(
              flex: 2,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  height: 220,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white24, width: 2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Image.network(
                    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop',
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => const Icon(Icons.style, size: 80, color: Colors.white54),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
