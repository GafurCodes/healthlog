import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/health_log_provider.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'verify_email_screen.dart';
import 'dashboard_tab.dart';
import 'log_list_tab.dart';
import 'logging_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    // Check email verification on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkEmailVerification();
      _loadInitialData();
    });
  }

  void _checkEmailVerification() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user?.emailVerified != true) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const VerifyEmailScreen(),
        ),
      );
    }
  }

  void _loadInitialData() {
    final logProvider = Provider.of<HealthLogProvider>(context, listen: false);
    logProvider.refreshData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _handleLogout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const LoginScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('HealthLog'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: 'Logout',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.dashboard), text: 'Dashboard'),
            Tab(icon: Icon(Icons.list), text: 'Logs'),
            Tab(icon: Icon(Icons.add_circle), text: 'Log'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          DashboardTab(),
          LogListTab(),
          LoggingTab(),
        ],
      ),
    );
  }
}

