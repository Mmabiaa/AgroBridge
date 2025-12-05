# AgriGPT Module Implementation

## Overview
This module implements a complete AI Assistant (AgriGPT) interface for the AgroBridge platform, providing farmers with conversational AI support for agricultural advice and recommendations.

## Components

### 1. VoiceInput.tsx
**Purpose**: Enables voice-to-text transcription for hands-free interaction with AgriGPT.

**Features**:
- Real-time audio recording with visual feedback
- Audio level visualization during recording
- Integration with `/api/v1/ai/voice/transcribe/` endpoint
- Automatic transcription and text insertion
- Error handling and user feedback via toasts

**Usage**:
```tsx
<VoiceInput
  onTranscript={(text) => setInputMessage(text)}
  disabled={isLoading}
/>
```

### 2. RecommendationsPanel.tsx
**Purpose**: Displays AI-generated recommendations for farming activities.

**Features**:
- Fetches active recommendations from `/api/v1/ai/recommendations/active/`
- Groups recommendations by type (crop, treatment, market, financial)
- Displays confidence scores and priority levels
- Feedback mechanism (helpful/not helpful)
- Metadata display (crop names, prices, ROI, etc.)
- Real-time updates with React Query

**Recommendation Types**:
- **Crop**: Planting suggestions and crop management
- **Treatment**: Disease treatment and pest control
- **Market**: Market prices and selling opportunities
- **Financial**: Budget and financial planning advice

### 3. ConversationManagement.tsx
**Purpose**: Provides conversation management features including archiving, searching, and exporting.

**Features**:
- Archive/unarchive conversations
- Export conversations in multiple formats (JSON, TXT, PDF)
- Search conversations by title
- Dropdown menu for quick actions

**Components**:
- `ConversationManagement`: Dropdown menu with archive and export options
- `ConversationSearch`: Search input with real-time filtering

## API Integration

### Endpoints Used
1. **Conversations**:
   - `GET /api/v1/ai/conversations/` - List conversations
   - `POST /api/v1/ai/conversations/` - Create conversation
   - `DELETE /api/v1/ai/conversations/{id}/` - Delete conversation
   - `POST /api/v1/ai/conversations/{id}/archive/` - Archive conversation
   - `POST /api/v1/ai/conversations/{id}/unarchive/` - Unarchive conversation
   - `GET /api/v1/ai/conversations/search/` - Search conversations
   - `GET /api/v1/ai/conversations/{id}/export/` - Export conversation

2. **Messages**:
   - `GET /api/v1/ai/conversations/{id}/messages/` - Get messages
   - `POST /api/v1/ai/conversations/{id}/send_message/` - Send message

3. **Voice**:
   - `POST /api/v1/ai/voice/transcribe/` - Transcribe audio

4. **Recommendations**:
   - `GET /api/v1/ai/recommendations/active/` - Get active recommendations
   - `POST /api/v1/ai/recommendations/{id}/provide_feedback/` - Submit feedback

## React Query Hooks

### Queries
- `useConversations(params)` - Fetch conversations list
- `useConversationMessages(conversationId)` - Fetch messages for a conversation
- `useSearchConversations(query)` - Search conversations

### Mutations
- `useCreateConversation()` - Create new conversation
- `useSendMessage()` - Send message with optimistic updates
- `useDeleteConversation()` - Delete conversation
- `useArchiveConversation()` - Archive conversation
- `useUnarchiveConversation()` - Unarchive conversation
- `useExportConversation()` - Export conversation

## Features Implemented

### ✅ Task 7.1: Chat Interface
- Conversation list with real-time updates
- Message display with user/assistant differentiation
- Typing indicators and loading states
- Message metadata (confidence, tokens, processing time)
- Quick questions and topic suggestions
- Real-time message synchronization

### ✅ Task 7.2: Voice Input
- Audio recording with visual feedback
- Voice-to-text transcription
- Microphone permission handling
- Audio level visualization
- Error handling and user feedback

### ✅ Task 7.3: AI Recommendations
- Active recommendations display
- Grouped by type (crop, treatment, market, financial)
- Confidence scores and priority indicators
- Feedback mechanism (thumbs up/down)
- Metadata display (crop names, prices, ROI)
- Real-time updates

### ✅ Task 7.4: Conversation Management
- Archive/unarchive functionality
- Search conversations by title
- Export in multiple formats (JSON, TXT, PDF)
- Active/Archived filter tabs
- Delete conversations
- Conversation metadata display

## State Management

### Local State
- `inputMessage`: Current message input
- `currentConversationId`: Active conversation
- `isSending`: Message sending status
- `searchQuery`: Conversation search query
- `showArchived`: Archive filter toggle

### Server State (React Query)
- Conversations list with pagination
- Messages for active conversation
- Active recommendations
- Search results

## Error Handling

1. **Network Errors**: Retry logic with exponential backoff
2. **Validation Errors**: Form validation and user feedback
3. **API Errors**: Toast notifications with error messages
4. **Microphone Errors**: Permission handling and fallback
5. **Transcription Errors**: Graceful degradation

## Performance Optimizations

1. **Optimistic Updates**: Immediate UI updates for better UX
2. **Query Caching**: 5-minute stale time for conversations
3. **Auto-refetch**: Intelligent refetching during message sending
4. **Debounced Search**: Reduced API calls during search
5. **Lazy Loading**: Components loaded on demand

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Color contrast compliance
- Touch-optimized buttons (44x44px minimum)

## Mobile Responsiveness

- Responsive grid layout (1 column on mobile, 5 columns on desktop)
- Touch-optimized interactions
- Mobile-friendly conversation list
- Adaptive font sizes
- Hidden recommendations panel on mobile (can be toggled)

## Future Enhancements

1. **Voice Output**: Text-to-speech for AI responses
2. **Multi-language Support**: Transcription in multiple languages
3. **Conversation Sharing**: Share conversations with other users
4. **Advanced Search**: Filter by date, type, keywords
5. **Conversation Tags**: Organize conversations with custom tags
6. **Batch Operations**: Archive/delete multiple conversations
7. **Recommendation Actions**: Quick actions from recommendations
8. **Offline Support**: Queue messages when offline

## Testing

### Unit Tests
- Component rendering
- User interactions
- State management
- Error handling

### Integration Tests
- API service calls
- React Query hooks
- Optimistic updates
- Error scenarios

### E2E Tests
- Complete conversation flow
- Voice input workflow
- Recommendation feedback
- Export functionality

## Dependencies

- React 18.3+
- React Query 5.56+
- Lucide React (icons)
- Shadcn/ui components
- Axios for HTTP requests
- Web Audio API for voice recording

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: Voice input requires browser support for MediaRecorder API and getUserMedia.
