import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class ShopCartStorage {
  static const _cartItemsKey = 'shop_cart_items';

  Future<List<Map<String, dynamic>>> getItems() async {
    final preferences = await SharedPreferences.getInstance();
    final rawValue = preferences.getString(_cartItemsKey)?.trim() ?? '';

    if (rawValue.isEmpty) {
      return const [];
    }

    try {
      final decoded = jsonDecode(rawValue);
      if (decoded is List) {
        return decoded.whereType<Map>().map((item) {
          return item.map(
            (key, value) => MapEntry(key.toString(), value),
          );
        }).toList();
      }
    } catch (_) {
      await clear();
    }

    return const [];
  }

  Future<void> saveItems(List<Map<String, dynamic>> items) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_cartItemsKey, jsonEncode(items));
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_cartItemsKey);
  }
}
