import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:omphysioworld/config/api_config.dart';
import 'package:omphysioworld/storage/patient_session_storage.dart';

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class AppUploadFile {
  const AppUploadFile({
    required this.name,
    required this.bytes,
    this.mimeType,
  });

  final String name;
  final Uint8List bytes;
  final String? mimeType;
}

class AppApiService {
  AppApiService({
    HttpClient? client,
    PatientSessionStorage? patientSessionStorage,
  })  : _client = client ?? HttpClient(),
        _patientSessionStorage = patientSessionStorage ?? PatientSessionStorage();

  final HttpClient _client;
  final PatientSessionStorage _patientSessionStorage;

  Future<Map<String, dynamic>> healthCheck() {
    return _getJson('/health');
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) {
    return _postJson(
      '/auth/login',
      {
        'email': email,
        'password': password,
      },
    );
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String mobile,
    required String password,
  }) {
    return _postJson(
      '/auth/register',
      {
        'name': name,
        'email': email,
        'mobile': mobile,
        'password': password,
        'createdFrom': 'mobile_app',
      },
    );
  }

  Future<Map<String, dynamic>> requestPasswordReset({
    required String email,
  }) {
    return _postJson(
      '/auth/forgot-password',
      {
        'email': email,
      },
    );
  }

  Future<Map<String, dynamic>> submitAppointment({
    required String name,
    required String email,
    required String phone,
    String patientId = '',
    required String service,
    required String date,
    String time = '',
    required String message,
  }) {
    return _postJson(
      '/appointments',
      {
        'name': name,
        'email': email,
        'phone': phone,
        'patientId': patientId,
        'service': service,
        'date': date,
        'time': time,
        'message': message,
      },
    );
  }

  Future<Map<String, dynamic>> submitContactMessage({
    required String name,
    required String email,
    required String phone,
    required String subject,
    required String message,
  }) {
    return _postJson(
      '/contact',
      {
        'name': name,
        'email': email,
        'phone': phone,
        'subject': subject,
        'message': message,
      },
    );
  }

  Future<Map<String, dynamic>> submitStaffApplication({
    required String name,
    required String email,
    required String phone,
    required String role,
    required String experience,
    required String message,
    AppUploadFile? resume,
  }) {
    return _postMultipart(
      '/staff-applications',
      fields: {
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'experience': experience,
        'message': message,
      },
      files: resume == null ? const [] : [resume],
      fileFieldName: 'resume',
    );
  }

  Future<Map<String, dynamic>> submitPatientClinicalNote({
    required String patientId,
    required String title,
    required String note,
    String addedByLabel = 'Patient',
    List<AppUploadFile> documents = const [],
  }) {
    return _postMultipart(
      '/patients/$patientId/clinical-notes',
      fields: {
        'title': title,
        'note': note,
        'addedByType': 'patient',
        'addedByLabel': addedByLabel,
      },
      files: documents,
    );
  }

  Future<Map<String, dynamic>> uploadPatientProfileImage({
    required String patientId,
    required AppUploadFile image,
  }) {
    return _postMultipart(
      '/patients/$patientId/profile-image',
      fields: const {},
      files: [image],
      fileFieldName: 'image',
    );
  }

  Future<Map<String, dynamic>> getPatient({
    required String patientId,
  }) {
    return _getJson('/patients/$patientId');
  }

  Future<Map<String, dynamic>> updatePatientProfile({
    required String patientId,
    required String name,
    required String mobile,
    required String disease,
  }) {
    return _putJson(
      '/patients/$patientId',
      {
        'name': name,
        'mobile': mobile,
        'disease': disease,
      },
    );
  }

  Future<Map<String, dynamic>> changePassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) {
    return _postJson(
      '/auth/change-password',
      {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
    );
  }

  Future<List<Map<String, dynamic>>> getServices() async {
    final response = await _getJson('/services');
    final data = response['data'];

    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList();
    }

    return const [];
  }

  Future<List<Map<String, dynamic>>> getPatientAppointmentRequests({
    required String patientId,
  }) async {
    final response = await _getJson('/patients/$patientId/appointment-requests');
    final data = response['data'];

    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList();
    }

    return const [];
  }

  Future<String> resolveResourceUrl(String pathOrUrl) async {
    final value = pathOrUrl.trim();
    if (value.isEmpty || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    final baseUrl = _resolveBaseUrl();
    return value.startsWith('/') ? '$baseUrl$value' : '$baseUrl/$value';
  }

  Future<List<Map<String, dynamic>>> getPublicChatAgents() async {
    final response = await _getJson('/public-chat-agents');
    final data = response['data'];

    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList();
    }

    return const [];
  }

  Future<Map<String, dynamic>> getPublicChatConversation({
    required String conversationId,
  }) {
    return _getJson('/public-chat/conversations/$conversationId');
  }

  Future<Map<String, dynamic>> startPublicChatConversation({
    required String agentId,
    required String visitorName,
    required String visitorContact,
    required String text,
    List<AppUploadFile> attachments = const [],
  }) {
    return _postMultipart(
      '/public-chat/conversations',
      fields: {
        'agentId': agentId,
        'visitorName': visitorName,
        'visitorContact': visitorContact,
        'text': text,
      },
      files: attachments,
      fileFieldName: 'attachments',
    );
  }

  Future<Map<String, dynamic>> sendPublicChatMessage({
    required String conversationId,
    required String visitorName,
    required String text,
    List<AppUploadFile> attachments = const [],
  }) {
    return _postMultipart(
      '/public-chat/conversations/$conversationId/messages',
      fields: {
        'visitorName': visitorName,
        'text': text,
      },
      files: attachments,
      fileFieldName: 'attachments',
    );
  }

  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> payload,
  ) async {
    return _guardRequest(() async {
      final baseUrl = _resolveBaseUrl();
      final request = await _client.postUrl(Uri.parse('$baseUrl$path'));
      request.headers.contentType = ContentType.json;
      await _applyAuthHeader(request);
      request.write(jsonEncode(payload));

      return _readJsonResponse(response: await request.close());
    });
  }

  Future<Map<String, dynamic>> _getJson(
    String path,
  ) async {
    return _guardRequest(() async {
      final baseUrl = _resolveBaseUrl();
      final request = await _client.getUrl(Uri.parse('$baseUrl$path'));
      await _applyAuthHeader(request);
      return _readJsonResponse(response: await request.close());
    });
  }

  Future<Map<String, dynamic>> _putJson(
    String path,
    Map<String, dynamic> payload,
  ) async {
    return _guardRequest(() async {
      final baseUrl = _resolveBaseUrl();
      final request = await _client.putUrl(Uri.parse('$baseUrl$path'));
      request.headers.contentType = ContentType.json;
      await _applyAuthHeader(request);
      request.write(jsonEncode(payload));

      return _readJsonResponse(response: await request.close());
    });
  }

  Future<Map<String, dynamic>> _postMultipart(
    String path, {
    required Map<String, String> fields,
    required List<AppUploadFile> files,
    String fileFieldName = 'documents',
  }) async {
    return _guardRequest(() async {
      final baseUrl = _resolveBaseUrl();
      final boundary = '----ommphysio-${DateTime.now().microsecondsSinceEpoch}';
      final request = await _client.postUrl(Uri.parse('$baseUrl$path'));
      request.headers.contentType = ContentType(
        'multipart',
        'form-data',
        parameters: {'boundary': boundary},
      );
      await _applyAuthHeader(request);

      for (final entry in fields.entries) {
        _writeMultipartTextField(
          request: request,
          boundary: boundary,
          name: entry.key,
          value: entry.value,
        );
      }

      for (final file in files) {
        _writeMultipartFile(
          request: request,
          boundary: boundary,
          fieldName: fileFieldName,
          file: file,
        );
      }

      request.add(utf8.encode('--$boundary--\r\n'));
      return _readJsonResponse(response: await request.close());
    });
  }

  void _writeMultipartTextField({
    required HttpClientRequest request,
    required String boundary,
    required String name,
    required String value,
  }) {
    request.add(
      utf8.encode(
        '--$boundary\r\n'
        'Content-Disposition: form-data; name="${_escapeMultipartValue(name)}"\r\n'
        '\r\n'
        '$value\r\n',
      ),
    );
  }

  void _writeMultipartFile({
    required HttpClientRequest request,
    required String boundary,
    required String fieldName,
    required AppUploadFile file,
  }) {
    request.add(
      utf8.encode(
        '--$boundary\r\n'
        'Content-Disposition: form-data; name="${_escapeMultipartValue(fieldName)}"; filename="${_escapeMultipartValue(file.name)}"\r\n'
        'Content-Type: ${file.mimeType ?? _guessMimeType(file.name)}\r\n'
        '\r\n',
      ),
    );
    request.add(file.bytes);
    request.add(utf8.encode('\r\n'));
  }

  Future<Map<String, dynamic>> _readJsonResponse({
    required HttpClientResponse response,
  }) async {
    final responseBody = await utf8.decoder.bind(response).join();
    final decodedBody = _decodeJsonObject(responseBody);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        decodedBody['message']?.toString() ??
            'Request failed with status ${response.statusCode}.',
      );
    }

    return decodedBody;
  }

  Future<T> _guardRequest<T>(Future<T> Function() request) async {
    try {
      return await request().timeout(const Duration(seconds: 25));
    } on ApiException {
      rethrow;
    } on SocketException {
      throw ApiException(
        'No internet connection. Please check your network and try again.',
      );
    } on TimeoutException {
      throw ApiException(
        'OPW is taking too long to respond. Please try again in a moment.',
      );
    } on HandshakeException {
      throw ApiException(
        'Secure connection failed. Please try again shortly.',
      );
    } on HttpException {
      throw ApiException(
        'Unable to reach OPW right now. Please try again shortly.',
      );
    } on FormatException {
      throw ApiException(
        'Unexpected response from OPW. Please try again.',
      );
    }
  }

  String _resolveBaseUrl() {
    return ApiConfig.defaultBaseUrl;
  }

  Future<void> _applyAuthHeader(HttpClientRequest request) async {
    final patientUser = await _patientSessionStorage.getPatientUser();
    final token = patientUser?['token']?.toString().trim() ?? '';

    if (token.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    }
  }

  Map<String, dynamic> _decodeJsonObject(String responseBody) {
    if (responseBody.trim().isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(responseBody);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    return <String, dynamic>{
      'data': decoded,
    };
  }

  String _escapeMultipartValue(String value) {
    return value.replaceAll('"', '\\"');
  }

  String _guessMimeType(String fileName) {
    final lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      return 'application/pdf';
    }
    if (lowerName.endsWith('.png')) {
      return 'image/png';
    }
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (lowerName.endsWith('.webp')) {
      return 'image/webp';
    }
    return 'application/octet-stream';
  }
}
