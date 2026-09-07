class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final int rewardPoints;
  final String? phoneNumber;
  final String? avatar;
  final String? address;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'customer',
    this.rewardPoints = 250,
    this.phoneNumber,
    this.avatar,
    this.address,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? 'Style Gentleman').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'customer').toString(),
      rewardPoints: (json['rewardPoints'] ?? json['reward_points'] ?? 250) as int? ?? 250,
      phoneNumber: json['phoneNumber'] ?? json['phone'],
      avatar: json['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop',
      address: json['address'] is Map ? (json['address']['street'] ?? '') : json['address']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'rewardPoints': rewardPoints,
      'phoneNumber': phoneNumber,
      'avatar': avatar,
      'address': address,
    };
  }
}
