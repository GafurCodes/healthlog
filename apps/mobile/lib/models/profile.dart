class Profile {
  final String id;
  final String userId;
  final ProfileGoals goals;
  final DateTime createdAt;
  final DateTime updatedAt;

  Profile({
    required this.id,
    required this.userId,
    required this.goals,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] ?? json['_id'] ?? '',
      userId: json['userId'] ?? '',
      goals: ProfileGoals.fromJson(json['goals'] ?? {}),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'goals': goals.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class ProfileGoals {
  final int calories;
  final int protein;
  final int carbs;
  final int fats;

  ProfileGoals({
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fats,
  });

  factory ProfileGoals.fromJson(Map<String, dynamic> json) {
    return ProfileGoals(
      calories: json['calories'] ?? 0,
      protein: json['protein'] ?? 0,
      carbs: json['carbs'] ?? 0,
      fats: json['fats'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fats': fats,
    };
  }

  ProfileGoals copyWith({
    int? calories,
    int? protein,
    int? carbs,
    int? fats,
  }) {
    return ProfileGoals(
      calories: calories ?? this.calories,
      protein: protein ?? this.protein,
      carbs: carbs ?? this.carbs,
      fats: fats ?? this.fats,
    );
  }
}

