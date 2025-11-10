import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/health_log_provider.dart';
import '../providers/profile_provider.dart';
import '../theme/app_theme.dart';

class DashboardTab extends StatefulWidget {
  final VoidCallback? onNavigateToProfile;

  const DashboardTab({super.key, this.onNavigateToProfile});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final logProvider = Provider.of<HealthLogProvider>(
        context,
        listen: false,
      );
      final profileProvider = Provider.of<ProfileProvider>(
        context,
        listen: false,
      );
      logProvider.fetchDailyCalories();
      profileProvider.fetchProfile();
    });
  }

  void _navigateToProfile() {
    if (widget.onNavigateToProfile != null) {
      widget.onNavigateToProfile!();
    }
  }

  @override
  Widget build(BuildContext context) {
    final logProvider = Provider.of<HealthLogProvider>(context);
    final profileProvider = Provider.of<ProfileProvider>(context);

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          logProvider.fetchDailyCalories(),
          profileProvider.fetchProfile(),
        ]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Daily Overview',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.text,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Track your progress towards your daily goals',
              style: TextStyle(fontSize: 16, color: AppTheme.textLight),
            ),
            const SizedBox(height: 32),
            // Show loading state while checking profile
            if (profileProvider.isLoading && !profileProvider.goalsExist)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
            // Show prompt if no profile exists
            if (!profileProvider.goalsExist && !profileProvider.isLoading)
              Card(
                color: AppTheme.primary.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 48,
                        color: AppTheme.primary,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Set Your Goals',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.text,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Set your daily nutritional goals to track your progress and see how you\'re doing!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.textLight,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _navigateToProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                        child: const Text('Set Goals'),
                      ),
                    ],
                  ),
                ),
              ),
            // Show dashboard content if profile exists or is loading
            if (profileProvider.goalsExist || profileProvider.isLoading) ...[
              // Calories Consumed Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Calories Consumed',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.text,
                            ),
                          ),
                          if (profileProvider.goals != null)
                            Text(
                              'Goal: ${profileProvider.goals!.calories}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.textLight,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (logProvider.isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      else ...[
                        Text(
                          '${logProvider.dailyCaloriesConsumed}',
                          style: const TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'kcal',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppTheme.textLight,
                          ),
                        ),
                        if (profileProvider.goals != null) ...[
                          const SizedBox(height: 16),
                          _buildProgressBar(
                            consumed: logProvider.dailyCaloriesConsumed,
                            goal: profileProvider.goals!.calories,
                            color: AppTheme.primary,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${((logProvider.dailyCaloriesConsumed / profileProvider.goals!.calories) * 100).toStringAsFixed(1)}% of goal',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ],
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Calories Burned Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Calories Burned',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.text,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (logProvider.isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      else ...[
                        Text(
                          '${logProvider.dailyCaloriesBurned}',
                          style: const TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.success,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'kcal',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppTheme.textLight,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Net Calories Card
              if (profileProvider.goals != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Net Calories',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.text,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Consumed - Burned',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textLight,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (logProvider.isLoading)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else ...[
                          Text(
                            '${logProvider.dailyCaloriesConsumed - logProvider.dailyCaloriesBurned}',
                            style: TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                              color:
                                  (logProvider.dailyCaloriesConsumed -
                                          logProvider.dailyCaloriesBurned) >=
                                      0
                                  ? AppTheme.primary
                                  : AppTheme.success,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'kcal',
                            style: TextStyle(
                              fontSize: 18,
                              color: AppTheme.textLight,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildProgressBar(
                            consumed:
                                logProvider.dailyCaloriesConsumed -
                                logProvider.dailyCaloriesBurned,
                            goal: profileProvider.goals!.calories,
                            color:
                                (logProvider.dailyCaloriesConsumed -
                                        logProvider.dailyCaloriesBurned) >=
                                    0
                                ? AppTheme.primary
                                : AppTheme.success,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              // Sleep Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Sleep',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.text,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            color: AppTheme.primary,
                            onPressed: () =>
                                _showSleepLogDialog(context, logProvider),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (logProvider.isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      else ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              logProvider.dailySleepDuration > 0
                                  ? (logProvider.dailySleepDuration / 60)
                                        .toStringAsFixed(1)
                                  : '0',
                              style: const TextStyle(
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Padding(
                              padding: EdgeInsets.only(bottom: 8.0),
                              child: Text(
                                'hrs',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: AppTheme.textLight,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (logProvider.dailySleepQuality != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Quality: ${_formatSleepQuality(logProvider.dailySleepQuality!)}',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ] else if (logProvider.dailySleepDuration == 0) ...[
                          const SizedBox(height: 8),
                          const Text(
                            'No sleep logged today',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ],
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Macros Section
              if (profileProvider.goals != null) ...[
                const Text(
                  'Macronutrients',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.text,
                  ),
                ),
                const SizedBox(height: 16),
                // Protein Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Protein',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.text,
                              ),
                            ),
                            Text(
                              'Goal: ${profileProvider.goals!.protein}g',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.textLight,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        if (logProvider.isLoading)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else ...[
                          Text(
                            '${logProvider.dailyProtein}',
                            style: const TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'g',
                            style: TextStyle(
                              fontSize: 18,
                              color: AppTheme.textLight,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildProgressBar(
                            consumed: logProvider.dailyProtein,
                            goal: profileProvider.goals!.protein,
                            color: AppTheme.primary,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            profileProvider.goals!.protein > 0
                                ? '${((logProvider.dailyProtein / profileProvider.goals!.protein) * 100).toStringAsFixed(1)}% of goal'
                                : '0% of goal',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Carbs Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Carbs',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.text,
                              ),
                            ),
                            Text(
                              'Goal: ${profileProvider.goals!.carbs}g',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.textLight,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        if (logProvider.isLoading)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else ...[
                          Text(
                            '${logProvider.dailyCarbs}',
                            style: const TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'g',
                            style: TextStyle(
                              fontSize: 18,
                              color: AppTheme.textLight,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildProgressBar(
                            consumed: logProvider.dailyCarbs,
                            goal: profileProvider.goals!.carbs,
                            color: AppTheme.primary,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            profileProvider.goals!.carbs > 0
                                ? '${((logProvider.dailyCarbs / profileProvider.goals!.carbs) * 100).toStringAsFixed(1)}% of goal'
                                : '0% of goal',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Fat Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Fat',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.text,
                              ),
                            ),
                            Text(
                              'Goal: ${profileProvider.goals!.fats}g',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.textLight,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        if (logProvider.isLoading)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else ...[
                          Text(
                            '${logProvider.dailyFat}',
                            style: const TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'g',
                            style: TextStyle(
                              fontSize: 18,
                              color: AppTheme.textLight,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildProgressBar(
                            consumed: logProvider.dailyFat,
                            goal: profileProvider.goals!.fats,
                            color: AppTheme.primary,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            profileProvider.goals!.fats > 0
                                ? '${((logProvider.dailyFat / profileProvider.goals!.fats) * 100).toStringAsFixed(1)}% of goal'
                                : '0% of goal',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ],
            const SizedBox(height: 24),
            if (logProvider.error != null)
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
        ),
      ),
    );
  }

  Widget _buildProgressBar({
    required int consumed,
    required int goal,
    required Color color,
  }) {
    final percentage = (consumed / goal).clamp(0.0, 1.0);
    final isOverGoal = consumed > goal;

    return ClipRRect(
      borderRadius: BorderRadius.circular(8.0),
      child: Container(
        height: 12,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(8.0),
        ),
        child: Stack(
          children: [
            FractionallySizedBox(
              widthFactor: percentage > 1.0 ? 1.0 : percentage,
              child: Container(
                decoration: BoxDecoration(
                  color: isOverGoal ? AppTheme.danger : color,
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
            ),
            if (isOverGoal && percentage > 1.0)
              Positioned(
                right: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: AppTheme.danger,
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatSleepQuality(String quality) {
    switch (quality) {
      case 'poor':
        return 'Poor';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'excellent':
        return 'Excellent';
      default:
        return quality;
    }
  }

  void _showSleepLogDialog(
    BuildContext context,
    HealthLogProvider logProvider,
  ) {
    final durationController = TextEditingController();
    final notesController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final selectedQuality = ValueNotifier<String?>(null);

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Log Sleep'),
              content: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: durationController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Duration (hours)',
                          hintText: 'e.g., 7.5',
                          prefixIcon: Icon(Icons.bedtime),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter sleep duration';
                          }
                          final hours = double.tryParse(value);
                          if (hours == null || hours < 0 || hours > 24) {
                            return 'Please enter a valid duration (0-24 hours)';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      ValueListenableBuilder<String?>(
                        valueListenable: selectedQuality,
                        builder: (context, quality, _) {
                          return DropdownButtonFormField<String>(
                            initialValue: quality,
                            decoration: const InputDecoration(
                              labelText: 'Quality (Optional)',
                              prefixIcon: Icon(Icons.star),
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'poor',
                                child: Text('Poor'),
                              ),
                              DropdownMenuItem(
                                value: 'fair',
                                child: Text('Fair'),
                              ),
                              DropdownMenuItem(
                                value: 'good',
                                child: Text('Good'),
                              ),
                              DropdownMenuItem(
                                value: 'excellent',
                                child: Text('Excellent'),
                              ),
                            ],
                            onChanged: (value) {
                              selectedQuality.value = value;
                            },
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: notesController,
                        decoration: const InputDecoration(
                          labelText: 'Notes (Optional)',
                          prefixIcon: Icon(Icons.note),
                        ),
                        maxLines: 3,
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    selectedQuality.dispose();
                    Navigator.of(context).pop();
                  },
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (formKey.currentState!.validate()) {
                      try {
                        final hours = double.parse(durationController.text);
                        final minutes = (hours * 60).round();

                        await logProvider.createSleepLog(
                          duration: minutes,
                          quality: selectedQuality.value,
                          notes: notesController.text.trim().isEmpty
                              ? null
                              : notesController.text.trim(),
                        );

                        if (context.mounted) {
                          selectedQuality.dispose();
                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Sleep logged successfully!'),
                              backgroundColor: AppTheme.success,
                            ),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Failed to log sleep: ${e.toString()}',
                              ),
                              backgroundColor: AppTheme.danger,
                            ),
                          );
                        }
                      }
                    }
                  },
                  child: const Text('Log Sleep'),
                ),
              ],
            );
          },
        );
      },
    ).then((_) {
      durationController.dispose();
      notesController.dispose();
      try {
        selectedQuality.dispose();
      } catch (e) {
        // Already disposed
      }
    });
  }
}
