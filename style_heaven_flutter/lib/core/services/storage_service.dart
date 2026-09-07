import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../../models/user_model.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static Future<void> saveToken(String token) async {
    await init();
    await _prefs?.setString(ApiConstants.tokenKey, token);
  }

  static Future<String?> getToken() async {
    await init();
    return _prefs?.getString(ApiConstants.tokenKey);
  }

  static Future<void> clearToken() async {
    await init();
    await _prefs?.remove(ApiConstants.tokenKey);
  }

  static Future<void> saveUser(User user) async {
    await init();
    await _prefs?.setString(ApiConstants.userKey, jsonEncode(user.toJson()));
  }

  static Future<User?> getUser() async {
    await init();
    final str = _prefs?.getString(ApiConstants.userKey);
    if (str != null && str.isNotEmpty) {
      try {
        return User.fromJson(jsonDecode(str));
      } catch (_) {}
    }
    return null;
  }

  static Future<void> clearUser() async {
    await init();
    await _prefs?.remove(ApiConstants.userKey);
  }
}
