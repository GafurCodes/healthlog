import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/profile_provider.dart';
import '../theme/app_theme.dart';
import '../components/goals_calculator.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _caloriesController;
  late TextEditingController _proteinController;
  late TextEditingController _carbsController;
  late TextEditingController _fatsController;
  bool _goalsLoaded = false;

  @override
  void initState() {
    super.initState();
    _caloriesController = TextEditingController();
    _proteinController = TextEditingController();
    _carbsController = TextEditingController();
    _fatsController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profileProvider = Provider.of<ProfileProvider>(context, listen: false);
      profileProvider.fetchProfile();
    });
  }

  @override
  void dispose() {
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatsController.dispose();
    super.dispose();
  }

  void _loadGoals(ProfileProvider provider) {
    if (provider.goals != null) {
      _caloriesController.text = provider.goals!.calories.toString();
      _proteinController.text = provider.goals!.protein.toString();
      _carbsController.text = provider.goals!.carbs.toString();
      _fatsController.text = provider.goals!.fats.toString();
    } else {
      _caloriesController.clear();
      _proteinController.clear();
      _carbsController.clear();
      _fatsController.clear();
    }
  }

  Future<void> _handleSubmit(ProfileProvider provider) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      await provider.updateProfile(
        calories: int.parse(_caloriesController.text),
        protein: int.parse(_proteinController.text),
        carbs: int.parse(_carbsController.text),
        fats: int.parse(_fatsController.text),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Goals saved successfully!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save goals: ${e.toString()}'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ProfileProvider>(
      builder: (context, provider, _) {
        // Load goals into controllers when profile is loaded
        if (provider.goals != null && !provider.isLoading && !_goalsLoaded) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _loadGoals(provider);
              _goalsLoaded = true;
            }
          });
        } else if (provider.goals == null && _goalsLoaded) {
          // Reset flag if goals are cleared
          _goalsLoaded = false;
        }

        return RefreshIndicator(
          onRefresh: () => provider.fetchProfile(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Set Your Daily Goals',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.text,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Set your daily nutritional goals to track your progress.',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.textLight,
                  ),
                ),
                const SizedBox(height: 32),
                // Goals Calculator
                GoalsCalculator(profileProvider: provider),
                const SizedBox(height: 32),
                // Manual Goals Entry
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Manual Macro Goals',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.text,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Or manually enter your goals below',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                          const SizedBox(height: 24),
                          if (provider.isLoading)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(32.0),
                                child: CircularProgressIndicator(),
                              ),
                            )
                          else ...[
                            if (!provider.goalsExist && !provider.isLoading)
                              const Padding(
                                padding: EdgeInsets.only(bottom: 24.0),
                                child: Center(
                                  child: Text(
                                    'No goals set yet!',
                                    style: TextStyle(
                                      color: AppTheme.textLight,
                                    ),
                                  ),
                                ),
                              ),
                            _buildNumberField(
                              controller: _caloriesController,
                              label: 'Calories (kcal)',
                              icon: Icons.local_fire_department,
                            ),
                            const SizedBox(height: 16),
                            _buildNumberField(
                              controller: _proteinController,
                              label: 'Protein (g)',
                              icon: Icons.fitness_center,
                            ),
                            const SizedBox(height: 16),
                            _buildNumberField(
                              controller: _carbsController,
                              label: 'Carbs (g)',
                              icon: Icons.breakfast_dining,
                            ),
                            const SizedBox(height: 16),
                            _buildNumberField(
                              controller: _fatsController,
                              label: 'Fats (g)',
                              icon: Icons.water_drop,
                            ),
                            if (provider.error != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12.0),
                                decoration: BoxDecoration(
                                  color: AppTheme.danger.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8.0),
                                ),
                                child: Text(
                                  provider.error!,
                                  style: const TextStyle(
                                    color: AppTheme.danger,
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: provider.isLoading
                                  ? null
                                  : () => _handleSubmit(provider),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16.0),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.0),
                                ),
                              ),
                              child: provider.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                      ),
                                    )
                                  : const Text(
                                      'Save Goals',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNumberField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.primary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter a value';
        }
        final num = int.tryParse(value);
        if (num == null || num < 0) {
          return 'Please enter a valid number (≥ 0)';
        }
        return null;
      },
    );
  }
}

