import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _loadStoredUser();
  }

  Future<void> _loadStoredUser() async {
    _token = await StorageService.getToken();
    _user = await StorageService.getUser();
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService().login(email, password);
    _isLoading = false;

    if (res['success'] == true) {
      _user = res['user'];
      _token = res['token'];
      notifyListeners();
      return true;
    } else {
      _errorMessage = res['message'];
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup(String name, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await ApiService().signup(name, email, password);
    _isLoading = false;

    if (res['success'] == true) {
      _user = res['user'];
      _token = res['token'];
      notifyListeners();
      return true;
    } else {
      _errorMessage = res['message'];
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    await StorageService.clearToken();
    await StorageService.clearUser();
    notifyListeners();
  }
}
