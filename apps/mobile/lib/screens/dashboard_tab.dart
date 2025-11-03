import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/health_log_provider.dart';
import '../theme/app_theme.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final logProvider = Provider.of<HealthLogProvider>(context, listen: false);
      logProvider.fetchDailyCalories();
    });
  }

  @override
  Widget build(BuildContext context) {
    final logProvider = Provider.of<HealthLogProvider>(context);

    return RefreshIndicator(
      onRefresh: () async {
        await logProvider.fetchDailyCalories();
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Daily Calories',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.text,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Total calories consumed today',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textLight,
              ),
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  children: [
                    if (logProvider.isLoading)
                      const CircularProgressIndicator()
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
                        'calories',
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
}

