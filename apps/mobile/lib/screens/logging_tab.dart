import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/health_log_provider.dart';
import '../theme/app_theme.dart';

enum LogType { meal, workout }

class LoggingTab extends StatefulWidget {
  const LoggingTab({super.key});

  @override
  State<LoggingTab> createState() => _LoggingTabState();
}

class _LoggingTabState extends State<LoggingTab> {
  final _formKey = GlobalKey<FormState>();
  LogType _selectedLogType = LogType.meal;
  final _caloriesController = TextEditingController();
  final _nameController = TextEditingController();
  final _carbsController = TextEditingController();
  final _proteinController = TextEditingController();
  final _fatController = TextEditingController();
  final _durationController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _caloriesController.dispose();
    _nameController.dispose();
    _carbsController.dispose();
    _proteinController.dispose();
    _fatController.dispose();
    _durationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _caloriesController.clear();
    _nameController.clear();
    _carbsController.clear();
    _proteinController.clear();
    _fatController.clear();
    _durationController.clear();
    _notesController.clear();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final logProvider = Provider.of<HealthLogProvider>(context, listen: false);

    try {
      if (_selectedLogType == LogType.meal) {
        final calories = int.parse(_caloriesController.text.trim());
        final name = _nameController.text.trim().isEmpty
            ? null
            : _nameController.text.trim();
        final carbs = _carbsController.text.trim().isEmpty
            ? null
            : int.tryParse(_carbsController.text.trim());
        final protein = _proteinController.text.trim().isEmpty
            ? null
            : int.tryParse(_proteinController.text.trim());
        final fat = _fatController.text.trim().isEmpty
            ? null
            : int.tryParse(_fatController.text.trim());
        final notes = _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim();

        await logProvider.createMealLog(
          calories: calories,
          name: name,
          carbs: carbs,
          protein: protein,
          fat: fat,
          notes: notes,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Meal logged successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          _clearForm();
        }
      } else {
        final caloriesBurned = int.parse(_caloriesController.text.trim());
        final name = _nameController.text.trim().isEmpty
            ? null
            : _nameController.text.trim();
        final duration = _durationController.text.trim().isEmpty
            ? null
            : int.tryParse(_durationController.text.trim());
        final notes = _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim();

        await logProvider.createWorkoutLog(
          caloriesBurned: caloriesBurned,
          name: name,
          duration: duration,
          notes: notes,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Workout logged successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          _clearForm();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              logProvider.error ??
                  'Failed to log ${_selectedLogType == LogType.meal ? 'meal' : 'workout'}',
            ),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final logProvider = Provider.of<HealthLogProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              _selectedLogType == LogType.meal
                  ? Icons.restaurant
                  : Icons.fitness_center,
              size: 64,
              color: AppTheme.primary,
            ),
            const SizedBox(height: 24),
            const Text(
              'Log Entry',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.text,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _selectedLogType == LogType.meal
                  ? 'Log your meal and calories consumed'
                  : 'Log your workout and calories burned',
              style: const TextStyle(
                fontSize: 16,
                color: AppTheme.textLight,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Log type selector
            SegmentedButton<LogType>(
              segments: const [
                ButtonSegment<LogType>(
                  value: LogType.meal,
                  label: Text('Meal'),
                  icon: Icon(Icons.restaurant),
                ),
                ButtonSegment<LogType>(
                  value: LogType.workout,
                  label: Text('Workout'),
                  icon: Icon(Icons.fitness_center),
                ),
              ],
              selected: {_selectedLogType},
              onSelectionChanged: (Set<LogType> newSelection) {
                setState(() {
                  _selectedLogType = newSelection.first;
                });
              },
            ),
            const SizedBox(height: 32),
            // Name field (for both types)
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: _selectedLogType == LogType.meal
                    ? 'Meal Name (optional)'
                    : 'Workout Name (optional)',
                prefixIcon: const Icon(Icons.label),
                hintText: _selectedLogType == LogType.meal
                    ? 'e.g., Breakfast, Lunch'
                    : 'e.g., Running, Gym Session',
              ),
            ),
            const SizedBox(height: 16),
            // Calories field (required, different label for each type)
            TextFormField(
              controller: _caloriesController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: _selectedLogType == LogType.meal
                    ? 'Calories Consumed *'
                    : 'Calories Burned *',
                prefixIcon: Icon(
                  _selectedLogType == LogType.meal
                      ? Icons.restaurant_menu
                      : Icons.local_fire_department,
                ),
                hintText: _selectedLogType == LogType.meal
                    ? 'Enter calories consumed'
                    : 'Enter calories burned',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return _selectedLogType == LogType.meal
                      ? 'Please enter calories consumed'
                      : 'Please enter calories burned';
                }
                final calories = int.tryParse(value);
                if (calories == null || calories < 0) {
                  return 'Please enter a valid number';
                }
                return null;
              },
            ),
            // Meal-specific fields
            if (_selectedLogType == LogType.meal) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _carbsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Carbs (g)',
                        prefixIcon: Icon(Icons.circle),
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
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _proteinController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Protein (g)',
                        prefixIcon: Icon(Icons.circle),
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
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _fatController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Fat (g)',
                        prefixIcon: Icon(Icons.circle),
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
                  ),
                ],
              ),
            ],
            // Workout-specific fields
            if (_selectedLogType == LogType.workout) ...[
              const SizedBox(height: 16),
              TextFormField(
                controller: _durationController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Duration (minutes)',
                  prefixIcon: Icon(Icons.timer),
                  hintText: 'Enter workout duration',
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
            const SizedBox(height: 24),
            TextFormField(
              controller: _notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                prefixIcon: Icon(Icons.note),
                hintText: 'Add any additional notes',
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: logProvider.isLoading ? null : _handleSubmit,
              child: logProvider.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      _selectedLogType == LogType.meal
                          ? 'Log Meal'
                          : 'Log Workout',
                    ),
            ),
            if (logProvider.error != null) ...[
              const SizedBox(height: 16),
              Card(
                color: AppTheme.danger.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    logProvider.error!,
                    style: const TextStyle(color: AppTheme.danger),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

