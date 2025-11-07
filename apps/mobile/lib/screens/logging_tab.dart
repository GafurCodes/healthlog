import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/health_log_provider.dart';
import '../services/api_service.dart';
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
  final _foodSearchController = TextEditingController();
  bool _isSearchingFood = false;
  List<Map<String, dynamic>> _foodSuggestions = [];
  bool _isLoadingSuggestions = false;
  Timer? _debounceTimer;

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _caloriesController.dispose();
    _nameController.dispose();
    _carbsController.dispose();
    _proteinController.dispose();
    _fatController.dispose();
    _durationController.dispose();
    _notesController.dispose();
    _foodSearchController.dispose();
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
    _foodSearchController.clear();
  }

  Future<void> _loadFoodSuggestions(String query) async {
    if (query.trim().isEmpty || query.length < 2) {
      setState(() {
        _foodSuggestions = [];
      });
      return;
    }

    setState(() {
      _isLoadingSuggestions = true;
    });

    try {
      final suggestions = await ApiService.autocompleteFood(query);
      if (mounted) {
        setState(() {
          _foodSuggestions = suggestions;
          _isLoadingSuggestions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _foodSuggestions = [];
          _isLoadingSuggestions = false;
        });
      }
    }
  }

  Future<void> _searchFood(String foodName) async {
    if (foodName.trim().isEmpty) {
      return;
    }

    setState(() {
      _isSearchingFood = true;
      _foodSearchController.text = foodName;
    });

    try {
      final foodData = await ApiService.searchFood(foodName);

      if (mounted) {
        setState(() {
          _isSearchingFood = false;
        });

        if (foodData != null) {
          // Populate form fields with search results
          if (foodData['name'] != null) {
            _nameController.text = foodData['name'].toString();
          }

          if (foodData['calories'] != null) {
            final calories = foodData['calories'];
            _caloriesController.text = (calories is num)
                ? calories.round().toString()
                : calories.toString();
          }

          if (foodData['protein'] != null) {
            final protein = foodData['protein'];
            _proteinController.text = (protein is num)
                ? protein.round().toString()
                : protein.toString();
          }

          if (foodData['carbs'] != null) {
            final carbs = foodData['carbs'];
            _carbsController.text = (carbs is num)
                ? carbs.round().toString()
                : carbs.toString();
          }

          if (foodData['fat'] != null) {
            final fat = foodData['fat'];
            _fatController.text = (fat is num)
                ? fat.round().toString()
                : fat.toString();
          }

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Food information loaded successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Food not found. Please try a different search term.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSearchingFood = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to search food: ${e.toString()}'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
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

      final logProvider = Provider.of<HealthLogProvider>(
        context,
        listen: false,
      );

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

      final response = await logProvider.getDishInfoFromImage(base64Image);

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();

        if (response != null && response['gemini_summary'] != null) {
          try {
            // Parse the gemini_summary JSON string
            // Gemini may return JSON wrapped in markdown code blocks (```json ... ```)
            String geminiSummary = response['gemini_summary'] as String;

            // Remove markdown code blocks if present
            geminiSummary = geminiSummary.trim();
            if (geminiSummary.startsWith('```json')) {
              geminiSummary = geminiSummary.substring(7); // Remove ```json
            } else if (geminiSummary.startsWith('```')) {
              geminiSummary = geminiSummary.substring(3); // Remove ```
            }
            if (geminiSummary.endsWith('```')) {
              geminiSummary = geminiSummary.substring(
                0,
                geminiSummary.length - 3,
              ); // Remove closing ```
            }
            geminiSummary = geminiSummary.trim();

            // Parse the cleaned JSON string
            final dishInfo = jsonDecode(geminiSummary) as Map<String, dynamic>;

            // Populate form fields with dish information
            // Map the API response fields to form fields
            if (dishInfo['dish_title'] != null) {
              _nameController.text = dishInfo['dish_title'].toString();
            }

            // Map estimated_calories to calories field
            if (dishInfo['estimated_calories'] != null) {
              final calories = dishInfo['estimated_calories'];
              _caloriesController.text = (calories is num)
                  ? calories.round().toString()
                  : calories.toString();
            }

            // Map estimated_carbs to carbs field
            if (dishInfo['estimated_carbs'] != null) {
              final carbs = dishInfo['estimated_carbs'];
              _carbsController.text = (carbs is num)
                  ? carbs.round().toString()
                  : carbs.toString();
            }

            // Map estimated_proten (note the typo in API) to protein field
            if (dishInfo['estimated_proten'] != null) {
              final protein = dishInfo['estimated_proten'];
              _proteinController.text = (protein is num)
                  ? protein.round().toString()
                  : protein.toString();
            }

            // Map estimated_fat to fat field
            if (dishInfo['estimated_fat'] != null) {
              final fat = dishInfo['estimated_fat'];
              _fatController.text = (fat is num)
                  ? fat.round().toString()
                  : fat.toString();
            }

            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Dish information loaded successfully!'),
                backgroundColor: Colors.green,
              ),
            );
          } catch (e) {
            // If parsing fails, show error but don't crash
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Could not parse dish information. Please try again or enter details manually.',
                ),
                backgroundColor: Colors.orange,
                duration: const Duration(seconds: 4),
              ),
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Could not identify dish from image. Please enter details manually.',
              ),
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
            content: Text('Failed to process image: ${e.toString()}'),
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
              style: const TextStyle(fontSize: 16, color: AppTheme.textLight),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Food search section (only for meals)
            if (_selectedLogType == LogType.meal) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Search for Food',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.text,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Autocomplete<String>(
                        optionsBuilder: (TextEditingValue textEditingValue) {
                          final query = textEditingValue.text;
                          if (query.length < 2) {
                            _debounceTimer?.cancel();
                            setState(() {
                              _foodSuggestions = [];
                            });
                            return const Iterable<String>.empty();
                          }
                          
                          // Debounce the API call
                          _debounceTimer?.cancel();
                          _debounceTimer = Timer(const Duration(milliseconds: 300), () {
                            _loadFoodSuggestions(query);
                          });
                          
                          return _foodSuggestions
                              .map((suggestion) => suggestion['name']?.toString() ?? '')
                              .where((name) => name.isNotEmpty);
                        },
                        onSelected: (String selection) {
                          _searchFood(selection);
                        },
                        fieldViewBuilder: (
                          BuildContext context,
                          TextEditingController textEditingController,
                          FocusNode focusNode,
                          VoidCallback onFieldSubmitted,
                        ) {
                          // Sync controllers
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (textEditingController.text != _foodSearchController.text) {
                              textEditingController.text = _foodSearchController.text;
                            }
                          });
                          
                          return TextFormField(
                            controller: textEditingController,
                            focusNode: focusNode,
                            decoration: InputDecoration(
                              labelText: 'Search food name',
                              hintText: 'e.g., Apple, Chicken Breast',
                              prefixIcon: _isSearchingFood
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: Padding(
                                        padding: EdgeInsets.all(12.0),
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    )
                                  : const Icon(Icons.search),
                            ),
                            onChanged: (value) {
                              _foodSearchController.text = value;
                            },
                            onFieldSubmitted: (String value) {
                              onFieldSubmitted();
                              if (value.trim().isNotEmpty) {
                                _searchFood(value);
                              }
                            },
                          );
                        },
                        optionsViewBuilder: (
                          BuildContext context,
                          AutocompleteOnSelected<String> onSelected,
                          Iterable<String> options,
                        ) {
                          return Align(
                            alignment: Alignment.topLeft,
                            child: Material(
                              elevation: 4.0,
                              borderRadius: BorderRadius.circular(8),
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(maxHeight: 200),
                                child: _isLoadingSuggestions
                                    ? const Padding(
                                        padding: EdgeInsets.all(16.0),
                                        child: Center(
                                          child: CircularProgressIndicator(),
                                        ),
                                      )
                                    : options.isEmpty
                                        ? const Padding(
                                            padding: EdgeInsets.all(16.0),
                                            child: Text('No suggestions found'),
                                          )
                                        : ListView.builder(
                                            shrinkWrap: true,
                                            itemCount: options.length,
                                            itemBuilder: (BuildContext context, int index) {
                                              final foodName = options.elementAt(index);
                                              return InkWell(
                                                onTap: () {
                                                  onSelected(foodName);
                                                },
                                                child: Padding(
                                                  padding: const EdgeInsets.all(16.0),
                                                  child: Text(
                                                    foodName,
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                    ),
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
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
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
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
