import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/health_log_provider.dart';
import '../models/health_log.dart';
import '../theme/app_theme.dart';

class LogListTab extends StatefulWidget {
  const LogListTab({super.key});

  @override
  State<LogListTab> createState() => _LogListTabState();
}

class _LogListTabState extends State<LogListTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final logProvider = Provider.of<HealthLogProvider>(context, listen: false);
      logProvider.fetchLogs();
    });
  }

  String _getLogTypeLabel(String type) {
    switch (type) {
      case 'meal':
        return 'Meal';
      case 'workout':
        return 'Workout';
      case 'sleep':
        return 'Sleep';
      default:
        return type;
    }
  }

  IconData _getLogTypeIcon(String type) {
    switch (type) {
      case 'meal':
        return Icons.restaurant;
      case 'workout':
        return Icons.fitness_center;
      case 'sleep':
        return Icons.bedtime;
      default:
        return Icons.article;
    }
  }

  Color _getLogTypeColor(String type) {
    switch (type) {
      case 'meal':
        return Colors.orange;
      case 'workout':
        return Colors.blue;
      case 'sleep':
        return Colors.purple;
      default:
        return AppTheme.textLight;
    }
  }

  String _formatLogDetails(HealthLog log) {
    final metrics = log.metrics;
    if (log.type == 'meal') {
      final calories = metrics['calories'] ?? 0;
      return '$calories calories';
    } else if (log.type == 'workout') {
      final caloriesBurned = metrics['caloriesBurned'] ?? 0;
      final duration = metrics['duration'];
      if (duration != null) {
        return '$caloriesBurned cal burned • ${duration}min';
      }
      return '$caloriesBurned calories burned';
    } else if (log.type == 'sleep') {
      final duration = metrics['duration'];
      if (duration != null) {
        final hours = (duration / 60).floor();
        final minutes = duration % 60;
        return '${hours}h ${minutes}m';
      }
      return 'Sleep logged';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final logProvider = Provider.of<HealthLogProvider>(context);
    final logs = logProvider.logs;
    final dateFormat = DateFormat('MMM d, y');
    final timeFormat = DateFormat('h:mm a');

    return RefreshIndicator(
      onRefresh: () async {
        await logProvider.fetchLogs();
      },
      child: logProvider.isLoading && logs.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : logs.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.article_outlined,
                        size: 64,
                        color: AppTheme.textLight,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No logs yet',
                        style: TextStyle(
                          fontSize: 18,
                          color: AppTheme.textLight,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Start logging your health data',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.textLight,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: logs.length,
                  itemBuilder: (context, index) {
                    final log = logs[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12.0),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _getLogTypeColor(log.type).withOpacity(0.1),
                          child: Icon(
                            _getLogTypeIcon(log.type),
                            color: _getLogTypeColor(log.type),
                          ),
                        ),
                        title: Text(
                          _getLogTypeLabel(log.type),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              _formatLogDetails(log),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.textLight,
                              ),
                            ),
                            if (log.notes != null && log.notes!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                log.notes!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textLight,
                                ),
                              ),
                            ],
                            const SizedBox(height: 4),
                            Text(
                              '${dateFormat.format(log.date)} • ${timeFormat.format(log.date)}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.textLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

