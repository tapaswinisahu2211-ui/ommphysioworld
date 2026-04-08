import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:omphysioworld/services/app_api_service.dart';
import 'package:omphysioworld/storage/public_chat_storage.dart';

class PatientChatPanel extends StatefulWidget {
  const PatientChatPanel({
    super.key,
    required this.visitorName,
    required this.visitorContact,
    this.requireVisitorDetails = false,
    this.onContactPressed,
  });

  final String visitorName;
  final String visitorContact;
  final bool requireVisitorDetails;
  final VoidCallback? onContactPressed;

  @override
  State<PatientChatPanel> createState() => _PatientChatPanelState();
}

class _PatientChatPanelState extends State<PatientChatPanel> {
  static const _chatSoundChannel = MethodChannel('omphysioworld/chat_sound');

  final _apiService = AppApiService();
  final _chatStorage = PublicChatStorage();
  final _messageController = TextEditingController();
  late final TextEditingController _visitorNameController;
  late final TextEditingController _visitorContactController;

  Timer? _pollTimer;
  List<Map<String, dynamic>> _agents = [];
  Map<String, dynamic>? _conversation;
  final Set<String> _seenMessageIds = {};
  String _selectedAgentId = '';
  String _error = '';
  List<AppUploadFile> _selectedAttachments = [];
  bool _isLoading = true;
  bool _isSending = false;
  bool _hasLoadedConversationOnce = false;

  String get _visitorName {
    final value = widget.requireVisitorDetails
        ? _visitorNameController.text.trim()
        : widget.visitorName.trim();
    return value.isEmpty ? 'Mobile Patient' : value;
  }

  String get _visitorContact => widget.requireVisitorDetails
      ? _visitorContactController.text.trim()
      : widget.visitorContact.trim();

  @override
  void initState() {
    super.initState();
    _visitorNameController = TextEditingController(text: widget.visitorName);
    _visitorContactController = TextEditingController(
      text: widget.visitorContact,
    );
    _loadChat();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _loadChat(silent: true),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    _visitorNameController.dispose();
    _visitorContactController.dispose();
    super.dispose();
  }

  Future<void> _loadChat({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _error = '';
      });
    }

    try {
      final agents = await _apiService.getPublicChatAgents();
      var conversationId = _conversation?['id']?.toString() ?? '';
      if (conversationId.isEmpty) {
        conversationId = await _chatStorage.getConversationId() ?? '';
      }
      Map<String, dynamic>? conversation;

      if (conversationId.isNotEmpty) {
        try {
          conversation = await _apiService.getPublicChatConversation(
            conversationId: conversationId,
          );
        } catch (_) {
          conversationId = '';
          await _chatStorage.clearConversationId();
        }
      }

      if (!mounted) {
        return;
      }

      _syncMessageSound(conversation);

      setState(() {
        _agents = agents;
        _conversation = conversation;
        if (widget.requireVisitorDetails && conversation != null) {
          if (_visitorNameController.text.trim().isEmpty) {
            _visitorNameController.text =
                conversation['visitorName']?.toString() ?? '';
          }
          if (_visitorContactController.text.trim().isEmpty) {
            _visitorContactController.text =
                conversation['visitorContact']?.toString() ?? '';
          }
        }
        _selectedAgentId = _resolveSelectedAgentId(
          agents: agents,
          conversation: conversation,
        );
        if (!silent) {
          _error = '';
        }
      });
    } catch (_) {
      if (!mounted || silent) {
        return;
      }

      setState(() {
        _error = 'Unable to load live chat right now.';
      });
    } finally {
      if (mounted && !silent) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _resolveSelectedAgentId({
    required List<Map<String, dynamic>> agents,
    required Map<String, dynamic>? conversation,
  }) {
    final assignedTo = conversation?['assignedTo'];
    if (assignedTo is Map) {
      final assignedId = assignedTo['id']?.toString() ?? '';
      if (assignedId.isNotEmpty) {
        return assignedId;
      }
    }

    final currentStillAvailable = agents.any(
      (agent) => agent['id']?.toString() == _selectedAgentId,
    );

    if (currentStillAvailable) {
      return _selectedAgentId;
    }

    return agents.isNotEmpty ? agents.first['id']?.toString() ?? '' : '';
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();

    if (text.isEmpty && _selectedAttachments.isEmpty) {
      setState(() {
        _error = 'Please type your message or add a document.';
      });
      return;
    }

    if (widget.requireVisitorDetails &&
        _conversation == null &&
        _visitorNameController.text.trim().isEmpty) {
      setState(() {
        _error = 'Please enter your name before starting chat.';
      });
      return;
    }

    if (_conversation == null && _selectedAgentId.isEmpty) {
      setState(() {
        _error = 'No doctor or staff is available right now.';
      });
      return;
    }

    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      _isSending = true;
      _error = '';
    });

    try {
      final nextConversation = _conversation == null
          ? await _apiService.startPublicChatConversation(
              agentId: _selectedAgentId,
              visitorName: _visitorName,
              visitorContact: _visitorContact,
              text: text,
              attachments: _selectedAttachments,
            )
          : await _apiService.sendPublicChatMessage(
              conversationId: _conversation!['id'].toString(),
              visitorName: _visitorName,
              text: text,
              attachments: _selectedAttachments,
            );

      await _chatStorage.saveConversationId(nextConversation['id'].toString());

      if (!mounted) {
        return;
      }

      setState(() {
        _conversation = nextConversation;
        _messageController.clear();
        _selectedAttachments = [];
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Unable to send message. Please check the server connection.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  Future<void> _startNewChat() async {
    await _chatStorage.clearConversationId();

    if (!mounted) {
      return;
    }

    setState(() {
      _conversation = null;
      _messageController.clear();
      _selectedAttachments = [];
      _error = '';
      _selectedAgentId = _agents.isNotEmpty ? _agents.first['id']?.toString() ?? '' : '';
    });
  }

  Future<void> _pickAttachments() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx'],
    );

    if (result == null) {
      return;
    }

    final files = result.files
        .where((file) => file.bytes != null)
        .map((file) => AppUploadFile(name: file.name, bytes: file.bytes!))
        .toList();

    if (files.isEmpty) {
      return;
    }

    setState(() {
      _selectedAttachments = [..._selectedAttachments, ...files].take(5).toList();
    });
  }

  Future<void> _openAttachment(String rawUrl) async {
    final resolved = await _apiService.resolveResourceUrl(rawUrl);
    final uri = Uri.tryParse(resolved);

    if (uri == null) {
      return;
    }

    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open this attachment right now.')),
      );
    }
  }

  String _formatTime(dynamic value) {
    final parsed = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (parsed == null) {
      return '';
    }

    final hour = parsed.hour.toString().padLeft(2, '0');
    final minute = parsed.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  List<Map<String, dynamic>> _conversationMessages() {
    final value = _conversation?['messages'];
    if (value is List) {
      return value.whereType<Map<String, dynamic>>().toList();
    }

    return const [];
  }

  List<Map<String, dynamic>> _messagesFromConversation(
    Map<String, dynamic>? conversation,
  ) {
    final value = conversation?['messages'];
    if (value is List) {
      return value.whereType<Map<String, dynamic>>().toList();
    }

    return const [];
  }

  String _messageKey(Map<String, dynamic> message) {
    final id = message['id']?.toString() ?? '';
    if (id.isNotEmpty) {
      return id;
    }

    return [
      message['senderType']?.toString() ?? '',
      message['createdAt']?.toString() ?? '',
      message['text']?.toString() ?? '',
    ].join('|');
  }

  void _syncMessageSound(Map<String, dynamic>? conversation) {
    final messages = _messagesFromConversation(conversation);
    var hasNewIncomingMessage = false;

    for (final message in messages) {
      final key = _messageKey(message);
      final isIncoming = message['senderType']?.toString() != 'visitor';

      if (_hasLoadedConversationOnce &&
          isIncoming &&
          !_seenMessageIds.contains(key)) {
        hasNewIncomingMessage = true;
      }

      _seenMessageIds.add(key);
    }

    _hasLoadedConversationOnce = true;

    if (hasNewIncomingMessage) {
      unawaited(_playIncomingChatSound());
    }
  }

  Future<void> _playIncomingChatSound() async {
    try {
      await _chatSoundChannel.invokeMethod<void>('playIncomingChatSound');
    } catch (_) {
      await SystemSound.play(SystemSoundType.alert);
    }

    await HapticFeedback.mediumImpact();
  }

  Map<String, dynamic>? _selectedAgent() {
    if (_conversation?['assignedTo'] is Map) {
      return Map<String, dynamic>.from(_conversation!['assignedTo'] as Map);
    }

    for (final agent in _agents) {
      if (agent['id']?.toString() == _selectedAgentId) {
        return agent;
      }
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
      children: [
        _ChatHeaderCard(
          title: _conversation == null ? 'Live Chat' : 'Continue Chat',
          subtitle: _conversation == null ? 'Clinic team support' : 'Chat active',
          isLoading: _isLoading,
          onRefresh: () => _loadChat(),
        ),
        const SizedBox(height: 14),
        if (_isLoading && _conversation == null && _agents.isEmpty)
          const _ChatStateCard(
            icon: Icons.sync_rounded,
            title: 'Checking online staff',
            subtitle: 'Please wait while we find available clinic team members.',
          )
        else if (_conversation != null)
          _buildConversationView()
        else if (_agents.isNotEmpty)
          _buildStartChatView()
        else
          _ChatStateCard(
            icon: Icons.medical_services_rounded,
            title: 'No staff online right now',
            subtitle:
                'Please contact us and the clinic team will get back to you.',
            actionLabel: 'Contact Us',
            onAction: widget.onContactPressed,
          ),
      ],
    );
  }

  Widget _buildStartChatView() {
    final selectedAgent = _selectedAgent();

    return _ChatCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Choose who to message',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 14),
          ..._agents.map(
            (agent) => _AgentTile(
              agent: agent,
              selected: agent['id']?.toString() == _selectedAgentId,
              onTap: () {
                setState(() {
                  _selectedAgentId = agent['id']?.toString() ?? '';
                });
              },
            ),
          ),
          const SizedBox(height: 14),
          if (widget.requireVisitorDetails) ...[
            TextField(
              controller: _visitorNameController,
              decoration: const InputDecoration(
                labelText: 'Your name',
                hintText: 'Enter your full name',
                prefixIcon: Icon(Icons.person_rounded),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _visitorContactController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Phone or email',
                hintText: 'So clinic can identify you',
                prefixIcon: Icon(Icons.alternate_email_rounded),
              ),
            ),
            const SizedBox(height: 14),
          ],
          _MessageComposer(
            controller: _messageController,
            error: _error,
            sending: _isSending,
            hintText: 'Message ${selectedAgent?['name']?.toString() ?? 'doctor/staff'}',
            buttonLabel: _isSending ? 'Starting...' : 'Start Chat',
            attachments: _selectedAttachments,
            onPickAttachments: _pickAttachments,
            onRemoveAttachment: (index) {
              setState(() {
                _selectedAttachments = [..._selectedAttachments]..removeAt(index);
              });
            },
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }

  Widget _buildConversationView() {
    final messages = _conversationMessages();
    final agent = _selectedAgent();

    return _ChatCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _AgentAvatar(name: agent?['name']?.toString() ?? 'Clinic'),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      agent?['name']?.toString() ?? 'Clinic Team',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: const Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      agent?['workType']?.toString() ?? 'Available staff',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: const Color(0xFF64748B),
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: _startNewChat,
                child: const Text('New Chat'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          if (messages.isEmpty)
            const _ChatStateCard(
              icon: Icons.chat_bubble_outline_rounded,
              title: 'No messages yet',
              subtitle: 'Send your first message to begin the conversation.',
              compact: true,
            )
          else
            ...messages.map(
              (message) => _MessageBubble(
                message: message,
                time: _formatTime(message['createdAt']),
                onOpenAttachment: _openAttachment,
              ),
            ),
          const SizedBox(height: 12),
          _MessageComposer(
            controller: _messageController,
            error: _error,
            sending: _isSending,
            hintText: 'Type your message',
            buttonLabel: _isSending ? 'Sending...' : 'Send Message',
            attachments: _selectedAttachments,
            onPickAttachments: _pickAttachments,
            onRemoveAttachment: (index) {
              setState(() {
                _selectedAttachments = [..._selectedAttachments]..removeAt(index);
              });
            },
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

class _ChatHeaderCard extends StatelessWidget {
  const _ChatHeaderCard({
    required this.title,
    required this.subtitle,
    required this.isLoading,
    required this.onRefresh,
  });

  final String title;
  final String subtitle;
  final bool isLoading;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF07111F), Color(0xFF1D4ED8), Color(0xFF38BDF8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A2563EB),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
            ),
            child: const Icon(
              Icons.forum_rounded,
              color: Colors.white,
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFFE0F2FE),
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: isLoading ? null : onRefresh,
            borderRadius: BorderRadius.circular(16),
            child: Ink(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
              ),
              child: isLoading
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(
                      Icons.refresh_rounded,
                      color: Colors.white,
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatCard extends StatelessWidget {
  const _ChatCard({
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x100F172A),
            blurRadius: 20,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _AgentTile extends StatelessWidget {
  const _AgentTile({
    required this.agent,
    required this.selected,
    required this.onTap,
  });

  final Map<String, dynamic> agent;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = agent['name']?.toString() ?? 'Clinic Team';
    final workType = agent['workType']?.toString() ?? 'Available staff';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            gradient: selected
                ? const LinearGradient(
                    colors: [Color(0xFFE0F2FE), Color(0xFFDBEAFE)],
                  )
                : null,
            color: selected ? null : const Color(0xFFF8FBFF),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: selected ? const Color(0xFF38BDF8) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            children: [
              _AgentAvatar(name: name),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  color: const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w900,
                                ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const _OnlineDot(),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      workType,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: const Color(0xFF64748B),
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                selected
                    ? Icons.check_circle_rounded
                    : Icons.radio_button_unchecked_rounded,
                color: selected ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AgentAvatar extends StatelessWidget {
  const _AgentAvatar({
    required this.name,
  });

  final String name;

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? 'C' : name.trim()[0].toUpperCase();

    return Container(
      height: 44,
      width: 44,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF38BDF8)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Text(
          initial,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
        ),
      ),
    );
  }
}

class _OnlineDot extends StatelessWidget {
  const _OnlineDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 10,
      width: 10,
      decoration: BoxDecoration(
        color: const Color(0xFF22C55E),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.time,
    required this.onOpenAttachment,
  });

  final Map<String, dynamic> message;
  final String time;
  final Future<void> Function(String url) onOpenAttachment;

  @override
  Widget build(BuildContext context) {
    final isPatient = message['senderType']?.toString() == 'visitor';
    final attachments = (message['attachments'] is List)
        ? (message['attachments'] as List).whereType<Map<String, dynamic>>().toList()
        : const <Map<String, dynamic>>[];

    return Align(
      alignment: isPatient ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
        decoration: BoxDecoration(
          gradient: isPatient
              ? const LinearGradient(
                  colors: [Color(0xFF1D4ED8), Color(0xFF38BDF8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isPatient ? null : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(22),
            topRight: const Radius.circular(22),
            bottomLeft: Radius.circular(isPatient ? 22 : 7),
            bottomRight: Radius.circular(isPatient ? 7 : 22),
          ),
          border: isPatient ? null : Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0D0F172A),
              blurRadius: 12,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message['text']?.toString() ?? '',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isPatient ? Colors.white : const Color(0xFF334155),
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            if (attachments.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: attachments.map((attachment) {
                  final url = attachment['downloadUrl']?.toString() ?? '';
                  final name = attachment['name']?.toString() ?? 'Attachment';

                  return InkWell(
                    onTap: url.isEmpty ? null : () => onOpenAttachment(url),
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                      decoration: BoxDecoration(
                        color: isPatient
                            ? Colors.white.withValues(alpha: 0.16)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: isPatient
                              ? Colors.white.withValues(alpha: 0.18)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.attach_file_rounded,
                            size: 14,
                            color: isPatient ? Colors.white : const Color(0xFF2563EB),
                          ),
                          const SizedBox(width: 4),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 170),
                            child: Text(
                              name,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: isPatient ? Colors.white : const Color(0xFF334155),
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
            if (time.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                time,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: isPatient
                          ? Colors.white.withValues(alpha: 0.62)
                          : const Color(0xFF94A3B8),
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MessageComposer extends StatelessWidget {
  const _MessageComposer({
    required this.controller,
    required this.error,
    required this.sending,
    required this.hintText,
    required this.buttonLabel,
    required this.attachments,
    required this.onPickAttachments,
    required this.onRemoveAttachment,
    required this.onSend,
  });

  final TextEditingController controller;
  final String error;
  final bool sending;
  final String hintText;
  final String buttonLabel;
  final List<AppUploadFile> attachments;
  final VoidCallback onPickAttachments;
  final void Function(int index) onRemoveAttachment;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: controller,
          minLines: 2,
          maxLines: 4,
          decoration: InputDecoration(
            labelText: 'Message',
            hintText: hintText,
            alignLabelWithHint: true,
            prefixIcon: const Padding(
              padding: EdgeInsets.only(bottom: 28),
              child: Icon(Icons.edit_note_rounded),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            OutlinedButton.icon(
              onPressed: sending ? null : onPickAttachments,
              icon: const Icon(Icons.attach_file_rounded),
              label: const Text('Add Image / Doc'),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                attachments.isEmpty
                    ? 'You can send PDF, image, or document files.'
                    : '${attachments.length} attachment${attachments.length == 1 ? '' : 's'} ready',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
          ],
        ),
        if (attachments.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: attachments.asMap().entries.map((entry) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.insert_drive_file_rounded,
                      size: 14,
                      color: Color(0xFF2563EB),
                    ),
                    const SizedBox(width: 6),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 150),
                      child: Text(
                        entry.value.name,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: const Color(0xFF334155),
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: sending ? null : () => onRemoveAttachment(entry.key),
                      child: const Icon(
                        Icons.close_rounded,
                        size: 16,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
        if (error.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF1F2),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Text(
              error,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFFBE123C),
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: sending ? null : onSend,
            icon: sending
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.send_rounded),
            label: Text(buttonLabel),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 15),
              backgroundColor: const Color(0xFF1D4ED8),
            ),
          ),
        ),
      ],
    );
  }
}

class _ChatStateCard extends StatelessWidget {
  const _ChatStateCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.compact = false,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool compact;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(compact ? 22 : 30),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Container(
            height: 56,
            width: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFE0F2FE),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, color: const Color(0xFF2563EB)),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              color: const Color(0xFF0F172A),
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: const Color(0xFF64748B),
              height: 1.5,
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.call_rounded),
                label: Text(actionLabel!),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
