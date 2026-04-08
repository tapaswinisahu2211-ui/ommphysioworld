import 'package:shared_preferences/shared_preferences.dart';

class PublicChatStorage {
  static const _conversationIdKey = 'public_chat_conversation_id';

  Future<String?> getConversationId() async {
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_conversationIdKey)?.trim() ?? '';
    return value.isEmpty ? null : value;
  }

  Future<void> saveConversationId(String conversationId) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_conversationIdKey, conversationId.trim());
  }

  Future<void> clearConversationId() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_conversationIdKey);
  }
}
