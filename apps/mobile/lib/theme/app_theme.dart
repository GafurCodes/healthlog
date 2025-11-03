import 'package:flutter/material.dart';

class AppTheme {
  // Color scheme matching web UI
  static const Color primary = Color(0xFF3B82F6); // #3b82f6
  static const Color primaryDark = Color(0xFF1E40AF); // #1e40af
  static const Color danger = Color(0xFFEF4444); // #ef4444
  static const Color dangerDark = Color(0xFFDC2626); // #dc2626
  static const Color text = Color(0xFF1F2937); // #1f2937
  static const Color textLight = Color(0xFF6B7280); // #6b7280
  static const Color bg = Color(0xFFFFFFFF); // #ffffff
  static const Color bgLight = Color(0xFFF9FAFB); // #f9fafb
  static const Color border = Color(0xFFE5E7EB); // #e5e7eb

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: primary,
        primaryContainer: primaryDark,
        error: danger,
        errorContainer: dangerDark,
        surface: bg,
        surfaceContainerHighest: bgLight,
        onPrimary: Colors.white,
        onError: Colors.white,
        onSurface: text,
        onSurfaceVariant: textLight,
      ),
      scaffoldBackgroundColor: bg,
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        elevation: 0,
        iconTheme: IconThemeData(color: text),
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: danger, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ),
      cardTheme: CardThemeData(
        color: bg,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: border),
        ),
      ),
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    );
  }
}

