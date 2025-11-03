import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/health_log_provider.dart';
import '../theme/app_theme.dart';

class LoggingTab extends StatefulWidget {
  const LoggingTab({super.key});

  @override
  State<LoggingTab> createState() => _LoggingTabState();
}

class _LoggingTabState extends State<LoggingTab> {
  final _formKey = GlobalKey<FormState>();
  final _caloriesController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _caloriesController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final logProvider = Provider.of<HealthLogProvider>(context, listen: false);

    try {
      final caloriesBurned = int.parse(_caloriesController.text.trim());

      await logProvider.createWorkoutLog(
        caloriesBurned: caloriesBurned,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Workout logged successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // Clear form
        _caloriesController.clear();
        _notesController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              logProvider.error ?? 'Failed to log workout',
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
            const Icon(
              Icons.fitness_center,
              size: 64,
              color: AppTheme.primary,
            ),
            const SizedBox(height: 24),
            const Text(
              'Log Calories Burned',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.text,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Enter the calories you burned during your workout',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textLight,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            TextFormField(
              controller: _caloriesController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Calories Burned',
                prefixIcon: Icon(Icons.local_fire_department),
                hintText: 'Enter calories burned',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter calories burned';
                }
                final calories = int.tryParse(value);
                if (calories == null || calories < 0) {
                  return 'Please enter a valid number';
                }
                return null;
              },
            ),
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
                  : const Text('Log Workout'),
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

