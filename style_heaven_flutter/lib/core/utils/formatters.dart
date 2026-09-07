import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static String formatCurrency(num amount) {
    return _currencyFormat.format(amount);
  }

  static String formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final DateTime dt = date is DateTime ? date : DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dt);
    } catch (_) {
      return date.toString();
    }
  }

  static int calculateDiscountPercent(num original, num discounted) {
    if (original <= 0 || discounted >= original) return 0;
    return (((original - discounted) / original) * 100).round();
  }
}
