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

  Future<void> _showEditDialog(HealthLog log) async {
    final logProvider = Provider.of<HealthLogProvider>(context, listen: false);
    final formKey = GlobalKey<FormState>();
    
    // Controllers initialized with current values
    final nameController = TextEditingController(
      text: log.metrics['name']?.toString() ?? '',
    );
    final caloriesController = TextEditingController(
      text: log.type == 'meal'
          ? (log.metrics['calories']?.toString() ?? '')
          : (log.metrics['caloriesBurned']?.toString() ?? ''),
    );
    final carbsController = TextEditingController(
      text: log.metrics['carbs']?.toString() ?? '',
    );
    final proteinController = TextEditingController(
      text: log.metrics['protein']?.toString() ?? '',
    );
    final fatController = TextEditingController(
      text: log.metrics['fat']?.toString() ?? '',
    );
    final durationController = TextEditingController(
      text: log.metrics['duration']?.toString() ?? '',
    );
    final notesController = TextEditingController(
      text: log.notes ?? '',
    );
    DateTime selectedDate = log.date;

    try {
      await showDialog(
        context: context,
        builder: (dialogContext) => StatefulBuilder(
          builder: (dialogContext, setDialogState) => AlertDialog(
          title: Text('Edit ${_getLogTypeLabel(log.type)}'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Date picker
                  ListTile(
                    title: const Text('Date & Time'),
                    subtitle: Text(
                      DateFormat('MMM d, y • h:mm a').format(selectedDate),
                    ),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: dialogContext,
                        initialDate: selectedDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (date != null && dialogContext.mounted) {
                        final time = await showTimePicker(
                          context: dialogContext,
                          initialTime: TimeOfDay.fromDateTime(selectedDate),
                        );
                        if (time != null && dialogContext.mounted) {
                          setDialogState(() {
                            selectedDate = DateTime(
                              date.year,
                              date.month,
                              date.day,
                              time.hour,
                              time.minute,
                            );
                          });
                        }
                      }
                    },
                  ),
                  const SizedBox(height: 8),
                  // Name field
                  TextFormField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: log.type == 'meal' ? 'Meal Name' : 'Workout Name',
                      prefixIcon: const Icon(Icons.label),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Calories field
                  TextFormField(
                    controller: caloriesController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: log.type == 'meal'
                          ? 'Calories Consumed *'
                          : 'Calories Burned *',
                      prefixIcon: Icon(
                        log.type == 'meal'
                            ? Icons.restaurant_menu
                            : Icons.local_fire_department,
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      final calories = int.tryParse(value);
                      if (calories == null || calories < 0) {
                        return 'Invalid number';
                      }
                      return null;
                    },
                  ),
                  // Meal-specific fields
                  if (log.type == 'meal') ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: carbsController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Carbs (g)',
                              prefixIcon: Icon(Icons.circle),
                            ),
                            validator: (value) {
                              if (value != null &&
                                  value.isNotEmpty &&
                                  int.tryParse(value) == null) {
                                return 'Invalid';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: proteinController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Protein (g)',
                              prefixIcon: Icon(Icons.circle),
                            ),
                            validator: (value) {
                              if (value != null &&
                                  value.isNotEmpty &&
                                  int.tryParse(value) == null) {
                                return 'Invalid';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: fatController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Fat (g)',
                              prefixIcon: Icon(Icons.circle),
                            ),
                            validator: (value) {
                              if (value != null &&
                                  value.isNotEmpty &&
                                  int.tryParse(value) == null) {
                                return 'Invalid';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                  // Workout-specific fields
                  if (log.type == 'workout') ...[
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: durationController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Duration (minutes)',
                        prefixIcon: Icon(Icons.timer),
                      ),
                      validator: (value) {
                        if (value != null &&
                            value.isNotEmpty &&
                            int.tryParse(value) == null) {
                          return 'Invalid number';
                        }
                        return null;
                      },
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Notes field
                  TextFormField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      prefixIcon: Icon(Icons.note),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  try {
                    final metrics = <String, dynamic>{};
                    
                    // Always include name field to allow clearing it
                    metrics['name'] = nameController.text.trim();
                    
                    if (log.type == 'meal') {
                      metrics['calories'] = int.parse(caloriesController.text);
                      if (carbsController.text.trim().isNotEmpty) {
                        metrics['carbs'] = int.parse(carbsController.text.trim());
                      }
                      if (proteinController.text.trim().isNotEmpty) {
                        metrics['protein'] = int.parse(proteinController.text.trim());
                      }
                      if (fatController.text.trim().isNotEmpty) {
                        metrics['fat'] = int.parse(fatController.text.trim());
                      }
                    } else if (log.type == 'workout') {
                      metrics['caloriesBurned'] = int.parse(caloriesController.text);
                      if (durationController.text.trim().isNotEmpty) {
                        metrics['duration'] = int.parse(durationController.text.trim());
                      }
                    }
                    
                    final notes = notesController.text.trim().isEmpty
                        ? null
                        : notesController.text.trim();
                    
                    await logProvider.updateLog(
                      id: log.id,
                      metrics: metrics,
                      notes: notes,
                      date: selectedDate,
                    );
                    
                    if (dialogContext.mounted) {
                      Navigator.of(dialogContext).pop(true);
                    }
                    
                    // Show success message in parent context
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Log updated successfully!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  } catch (e) {
                    if (dialogContext.mounted) {
                      ScaffoldMessenger.of(dialogContext).showSnackBar(
                        SnackBar(
                          content: Text(
                            logProvider.error ?? 'Failed to update log',
                          ),
                          backgroundColor: AppTheme.danger,
                        ),
                      );
                    }
                  }
                }
              },
              child: const Text('Save'),
            ),
          ],
          ),
        ),
      );
    } finally {
      // Cleanup controllers after dialog is fully closed
      // Wait for dialog animation to complete before disposing
      // This prevents the '_dependents.isEmpty' error when TextFormFields
      // are still in the widget tree during disposal
      Future.delayed(const Duration(milliseconds: 300), () {
        nameController.dispose();
        caloriesController.dispose();
        carbsController.dispose();
        proteinController.dispose();
        fatController.dispose();
        durationController.dispose();
        notesController.dispose();
      });
    }
  }

  Future<void> _showDeleteConfirmation(HealthLog log) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Log'),
        content: Text(
          'Are you sure you want to delete this ${_getLogTypeLabel(log.type).toLowerCase()} log? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final logProvider = Provider.of<HealthLogProvider>(context, listen: false);
      try {
        await logProvider.deleteLog(log.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Log deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                logProvider.error ?? 'Failed to delete log',
              ),
              backgroundColor: AppTheme.danger,
            ),
          );
        }
      }
    }
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
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) {
                            if (value == 'edit') {
                              _showEditDialog(log);
                            } else if (value == 'delete') {
                              _showDeleteConfirmation(log);
                            }
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'edit',
                              child: Row(
                                children: [
                                  Icon(Icons.edit, size: 20),
                                  SizedBox(width: 8),
                                  Text('Edit'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'delete',
                              child: Row(
                                children: [
                                  Icon(Icons.delete, size: 20, color: AppTheme.danger),
                                  SizedBox(width: 8),
                                  Text('Delete', style: TextStyle(color: AppTheme.danger)),
                                ],
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

