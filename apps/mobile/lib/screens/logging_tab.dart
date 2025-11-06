import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
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
  final _imagePicker = ImagePicker();
  LogType _selectedLogType = LogType.meal;
  Uint8List? _selectedImageBytes;
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
    setState(() {
      _selectedImageBytes = null;
    });
    _caloriesController.clear();
    _nameController.clear();
    _carbsController.clear();
    _proteinController.clear();
    _fatController.clear();
    _durationController.clear();
    _notesController.clear();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (image != null) {
        // Read image bytes (works on both web and mobile)
        final bytes = await image.readAsBytes();
        setState(() {
          _selectedImageBytes = bytes;
        });
        await _processImage(bytes);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: ${e.toString()}'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
  }

  Future<void> _processImage(Uint8List imageBytes) async {
    try {
      // Convert image bytes to base64
      final base64Image = base64Encode(imageBytes);

      final logProvider = Provider.of<HealthLogProvider>(context, listen: false);

      // Show loading indicator
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                SizedBox(width: 16),
                Text('Analyzing image...'),
              ],
            ),
            duration: Duration(seconds: 30),
          ),
        );
      }

      final dishInfo = await logProvider.getDishInfoFromImage(base64Image);

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();

        if (dishInfo != null) {
          // Populate form fields with dish information
          if (dishInfo['dish_title'] != null) {
            _nameController.text = dishInfo['dish_title'].toString();
          }
          if (dishInfo['total_calories'] != null) {
            _caloriesController.text = dishInfo['total_calories'].toString();
          }
          if (dishInfo['total_carbs'] != null) {
            _carbsController.text = dishInfo['total_carbs'].toString();
          }
          if (dishInfo['total_protein'] != null) {
            _proteinController.text = dishInfo['total_protein'].toString();
          }
          if (dishInfo['total_fat'] != null) {
            _fatController.text = dishInfo['total_fat'].toString();
          }
          if (dishInfo['description'] != null) {
            _notesController.text = dishInfo['description'].toString();
          }

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Dish information loaded successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not identify dish from image. Please enter details manually.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to process image: ${e.toString()}',
            ),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
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
            // Image upload section (only for meals)
            if (_selectedLogType == LogType.meal) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Log Meal from Image',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.text,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _pickImage(ImageSource.camera),
                              icon: const Icon(Icons.camera_alt),
                              label: const Text('Take Photo'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _pickImage(ImageSource.gallery),
                              icon: const Icon(Icons.photo_library),
                              label: const Text('Choose from Gallery'),
                            ),
                          ),
                        ],
                      ),
                      if (_selectedImageBytes != null) ...[
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.memory(
                            _selectedImageBytes!,
                            height: 200,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton.icon(
                          onPressed: () {
                            setState(() {
                              _selectedImageBytes = null;
                            });
                          },
                          icon: const Icon(Icons.delete_outline),
                          label: const Text('Remove Image'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.danger,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
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

