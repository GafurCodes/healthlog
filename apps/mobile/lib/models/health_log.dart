class HealthLog {
  final String id;
  final String userId;
  final String type; // 'meal', 'workout', 'sleep'
  final Map<String, dynamic> metrics;
  final DateTime date;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  HealthLog({
    required this.id,
    required this.userId,
    required this.type,
    required this.metrics,
    required this.date,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory HealthLog.fromJson(Map<String, dynamic> json) {
    return HealthLog(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: json['type'] ?? '',
      metrics: json['metrics'] ?? {},
      date: DateTime.parse(json['date']),
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type,
      'metrics': metrics,
      'date': date.toIso8601String(),
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Helper methods for accessing metrics
  int get calories {
    if (type == 'meal') {
      return (metrics['calories'] as num?)?.toInt() ?? 0;
    }
    return 0;
  }

  int get caloriesBurned {
    if (type == 'workout') {
      return (metrics['caloriesBurned'] as num?)?.toInt() ?? 0;
    }
    return 0;
  }

  int get sleepDuration {
    if (type == 'sleep') {
      return (metrics['duration'] as num?)?.toInt() ?? 0;
    }
    return 0;
  }

  String? get sleepQuality {
    if (type == 'sleep') {
      return metrics['quality'] as String?;
    }
    return null;
  }
}

